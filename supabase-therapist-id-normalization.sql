-- One-time cleanup for therapist IDs that were saved as `name-1234567890`.
-- Run this only after reviewing the rows it will touch.
--
-- What it does:
-- 1. Converts therapist IDs from `ram-1781794126` to `ram`.
-- 2. Updates `staff_users.therapist_id` to match the new therapist IDs.
-- 3. Updates `public.bookings.therapist_id` too, if that table/column exists.
-- 4. Stops early if two therapists would collapse into the same slug.
-- 5. Leaves therapist names and email addresses unchanged.

begin;

do $$
declare
  fk_sql text;
begin
  if exists (
    select 1
    from (
      select
        regexp_replace(lower(trim(coalesce(name, ''))), '[^a-z0-9]+', '-', 'g') as new_id,
        count(*) as row_count
      from public.therapists
      where id ~ '-\d+$'
      group by regexp_replace(lower(trim(coalesce(name, ''))), '[^a-z0-9]+', '-', 'g')
      having count(*) > 1
    ) collisions
  ) then
    raise exception 'Therapist slug collision detected inside the cleanup set. Resolve duplicate names before running this cleanup.';
  end if;

  create temporary table therapist_id_map on commit drop as
  select
    id as old_id,
    regexp_replace(lower(trim(coalesce(name, ''))), '[^a-z0-9]+', '-', 'g') as new_id
  from public.therapists
  where id ~ '-\d+$';

  if exists (
    select 1
    from therapist_id_map
    where new_id is null or btrim(new_id, '-') = ''
  ) then
    raise exception 'One or more therapist names cannot be converted into a valid slug. Please fix the name first.';
  end if;

  if exists (
    select 1
    from therapist_id_map m
    join public.therapists existing
      on existing.id = m.new_id
     and existing.id <> m.old_id
  ) then
    raise exception 'A cleaned therapist slug already exists in public.therapists. Please rename that profile before running this cleanup.';
  end if;

  select pg_get_constraintdef(c.oid)
  into fk_sql
  from pg_constraint c
  join pg_class child on child.oid = c.conrelid
  join pg_namespace child_ns on child_ns.oid = child.relnamespace
  where c.conname = 'staff_users_therapist_id_fkey'
    and child_ns.nspname = 'public'
    and child.relname = 'staff_users';

  if fk_sql is not null then
    execute 'alter table public.staff_users drop constraint staff_users_therapist_id_fkey';
  end if;

  update public.therapists t
  set id = m.new_id
  from therapist_id_map m
  where t.id = m.old_id;

  update public.staff_users su
  set therapist_id = m.new_id
  from therapist_id_map m
  where su.therapist_id = m.old_id;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bookings'
      and column_name = 'therapist_id'
  ) then
    execute '
      update public.bookings
      set therapist_id = m.new_id
      from therapist_id_map m
      where public.bookings.therapist_id = m.old_id
    ';
  end if;

  if fk_sql is not null then
    execute format(
      'alter table public.staff_users add constraint staff_users_therapist_id_fkey %s',
      fk_sql
    );
  end if;
end
$$;

commit;
