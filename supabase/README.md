# STRIATUM 4.0 — Supabase project

This directory is the source of truth for the database. No Supabase project has
been provisioned yet — nothing here has been run against a live database.

## Layout

```
supabase/
  migrations/
    0001_init.sql       schema: extensions, enums, tables, triggers, indexes
    0002_functions.sql  SECURITY DEFINER functions (atomic state transitions)
    0003_rls.sql        Row Level Security policies (every table)
    0004_storage.sql    storage buckets + storage.objects policies
    0005_free_event_approval.sql  admin approve/reject for PENDING_APPROVAL free-event registrations
    0006_function_hardening.sql   revokes public/anon/authenticated EXECUTE on every privileged
                                   SECURITY DEFINER function and binds p_admin/p_actor to auth.uid()
    0007_search_path_hardening.sql  pins mutable search_path on set_updated_at()/random_token(),
                                     revokes unnecessary handle_new_auth_user() EXECUTE grants, and
                                     adds an ownership check to confirm_free_event_registration()
    0008_pgcrypto_search_path.sql   fixes random_token()'s pinned search_path: pgcrypto lives in the
                                     `extensions` schema on hosted Supabase, not `public` as 0007
                                     assumed — see docs/02-SCHEMA.md §6.3
  seed.sql               reference data only (see docs/02-SCHEMA.md §Seed data)
  README.md               this file
```

Migrations are ordered and depend on each other — always apply 0001 → 0002 →
0003 → 0004 → 0005 → 0006 → 0007 → 0008 in order. `0002_functions.sql` references tables/enums
from `0001_init.sql`; `0003_rls.sql` calls `is_admin()` from
`0002_functions.sql`; `0004_storage.sql` also calls `is_admin()`;
`0005_free_event_approval.sql` calls `is_admin()`, `notify()`, `audit()`,
and `random_token()`, all defined in `0002_functions.sql`. `0006_function_hardening.sql`
`CREATE OR REPLACE`s the privileged functions from `0002` and `0005` (same
signatures/bodies, one added guard) and tightens their `EXECUTE` grants — see
`docs/02-SCHEMA.md` §6.1. `0007_search_path_hardening.sql` pins the two
functions from `0001`/`0002` that still had a mutable `search_path`, revokes
`handle_new_auth_user()`'s unnecessary anon/authenticated EXECUTE grants, and
`CREATE OR REPLACE`s `confirm_free_event_registration()` from `0006` (same
signature/locking/idempotency, one added ownership check) — see
`docs/02-SCHEMA.md` §6.2. `0008_pgcrypto_search_path.sql` corrects
`random_token(integer)`'s pinned `search_path` from `0007` — it wrongly
assumed `pgcrypto` resolves in `public`; on the hosted project it lives in
`extensions`, so every delegate approval and event QR issuance (all of
which call `random_token()`) failed at runtime. `ALTER FUNCTION ... SET
search_path = pg_catalog, extensions, public` fixes this on both the
hosted database and a fresh local db, without changing the function's
signature, body, or grants — see `docs/02-SCHEMA.md` §6.3. `0006`, `0007`,
and `0008` are all safe to apply to an already-migrated database.

## First-time setup (once a Supabase project exists)

```bash
supabase link --project-ref <project-ref>
supabase db push          # applies migrations/*.sql in order
psql "$DATABASE_URL" -f supabase/seed.sql
```

Or, for local development:

```bash
supabase start
supabase db reset         # applies migrations then seed.sql automatically
```

## Auth configuration (done in the Supabase dashboard, not SQL)

- Enable Email (magic link / OTP) and Google providers under
  Authentication → Providers.
- Site URL / Redirect URLs must include `NEXT_PUBLIC_SITE_URL` and its
  `/auth/callback` route (see docs/03-ARCHITECTURE.md).
- The `handle_new_auth_user()` trigger in `0001_init.sql` creates the
  matching `profiles` row automatically on first sign-in — no manual step
  needed per user.

## Granting admin access

There is no self-service admin signup. After a user has signed in once (so a
`profiles` row exists), grant access directly:

```sql
insert into admin_users (user_id, role, created_by)
values ('<profiles.id of the user>', 'SUPER_ADMIN', null);
```

## Storage buckets

| Bucket | Public | Path convention |
|---|---|---|
| `payment-screenshots` | No | `payments/{user_id}/{payment_type}/{submission_uuid}.{ext}` |
| `brand-assets` | Yes | `brand/...`, `payment-qr/{payment_settings_id}.{ext}`, `events/{event_id}/...` |

Full policy intent is documented inline in `0004_storage.sql` and summarized
in `docs/02-SCHEMA.md`.

## Regenerating types

`lib/types/database.ts` in this repo is **hand-written** to mirror this SQL
exactly (per the orchestrator's file-ownership split). If a real Supabase
project is later linked, `supabase gen types typescript` can be used to
cross-check it, but the hand-written file remains authoritative for this
codebase until an agent explicitly resyncs it against a migration change.
