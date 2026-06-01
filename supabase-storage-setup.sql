-- Run this once in the Supabase SQL Editor to support therapist image uploads.
-- This keeps therapist images in Supabase Storage and stores only public URLs in public.therapists.image.
--
-- Note: this direct-browser upload policy matches the current static-site portal.
-- For stricter security, use a Supabase Edge Function that validates footprints staff sessions
-- and uploads with the service role instead of allowing anon Storage inserts.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'therapist-images',
  'therapist-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read therapist images" on storage.objects;
create policy "Public can read therapist images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'therapist-images');

drop policy if exists "Portal can upload therapist images" on storage.objects;
create policy "Portal can upload therapist images"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'therapist-images');

drop policy if exists "Portal can replace therapist images" on storage.objects;
create policy "Portal can replace therapist images"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'therapist-images')
with check (bucket_id = 'therapist-images');
