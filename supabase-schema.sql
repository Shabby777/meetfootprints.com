-- This script only creates and secures therapist-management objects.
-- It does not alter, drop, or rename the existing public.bookings table.

create extension if not exists pgcrypto;

create table if not exists public.therapists (
  id text primary key,
  email text unique,
  name text not null,
  image text,
  title text,
  location text,
  specialties text[] not null default '{}',
  languages text[] not null default '{}',
  therapy_types text[] not null default '{}',
  price numeric,
  availability text not null default 'Available',
  summary text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('admin', 'therapist')),
  therapist_id text references public.therapists(id) on delete set null,
  password_hash text,
  password_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_sessions (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null references public.staff_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.staff_users add column if not exists password_hash text;
alter table public.staff_users add column if not exists password_updated_at timestamptz;
alter table public.staff_users drop constraint if exists staff_users_email_domain_check;
alter table public.staff_users
  add constraint staff_users_email_domain_check
  check (lower(trim(email)) like '%@footprintstofeelbetter.com');

create or replace function public.footprints_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists therapists_set_updated_at on public.therapists;
create trigger therapists_set_updated_at
before update on public.therapists
for each row
execute function public.footprints_set_updated_at();

drop trigger if exists staff_users_set_updated_at on public.staff_users;
create trigger staff_users_set_updated_at
before update on public.staff_users
for each row
execute function public.footprints_set_updated_at();

create or replace function public.footprints_hash_token(p_token text)
returns text
language sql
immutable
as $$
  select encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
$$;

create or replace function public.footprints_jsonb_text_array(p_value jsonb)
returns text[]
language sql
immutable
as $$
  select coalesce(array(select jsonb_array_elements_text(coalesce(p_value, '[]'::jsonb))), '{}')
$$;

create or replace function public.footprints_get_staff_session(p_token text)
returns table (
  staff_user_id uuid,
  email text,
  role text,
  therapist_id text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.staff_sessions%rowtype;
  v_user public.staff_users%rowtype;
begin
  select *
  into v_session
  from public.staff_sessions
  where token_hash = public.footprints_hash_token(p_token)
  limit 1;

  if not found or v_session.expires_at <= now() then
    delete from public.staff_sessions
    where token_hash = public.footprints_hash_token(p_token);
    return;
  end if;

  update public.staff_sessions
  set last_seen_at = now()
  where public.staff_sessions.id = v_session.id;

  select *
  into v_user
  from public.staff_users
  where public.staff_users.id = v_session.staff_user_id;

  if not found then
    return;
  end if;

  return query
  select
    v_user.id,
    lower(v_user.email),
    v_user.role,
    v_user.therapist_id,
    v_session.expires_at;
end;
$$;

create or replace function public.footprints_create_staff_session(p_email text, p_password text)
returns table (
  session_token text,
  email text,
  role text,
  therapist_id text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.staff_users%rowtype;
  v_token text;
  v_expires_at timestamptz := now() + interval '7 days';
begin
  delete from public.staff_sessions as s
  where s.expires_at <= now();

  if lower(trim(coalesce(p_email, ''))) not like '%@footprintstofeelbetter.com' then
    raise exception 'Only @footprintstofeelbetter.com email addresses are allowed';
  end if;

  select *
  into v_user
  from public.staff_users as su
  where lower(su.email) = lower(trim(coalesce(p_email, '')))
  limit 1;

  if not found or v_user.password_hash is null or extensions.crypt(coalesce(p_password, ''), v_user.password_hash) <> v_user.password_hash then
    raise exception 'Invalid email or password';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.staff_sessions (
    staff_user_id,
    token_hash,
    expires_at
  )
  values (
    v_user.id,
    public.footprints_hash_token(v_token),
    v_expires_at
  );

  return query
  select
    v_token,
    lower(v_user.email),
    v_user.role,
    v_user.therapist_id,
    v_expires_at;
end;
$$;

create or replace function public.footprints_destroy_staff_session(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.staff_sessions
  where token_hash = public.footprints_hash_token(p_token);
end;
$$;

drop function if exists public.footprints_list_portal_therapists(text);
create or replace function public.footprints_list_portal_therapists(p_token text)
returns table (
  id text,
  email text,
  name text,
  image text,
  title text,
  location text,
  specialties text[],
  languages text[],
  therapy_types text[],
  price numeric,
  availability text,
  summary text,
  is_active boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
begin
  select *
  into v_session
  from public.footprints_get_staff_session(p_token)
  limit 1;

  if not found then
    raise exception 'Invalid or expired session';
  end if;

  if v_session.role = 'admin' then
    return query
    select
      t.id,
      su.email,
      t.name,
      t.image,
      t.title,
      t.location,
      t.specialties,
      t.languages,
      t.therapy_types,
      t.price,
      t.availability,
      t.summary,
      t.is_active,
      t.updated_at
    from public.therapists t
    left join public.staff_users su
      on su.therapist_id = t.id
      and su.role = 'therapist'
    order by t.name asc;
    return;
  end if;

  return query
  select
    t.id,
    v_session.email,
    t.name,
    t.image,
    t.title,
    t.location,
    t.specialties,
    t.languages,
    t.therapy_types,
    t.price,
    t.availability,
    t.summary,
    t.is_active,
    t.updated_at
  from public.therapists t
  where t.id = v_session.therapist_id
  limit 1;
end;
$$;

drop function if exists public.footprints_save_therapist_profile(text, jsonb, text);
create or replace function public.footprints_save_therapist_profile(
  p_token text,
  p_therapist jsonb,
  p_password text default null
)
returns table (
  id text,
  email text,
  name text,
  image text,
  title text,
  location text,
  specialties text[],
  languages text[],
  therapy_types text[],
  price numeric,
  availability text,
  summary text,
  is_active boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_existing public.therapists%rowtype;
  v_existing_staff_user public.staff_users%rowtype;
  v_target_id text;
  v_email text;
  v_name text;
  v_image text;
  v_title text;
  v_location text;
  v_specialties text[];
  v_languages text[];
  v_therapy_types text[];
  v_price numeric;
  v_availability text;
  v_summary text;
begin
  select *
  into v_session
  from public.footprints_get_staff_session(p_token)
  limit 1;

  if not found then
    raise exception 'Invalid or expired session';
  end if;

  v_target_id := nullif(trim(coalesce(p_therapist ->> 'id', '')), '');
  v_name := trim(coalesce(p_therapist ->> 'name', ''));
  v_email := lower(nullif(trim(coalesce(p_therapist ->> 'email', '')), ''));
  v_image := nullif(trim(coalesce(p_therapist ->> 'image', '')), '');
  v_title := trim(coalesce(p_therapist ->> 'title', ''));
  v_location := trim(coalesce(p_therapist ->> 'location', ''));
  v_specialties := public.footprints_jsonb_text_array(p_therapist -> 'specialties');
  v_languages := public.footprints_jsonb_text_array(p_therapist -> 'languages');
  v_therapy_types := public.footprints_jsonb_text_array(p_therapist -> 'therapyTypes');
  v_availability := coalesce(nullif(trim(coalesce(p_therapist ->> 'availability', '')), ''), 'Available');
  v_summary := trim(coalesce(p_therapist ->> 'summary', ''));

  if nullif(trim(coalesce(p_therapist ->> 'price', '')), '') is null then
    v_price := null;
  else
    v_price := (p_therapist ->> 'price')::numeric;
  end if;

  if v_name = '' then
    raise exception 'Name is required';
  end if;

  if v_target_id is null then
    if v_session.role <> 'admin' then
      raise exception 'Only admins can create therapist profiles';
    end if;

    v_target_id := regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g');
    v_target_id := trim(both '-' from v_target_id) || '-' || floor(extract(epoch from now()))::bigint;
  end if;

  if v_session.role = 'therapist' and v_target_id <> v_session.therapist_id then
    raise exception 'You can only edit your own profile';
  end if;

  if v_email is not null then
    if v_email not like '%@footprintstofeelbetter.com' then
      raise exception 'Only @footprintstofeelbetter.com email addresses are allowed';
    end if;

    select *
    into v_existing_staff_user
    from public.staff_users
    where lower(public.staff_users.email) = v_email
    limit 1;

    if found
      and v_existing_staff_user.role = 'admin'
      and (
        v_session.role <> 'admin'
        or v_existing_staff_user.therapist_id is distinct from v_target_id
      ) then
      raise exception 'This email is already reserved for an admin account';
    end if;
  end if;

  select *
  into v_existing
  from public.therapists as t_existing
  where t_existing.id = v_target_id
  limit 1;

  insert into public.therapists (
    id,
    email,
    name,
    image,
    title,
    location,
    specialties,
    languages,
    therapy_types,
    price,
    availability,
    summary,
    is_active
  )
  values (
    v_target_id,
    v_email,
    v_name,
    coalesce(v_image, 'data/portraits/portrait.svg'),
    v_title,
    v_location,
    v_specialties,
    v_languages,
    v_therapy_types,
    v_price,
    v_availability,
    v_summary,
    true
  )
  on conflict on constraint therapists_pkey do update set
    email = excluded.email,
    name = excluded.name,
    image = excluded.image,
    title = excluded.title,
    location = excluded.location,
    specialties = excluded.specialties,
    languages = excluded.languages,
    therapy_types = excluded.therapy_types,
    price = excluded.price,
    availability = excluded.availability,
    summary = excluded.summary,
    is_active = true;

  if v_session.role = 'admin' and v_existing.email is distinct from null then
    update public.staff_users
    set therapist_id = null
    where public.staff_users.role = 'therapist'
      and lower(public.staff_users.email) = lower(v_existing.email)
      and lower(coalesce(public.staff_users.email, '')) <> lower(coalesce(v_email, ''));
  end if;

  if v_email is not null then
    insert into public.staff_users (
      email,
      role,
      therapist_id,
      password_hash
    )
    values (
      v_email,
      'therapist',
      v_target_id,
      case
        when nullif(coalesce(p_password, ''), '') is not null then extensions.crypt(p_password, extensions.gen_salt('bf'))
        else null
      end
    )
    on conflict on constraint staff_users_email_key do update set
      role = case
        when public.staff_users.role = 'admin' then public.staff_users.role
        else excluded.role
      end,
      therapist_id = case
        when public.staff_users.role = 'admin' then public.staff_users.therapist_id
        else excluded.therapist_id
      end,
      password_hash = case
        when nullif(coalesce(p_password, ''), '') is not null then extensions.crypt(p_password, extensions.gen_salt('bf'))
        else public.staff_users.password_hash
      end,
      password_updated_at = case
        when nullif(coalesce(p_password, ''), '') is not null then now()
        else public.staff_users.password_updated_at
      end;

    delete from public.staff_users
    where public.staff_users.role = 'therapist'
      and public.staff_users.therapist_id = v_target_id
      and lower(public.staff_users.email) <> v_email;
  elsif v_session.role = 'admin' then
    delete from public.staff_users
    where public.staff_users.role = 'therapist'
      and public.staff_users.therapist_id = v_target_id;
  elsif nullif(coalesce(p_password, ''), '') is not null then
    update public.staff_users
    set
      password_hash = extensions.crypt(p_password, extensions.gen_salt('bf')),
      password_updated_at = now()
    where public.staff_users.role = 'therapist'
      and public.staff_users.therapist_id = v_target_id;
  end if;

  return query
  select
    t.id,
    su.email,
    t.name,
    t.image,
    t.title,
    t.location,
    t.specialties,
    t.languages,
    t.therapy_types,
    t.price,
    t.availability,
    t.summary,
    t.is_active,
    t.updated_at
  from public.therapists t
  left join public.staff_users su
    on su.therapist_id = t.id
    and su.role = 'therapist'
  where t.id = v_target_id
  limit 1;
end;
$$;

create or replace function public.footprints_delete_therapist_profile(p_token text, p_therapist_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
begin
  select *
  into v_session
  from public.footprints_get_staff_session(p_token)
  limit 1;

  if not found or v_session.role <> 'admin' then
    raise exception 'Only admins can delete therapist profiles';
  end if;

  delete from public.staff_users
  where public.staff_users.role = 'therapist'
    and public.staff_users.therapist_id = p_therapist_id;

  delete from public.therapists
  where public.therapists.id = p_therapist_id;
end;
$$;

alter table public.therapists enable row level security;
alter table public.staff_users enable row level security;
alter table public.staff_sessions enable row level security;

drop policy if exists "Public can read active therapists" on public.therapists;
create policy "Public can read active therapists"
on public.therapists
for select
to anon, authenticated
using (is_active = true);

revoke all on public.staff_users from anon, authenticated;
revoke all on public.staff_sessions from anon, authenticated;

grant execute on function public.footprints_create_staff_session(text, text) to anon, authenticated;
grant execute on function public.footprints_get_staff_session(text) to anon, authenticated;
grant execute on function public.footprints_destroy_staff_session(text) to anon, authenticated;
grant execute on function public.footprints_list_portal_therapists(text) to anon, authenticated;
grant execute on function public.footprints_save_therapist_profile(text, jsonb, text) to anon, authenticated;
grant execute on function public.footprints_delete_therapist_profile(text, text) to anon, authenticated;
