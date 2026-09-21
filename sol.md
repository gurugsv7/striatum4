# STRIATUM 4.0 setup handoff

Updated: 4 September 2026

## Supabase project

I paused the existing `ecare` project after Supabase rejected a third active free-tier project. Its data was not deleted. I then created a new hosted project with these details:

- Name: `STRIATUM 4.0`
- Project ref: `pbxyaqbhpauywixfjjqu`
- Region: `ap-south-1` (Mumbai)
- API URL: `https://pbxyaqbhpauywixfjjqu.supabase.co`
- Status at setup time: `ACTIVE_HEALTHY`

## Database work completed

I applied the migrations separately and in this order:

1. `0001_init`
2. `0002_functions`
3. `0003_rls`
4. `0004_storage`
5. `0005_free_event_approval`
6. `0006_function_hardening`

I then ran `supabase/seed.sql` without changing its data. The seed left event fees, venues, times, and capacities unset and kept `app_settings.launched=false`.

`0002_functions` initially failed with this PostgreSQL error:

```text
ERROR: 42601: too few parameters specified for RAISE
CONTEXT: compilation of PL/pgSQL function "confirm_free_event_registration" near line 45
```

I scanned every `RAISE EXCEPTION` and `RAISE NOTICE` statement in `0002_functions.sql` and `0005_free_event_approval.sql`. Only one statement was malformed. With approval, I changed `supabase/migrations/0002_functions.sql` from:

```sql
raise exception 'event % is at capacity' using errcode = 'P0001';
```

to:

```sql
raise exception 'event % is at capacity', v_event.name using errcode = 'P0001';
```

The migration succeeded after that correction. I made no changes to function signatures, locking, idempotency guards, state transitions, or RLS policies. `0005_free_event_approval.sql` did not need a correction.

I later applied `supabase/migrations/0006_function_hardening.sql` exactly as it existed on disk. I did not edit that file. It replaced the privileged function bodies with guarded versions, revoked execution from `PUBLIC`, `anon`, and `authenticated`, and granted execution to `service_role`.

## Verification results

The live database passed the requested checks:

- All 20 public tables exist.
- RLS is enabled on all 20 tables.
- Every public table has at least one policy.
- `payment-screenshots` exists and is private (`public=false`).
- `brand-assets` exists and is public (`public=true`).
- `approve_delegate_payment` exists.
- `approve_event_payment` exists.
- `approve_free_event_registration` exists.
- `redeem_event_qr` exists.
- `app_settings` contains one row and `launched=false`.
- `payment_settings` contains one row.
- The seed created 4 event types and 24 events.
- None of the 24 events has a fee, venue, start time, end time, or capacity set.

I also tested the `auth.users` to `public.profiles` trigger through the Supabase Auth Admin API. Creating a temporary Auth user produced exactly one matching profile. Deleting the user removed the profile through the cascade. The temporary user and local test script were deleted after the test.

### Function-hardening verification

I called `approve_delegate_payment` through the REST RPC endpoint using only the anon key and dummy UUID arguments. Supabase rejected the request before the function body could inspect those arguments:

```json
{
  "status": 401,
  "code": "42501",
  "message": "permission denied for function approve_delegate_payment",
  "data": null
}
```

The database privilege checks showed `EXECUTE=false` for `PUBLIC`, `anon`, and `authenticated` on every function hardened by `0006`. Each remains executable by `service_role`.

The functions referenced by RLS policies remain available to the required roles. This includes `auth.uid()` and `public.is_admin(uuid)`. I also created a disposable authenticated session and read `events` and `results` through the REST API. Both requests returned HTTP 200. The events query returned one row; the results query returned zero rows because there are no visible result records. I deleted the disposable user afterward.

## Repository changes

I changed or created these local files:

- `supabase/migrations/0002_functions.sql`: fixed the missing argument in the capacity error described above.
- `.env.local`: created with exactly the four requested environment keys. The Supabase URL, anon key, and service-role key are populated; the site URL is `http://localhost:3100`.
- `sol.md`: added this handoff.

I applied `supabase/migrations/0006_function_hardening.sql` to the hosted project but did not modify the repository copy.

`.env.local` is covered by the repository's `.gitignore`. This document does not contain either API key.

## Auth status and remaining work

The project's current public Auth settings report:

- Email provider enabled
- New-user signup enabled
- Email confirmation enabled
- Google provider disabled

The Site URL and redirect allow-list have not been updated yet. The installed Supabase MCP does not expose project-level Auth configuration, and no controllable browser session was available. The user reported completing `supabase login`, but the CLI process available to this workspace still returns `Access token not provided`. It sees neither a token file nor a `SUPABASE_ACCESS_TOKEN` environment variable. Run both commands below in the same Windows account and confirm the second one lists the projects:

```powershell
supabase login
supabase projects list
```

Google OAuth also needs a Google Cloud OAuth 2.0 client:

- Application type: Web application
- Authorized JavaScript origin: `http://localhost:3100`
- Authorized redirect URI: `https://pbxyaqbhpauywixfjjqu.supabase.co/auth/v1/callback`

The Google Client ID and Client Secret must then be added to the Supabase Google provider. Production origins and redirects can be added when the production domain is known.

No permanent Auth user exists yet for `gurugsv777@gmail.com`, so the `SUPER_ADMIN` row has not been inserted. The intended next sequence is:

1. Configure the Site URL as `http://localhost:3100`.
2. Add `http://localhost:3100/**` and `http://localhost:3000/**` to the redirect allow-list.
3. Send a magic link to `gurugsv777@gmail.com` and complete one sign-in.
4. Insert the matching Auth user into `admin_users` with role `SUPER_ADMIN`.
5. Verify the row and confirm `is_admin(user_id)` returns `true`.

`app_settings.launched` remains `false` as requested.

## Security advisor status

I reran the Supabase Security Advisor after applying `0006`. The warnings for privileged functions such as payment approval, event approval, QR redemption, result publishing, notification insertion, and audit insertion are cleared.

Eleven warnings remain, all at `WARN` level:

- Four anon and four authenticated `SECURITY DEFINER` warnings cover `handle_new_auth_user`, `is_admin`, `is_admin_role`, and `issue_registration_code`. `0006` deliberately leaves these callable because the trigger, RLS policies, and participant registration flow need them.
- Two functions, `set_updated_at` and `random_token`, retain mutable-search-path warnings.
- The `citext` extension remains installed in the public schema.

No new warning category appeared after hardening.

## Current stopping point

The permanent user for `gurugsv777@gmail.com` has not been created, the magic link has not been sent, and the `SUPER_ADMIN` row has not been inserted. Auth URL configuration must finish first. Google remains disabled until its Client ID and Client Secret are supplied.

I have not rotated the service-role key or any other project key. `app_settings.launched` remains `false`.

Because the service-role key was shared in chat, rotate it after setup and replace the value in `.env.local`.
