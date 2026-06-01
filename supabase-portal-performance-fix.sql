-- Run this in Supabase SQL Editor if the therapist portal shows:
-- "Access lookup failed: canceling statement due to statement timeout"
--
-- It keeps the same portal features, but makes the admin list lightweight:
-- 1. Admin list no longer loads the heavy therapists.image column for every row.
-- 2. A full therapist profile is loaded only after clicking Edit.
-- 3. Helpful indexes are added for the session and admin-list queries.

create index if not exists therapists_active_name_idx
  on public.therapists (name)
  where is_active = true;

create index if not exists therapists_name_idx
  on public.therapists (name);

create index if not exists staff_users_lower_email_idx
  on public.staff_users (lower(email));

create index if not exists staff_users_therapist_role_idx
  on public.staff_users (therapist_id, role);

create index if not exists staff_sessions_expires_at_idx
  on public.staff_sessions (expires_at);

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
      null::text as image,
      t.title,
      t.location,
      '{}'::text[] as specialties,
      '{}'::text[] as languages,
      '{}'::text[] as therapy_types,
      t.price,
      t.availability,
      ''::text as summary,
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

drop function if exists public.footprints_get_portal_therapist(text, text);
create or replace function public.footprints_get_portal_therapist(
  p_token text,
  p_therapist_id text
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
begin
  select *
  into v_session
  from public.footprints_get_staff_session(p_token)
  limit 1;

  if not found then
    raise exception 'Invalid or expired session';
  end if;

  if v_session.role <> 'admin' and v_session.therapist_id <> p_therapist_id then
    raise exception 'You can only view your own profile';
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
  where t.id = p_therapist_id
  limit 1;
end;
$$;

grant execute on function public.footprints_list_portal_therapists(text) to anon, authenticated;
grant execute on function public.footprints_get_portal_therapist(text, text) to anon, authenticated;

analyze public.therapists;
analyze public.staff_users;
analyze public.staff_sessions;
