-- ============================================================================
-- STRIATUM 4.0 — 0004_storage.sql
-- Storage buckets and their access policies.
--
-- Buckets:
--   payment-screenshots  PRIVATE. Path convention:
--     payments/{user_id}/{payment_type}/{submission_uuid}.{ext}
--     payment_type is lowercase: 'delegate' | 'event'.
--     A user may INSERT/SELECT only under their own {user_id} prefix.
--     Admins may SELECT any object. Nobody gets public access — admin
--     viewing happens exclusively via short-lived signed URLs minted
--     server-side (service role) after an admin check, never a public URL.
--
--   brand-assets  PUBLIC READ. Path convention:
--     brand/logo.svg
--     payment-qr/{payment_settings_id}.{ext}        (global QR)
--     events/{event_id}/qr.{ext}                    (per-event QR override)
--     events/{event_id}/cover.{ext}                 (event imagery, if any)
--     Admin write only; anon/authenticated read (it is a public bucket).
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('payment-screenshots', 'payment-screenshots', false)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do update set public = excluded.public;

-- ----------------------------------------------------------------------------
-- payment-screenshots policies
--
-- storage.objects.name is the full object path, e.g.
-- "payments/3f2a.../delegate/9c11....png". (storage.foldername(name))[1] is
-- the user_id path segment for objects under the payments/ prefix.
-- ----------------------------------------------------------------------------
create policy payment_screenshots_insert_own
  on storage.objects
  for insert
  with check (
    bucket_id = 'payment-screenshots'
    and (storage.foldername(name))[1] = 'payments'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy payment_screenshots_select_own
  on storage.objects
  for select
  using (
    bucket_id = 'payment-screenshots'
    and (storage.foldername(name))[1] = 'payments'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy payment_screenshots_select_admin
  on storage.objects
  for select
  using (
    bucket_id = 'payment-screenshots'
    and is_admin(auth.uid())
  );

-- No update/delete policy: a "replace" is implemented as a fresh INSERT for
-- a new submission (or a new path segment) from the application layer, not
-- a mutation of an existing object — keeping the storage layer append-only
-- and avoiding accidental loss of evidence for an already-reviewed payment.

-- ----------------------------------------------------------------------------
-- brand-assets policies — public read, admin write
-- ----------------------------------------------------------------------------
create policy brand_assets_select_public
  on storage.objects
  for select
  using (bucket_id = 'brand-assets');

create policy brand_assets_write_admin
  on storage.objects
  for insert
  with check (
    bucket_id = 'brand-assets'
    and is_admin(auth.uid())
  );

create policy brand_assets_update_admin
  on storage.objects
  for update
  using (
    bucket_id = 'brand-assets'
    and is_admin(auth.uid())
  )
  with check (
    bucket_id = 'brand-assets'
    and is_admin(auth.uid())
  );

create policy brand_assets_delete_admin
  on storage.objects
  for delete
  using (
    bucket_id = 'brand-assets'
    and is_admin(auth.uid())
  );

-- ============================================================================
-- END 0004_storage.sql
-- ============================================================================
