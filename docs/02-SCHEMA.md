# STRIATUM 4.0 — Schema Reference

This is the human-readable companion to `supabase/migrations/`. It is
authoritative for anyone coding against the database — if code and this
document disagree, treat it as a bug and fix the code (or flag the
discrepancy to the owning agent). SQL source of truth lives in:

- `supabase/migrations/0001_init.sql` — tables, enums, triggers, indexes
- `supabase/migrations/0002_functions.sql` — SECURITY DEFINER functions
- `supabase/migrations/0003_rls.sql` — Row Level Security policies
- `supabase/migrations/0004_storage.sql` — storage buckets + policies
- `supabase/migrations/0005_free_event_approval.sql` — admin approve/reject for free events requiring approval
- `supabase/migrations/0006_function_hardening.sql` — hardens every privileged SECURITY DEFINER function against direct-RPC privilege escalation (see §6.1)
- `supabase/migrations/0007_search_path_hardening.sql` — pins mutable `search_path` on `set_updated_at()`/`random_token()`, revokes unnecessary `handle_new_auth_user()` EXECUTE grants, and adds an ownership check to `confirm_free_event_registration()` (see §6.2)
- `supabase/migrations/0008_pgcrypto_search_path.sql` — fixes `random_token()`'s pinned `search_path` to find `pgcrypto` wherever it actually lives (`extensions` on hosted Supabase, `public` on a fresh local db) instead of assuming `public` (see §6.3)
- `supabase/seed.sql` — reference data (programme, form fields, empty settings)

TypeScript mirrors: `lib/types/database.ts` (Row/Insert/Update per table),
`lib/types/enums.ts` (string-union types + label maps).

## 1. Entity list

| Table | Purpose |
|---|---|
| `profiles` | One row per Supabase auth user. Created automatically by a trigger on `auth.users` insert. |
| `admin_users` | Grants console access. Presence of a row = admin. `role` gates which admin actions are allowed. |
| `app_settings` | Single-row: is the site launched, launch date, symposium date range. Drives Coming Soon vs Welcome. |
| `payment_settings` | The manual-payment configuration participants see: fee, payee, UPI id, QR image path, instructions. One `is_active` row at a time; older rows are history. |
| `delegate_form_fields` | Data-driven descriptors for the delegate registration form (baseline fields ship seeded; organizers can add more later without a redeploy). |
| `delegate_applications` | A user's request to become a delegate. One per user. Drives the Delegate Access card state machine. |
| `delegate_id_seq` (sequence) | Backing counter for `issue_delegate_id()` — guarantees unique, gapless-enough `S4-26-####` ids under concurrency. |
| `delegates` | The issued delegate identity: `delegate_id`, `verification_token` (delegate-pass QR payload). Created only by `approve_delegate_payment()`. |
| `event_types` | Category rows (Workshop / Competition / Presentation / Other, seeded) — Explore's filters are built from this table, not hardcoded. |
| `events` | The programme catalogue. Almost every descriptive column is nullable — the UI renders "not announced" rather than inventing data. |
| `event_form_fields` | Same shape as `delegate_form_fields`, scoped per event. |
| `teams` / `team_members` | Team-format event registrations. The team's `lead_registration_id` points back at the owning `event_registrations` row. |
| `event_registration_seq` (sequence) | Backing counter for `issue_registration_code()` (`REG-26-######`). |
| `event_registrations` | A delegate's registration for one event. Unique per (event, delegate) while not cancelled. |
| `payment_submissions` | A screenshot + optional transaction reference submitted for review, for either a delegate application or an event registration (never both). |
| `qr_credentials` | Exactly one row per confirmed `event_registrations` row — the event-pass QR token. Never reused across events, never equal to a delegate `verification_token`. |
| `check_ins` | One row per successful QR redemption at a venue. Unique per `qr_credential_id` — a second scan cannot create a second row. |
| `results` / `result_entries` | Per-event results, `DRAFT` until an admin publishes. `result_entries` rows are free-form (position/label/score) to fit quizzes, presentations, team events alike. |
| `notifications` | Participant-facing feed: payment submitted/approved/rejected, delegate id issued, registration confirmed, QR issued, results published. |
| `audit_log` | Append-only record of every admin approve/reject/publish/settings change, written by the SECURITY DEFINER functions. |

## 2. Relationship diagram (ASCII)

```
auth.users (Supabase managed)
   │ 1:1 (trigger-created)
   ▼
profiles ───────────────────────────────────────────────────────────────┐
   │ 1:1                                    1:1                          │
   ▼                                         ▼                           │
delegate_applications                   admin_users                     │
   │ 1:1 (application_id)                                                │
   ▼                                                                     │
delegates ◄──────────────────────────────────────────── issued_by ──────┘
   │ 1:N
   ▼
event_registrations ──N:1──► events ──N:1──► event_types
   │  │  │                       │
   │  │  └─N:1─► teams ─1:N─► team_members
   │  └─1:1─► qr_credentials ─1:1─► check_ins
   │
   └─1:N─► payment_submissions ──(delegate_application_id XOR event_registration_id)

results ─1:N─► result_entries (event_registration_id / team_id optional links)

notifications, audit_log  — leaf tables, FK back to profiles
payment_settings, app_settings, delegate_form_fields, event_form_fields — configuration, no participant FK
```

Cardinality notes:
- `profiles.id` = `auth.users.id` (shared primary key, cascade delete).
- One `profiles` row maps to **zero or one** `delegate_applications` row (`UNIQUE(user_id)`), and **zero or one** `delegates` row (`UNIQUE(user_id)`, plus `UNIQUE(application_id)` so an application can only ever produce one delegate).
- One `delegates` row maps to **many** `event_registrations` (one per event the delegate registers for).
- One `event_registrations` row maps to **zero or one** `qr_credentials` row, created only on confirmation.
- One `qr_credentials` row maps to **zero or one** `check_ins` row.
- One `payment_submissions` row maps to **exactly one** of `delegate_applications` or `event_registrations` (enforced by a CHECK constraint), never both, never neither.

## 3. Enums and allowed transitions

Every state machine is its own Postgres ENUM — no shared generic `status` column anywhere in the schema.

### `delegate_application_status`
```
DRAFT ──► PAYMENT_PENDING ──► PAYMENT_UNDER_REVIEW ──► APPROVED
                                      │      ▲
                                      ▼      │
                              PAYMENT_REJECTED  (resubmit re-enters PAYMENT_UNDER_REVIEW)
```
Set by: participant writes (`DRAFT`, `PAYMENT_PENDING`), `payment_submissions` insert triggers app-layer transition to `PAYMENT_UNDER_REVIEW`, `approve_delegate_payment()` → `APPROVED`, `reject_delegate_payment()` → `PAYMENT_REJECTED`. A participant can never write `APPROVED` (blocked by RLS).

### `delegate_status` (on `delegates`)
```
ACTIVE ──► REVOKED
```
`ACTIVE` on issuance. `REVOKED` is an admin-only manual action (no dedicated function shipped in 0002 — use a direct admin update; add a `revoke_delegate()` function later if the product needs an audited path).

### `event_registration_status`
```
DRAFT ──► PAYMENT_PENDING ──► PAYMENT_UNDER_REVIEW ──► CONFIRMED
                                      │      ▲
                                      ▼      │
                              PAYMENT_REJECTED  (resubmit re-enters PAYMENT_UNDER_REVIEW)

DRAFT ──► PENDING_APPROVAL ──► CONFIRMED         (free event, requires_admin_approval = true)
DRAFT ──► CONFIRMED                              (free event, no approval required)

any non-terminal state ──► CANCELLED
```
Set by: participant writes (`DRAFT`, `PAYMENT_PENDING`), `approve_event_payment()` / `reject_event_payment()` for paid events, `confirm_free_event_registration()` for free events (this function reads `events.requires_admin_approval` and `events.capacity` to decide the target state). QR issuance happens only on the transition into `CONFIRMED`.

### `payment_submission_status`
```
NOT_SUBMITTED ──► PENDING_REVIEW ──► APPROVED
                        │  ▲
                        ▼  │
                   NEEDS_RESUBMISSION  (participant may replace screenshot, re-enters PENDING_REVIEW)
                        │
                        ▼
                     REJECTED   (terminal — p_allow_resubmit=false)
```
`NOT_SUBMITTED` is a conceptual default (no row exists yet); the column default is `PENDING_REVIEW` because a row is only ever inserted at the moment of submission. `approve_*_payment()` is idempotent: calling it again on an already-`APPROVED` submission is a safe no-op that returns the existing result. `reject_*_payment()` chooses `NEEDS_RESUBMISSION` or `REJECTED` based on the `p_allow_resubmit` flag.

### Check-in state (derived, not a DB enum)
```
NOT_CHECKED_IN ──► CHECKED_IN
```
Represented by the absence/presence of a `check_ins` row for a given `qr_credentials.id` (enforced unique). `redeem_event_qr()` returns `VALID` on first scan and `ALREADY_CHECKED_IN` (with the original timestamp) on every subsequent scan of the same token.

### `result_status` (on both `results` and `events.results_status`)
```
DRAFT ──► PUBLISHED ──► DRAFT   (unpublish)
```
`publish_results()` / `unpublish_results()` keep `events.results_status` in sync with the event's currently-live `results` row. At most one `PUBLISHED` row per event is enforced by a partial unique index; publishing a new round automatically demotes any previously published round for that event back to `DRAFT`.

## 4. Storage buckets

| Bucket | Public | Path convention | Notes |
|---|---|---|---|
| `payment-screenshots` | **No** | `payments/{user_id}/{payment_type}/{submission_uuid}.{ext}` | `{payment_type}` is lowercase `delegate` or `event`. A user may insert/read only under their own `{user_id}` prefix (`storage.foldername(name)[2] = auth.uid()`). Admins may read any object. Nobody gets public access; no update/delete policy exists — a "replace" is a fresh insert. Admin viewing is exclusively via a short-lived (~60s) signed URL minted server-side after an admin check — see docs/03-ARCHITECTURE.md. |
| `brand-assets` | **Yes** | `brand/...` (logo), `payment-qr/{payment_settings_id}.{ext}` (global QR), `events/{event_id}/qr.{ext}` (per-event QR override), `events/{event_id}/cover.{ext}` (optional imagery) | Public read for anon + authenticated; admin-only write/update/delete. |

The DB never stores screenshot binary/base64 — only the `screenshot_storage_path` string. Signed URLs are generated on demand, never persisted.

## 5. RLS intent summary

Full policy text and comments live in `0003_rls.sql` and `0004_storage.sql`; this is the quick-reference version.

| Table | Public / anon | Authenticated owner | Admin |
|---|---|---|---|
| `profiles` | — | read/update own row | read all |
| `admin_users` | — | — | read (no client write path at all) |
| `app_settings` | read | read | read/write |
| `payment_settings` | read (active row) | read (active row) | read/write (incl. history) |
| `delegate_form_fields`, `event_form_fields`, `event_types`, `events` | read | read | read/write |
| `delegate_applications` | — | read/insert/update own, only in `DRAFT`/`PAYMENT_PENDING`/`PAYMENT_REJECTED`; can never set `APPROVED` | read/write |
| `delegates` | — | read own only | read/write (issuance is function-only, no client insert) |
| `teams`, `team_members` | — | read/write own via owning registration, only while `DRAFT`/`PAYMENT_PENDING` | read/write |
| `event_registrations` | — | read own; insert/update own only pre-confirmation states; can never self-set `CONFIRMED`/`PENDING_APPROVAL` | read/write |
| `payment_submissions` | — | read own; insert `PENDING_REVIEW` own; update own only while `PENDING_REVIEW`/`NEEDS_RESUBMISSION`, can never write `APPROVED` | read/write |
| `qr_credentials` | — | read own (via owning registration) | read/write (issuance is function-only) |
| `check_ins` | — | — | read/write only |
| `results`, `result_entries` | read **only** `PUBLISHED` | read only `PUBLISHED` | read/write all (incl. `DRAFT`) |
| `notifications` | — | read/update (mark read) own only | — (not an admin surface) |
| `audit_log` | — | — | read only |

The one hard rule enforced at the RLS layer (not just the UI): a `DRAFT` result is invisible to every non-admin session, and a participant can never write a status value that represents an admin-only transition (`APPROVED`, `CONFIRMED`, `PENDING_APPROVAL`) on any table — those are reachable only through the SECURITY DEFINER functions below.

## 6. Functions (`0002_functions.sql`)

All functions are `SECURITY DEFINER`, run with `search_path = public`, and are safe to call concurrently (row locks via `SELECT ... FOR UPDATE`, plus DB-level unique constraints as the final backstop). Call them via Supabase RPC from server actions — never replicate their logic in client code.

- **`is_admin(p_uid uuid) → boolean`** — true iff `p_uid` has an `admin_users` row.
- **`is_admin_role(p_uid uuid, p_roles admin_role[]) → boolean`** — true iff `p_uid`'s admin role is in the given list.
- **`issue_delegate_id() → text`** — atomically allocates the next `S4-26-%04d` value from `delegate_id_seq`. Never called directly by client code; only from `approve_delegate_payment()`.
- **`issue_registration_code() → text`** — atomically allocates the next `REG-26-%06d` value from `event_registration_seq`.
- **`random_token(n integer default 32) → text`** — `n` crypto-random bytes, base64url-encoded (no padding). Used for both `delegates.verification_token` and `qr_credentials.token`. These two token spaces are never mixed.
- **`notify(...)` / `audit(...)`** — thin insert helpers used internally by the functions below.
- **`approve_delegate_payment(p_submission_id uuid, p_admin uuid, p_note text default null) → delegates`**
  Locks the submission row. If already `APPROVED`, returns the existing `delegates` row unchanged (idempotent — approving twice never issues two delegate ids). Otherwise: marks the submission `APPROVED`, marks the application `APPROVED`, issues a `delegates` row with a fresh `delegate_id` + `verification_token`, inserts a notification, writes an audit log entry. Raises if the caller is not an admin or the submission isn't `PENDING_REVIEW`/`NEEDS_RESUBMISSION`.
- **`reject_delegate_payment(p_submission_id uuid, p_admin uuid, p_reason text, p_note text default null, p_allow_resubmit boolean default true) → payment_submissions`**
  Sets the submission to `NEEDS_RESUBMISSION` (if `p_allow_resubmit`) or `REJECTED`, sets the application to `PAYMENT_REJECTED`, notifies the participant, writes an audit entry. Idempotent on an already-rejected submission (returns as-is). Raises if the submission is already `APPROVED`.
- **`approve_event_payment(p_submission_id uuid, p_admin uuid, p_note text default null) → event_registrations`**
  Same idempotent pattern as delegate approval: locked submission, no-op if already `APPROVED`, otherwise confirms the registration (`CONFIRMED`, `confirmed_at = now()`) and issues exactly one `qr_credentials` row. Never issues a QR while the submission is merely pending.
- **`reject_event_payment(p_submission_id uuid, p_admin uuid, p_reason text, p_note text default null, p_allow_resubmit boolean default true) → payment_submissions`**
  Mirrors `reject_delegate_payment()` for the event-payment path; sets the registration to `PAYMENT_REJECTED`.
- **`confirm_free_event_registration(p_registration_id uuid, p_actor uuid) → event_registrations`**
  For non-paid events only (raises if `events.is_paid`). Locks the registration row, then (as of `0007_search_path_hardening.sql`) raises unless the locked row's `user_id` matches `p_actor` — closing a logic gap where the function trusted `p_registration_id` without checking it actually belongs to the caller. Locks the event row, counts non-cancelled/`CONFIRMED`+`PENDING_APPROVAL` registrations against `events.capacity` (when set) under that lock — so concurrent confirmations cannot oversell capacity — then transitions to `PENDING_APPROVAL` (if `events.requires_admin_approval`) or straight to `CONFIRMED`. QR issuance happens only on the `CONFIRMED` branch. Idempotent: already-settled registrations (`CONFIRMED`/`PENDING_APPROVAL`/`CANCELLED`) are returned unchanged (checked after the ownership check, so a mismatched actor is rejected regardless of status).
- **`approve_free_event_registration(p_registration_id uuid, p_admin uuid, p_note text default null) → event_registrations`** *(0005_free_event_approval.sql)*
  The admin-side completion of the `PENDING_APPROVAL → CONFIRMED` transition that `confirm_free_event_registration()` starts. Locks the registration; idempotent no-op returning the existing row if already `CONFIRMED` (never issues a second QR); raises if called on anything other than `PENDING_APPROVAL`. Otherwise sets `CONFIRMED` + `confirmed_at` + `reviewed_by`/`reviewed_at`, issues exactly one `qr_credentials` row (guarded the same way as `approve_event_payment()`), inserts a notification, writes an audit entry. Caller must be an admin.
- **`reject_free_event_registration(p_registration_id uuid, p_admin uuid, p_reason text, p_note text default null) → event_registrations`** *(0005_free_event_approval.sql)*
  Only valid from `PENDING_APPROVAL`; raises if the registration is already `CONFIRMED`. Idempotent no-op if already `CANCELLED`. Sets the registration to `CANCELLED` (there is no resubmission path for a free-event approval rejection — the participant registers again from a clean state if they choose to), stores `p_reason` in `admin_note` (event_registrations has no separate `rejection_reason` column), notifies the participant, writes an audit entry. Caller must be an admin.
- **`redeem_event_qr(p_token text, p_event_id uuid, p_admin uuid) → qr_redeem_result`**
  Composite return type `{ outcome, participant_name, delegate_id_text, event_name, college, checked_in_at }` where `outcome` is one of `VALID | ALREADY_CHECKED_IN | WRONG_EVENT | INVALID`. Looks up the token in `qr_credentials`; `INVALID` if not found or inactive; `WRONG_EVENT` if the token belongs to a different event than `p_event_id`; on first redemption inserts a `check_ins` row and returns `VALID`; on any subsequent redemption returns `ALREADY_CHECKED_IN` with the original `checked_in_at`. Caller must be an admin.
- **`publish_results(p_result_id uuid, p_admin uuid) → results`**
  Idempotent (no-op if already `PUBLISHED`). Demotes any other `PUBLISHED` round for the same event to `DRAFT` first (so the partial unique index never conflicts), then publishes this round and syncs `events.results_status`.
- **`unpublish_results(p_result_id uuid, p_admin uuid) → results`**
  Idempotent inverse of the above.

### 6.1 Function hardening (`0006_function_hardening.sql`)

Supabase's Security Advisor flagged a privilege-escalation hole: every function above that takes `p_admin` (or `p_actor`) checks that value against `admin_users` / uses it for attribution, but never bound it to the caller's own session — and Postgres grants `EXECUTE` on a new function to `PUBLIC` by default, which `anon` and `authenticated` inherit through PostgREST. That meant anyone who learned or guessed a real admin's `user_id` could call e.g. `approve_delegate_payment` directly via `POST /rest/v1/rpc/approve_delegate_payment` and approve their own payment. `0006_function_hardening.sql` closes this with two independent layers, applied via `CREATE OR REPLACE FUNCTION` so signatures, bodies, locking, status guards, and idempotency behaviour are unchanged:

- **Grant model.** `EXECUTE` is revoked from `public`, `anon`, and `authenticated` and re-granted only to `service_role` for: `approve_delegate_payment`, `reject_delegate_payment`, `approve_event_payment`, `reject_event_payment`, `confirm_free_event_registration`, `approve_free_event_registration`, `reject_free_event_registration`, `redeem_event_qr`, `publish_results`, `unpublish_results`, `issue_delegate_id`, `notify`, `audit`. These are now reachable only through the service-role client the app already uses in `lib/actions/**` (or via `postgres`/the function owner) — never through the anon/authenticated PostgREST roles, regardless of what argument values are supplied.
- **Identity binding.** Each function above gains, as the first statement in its body:
  ```sql
  if auth.uid() is not null and p_admin is distinct from auth.uid() then
    raise exception 'admin identity mismatch' using errcode = '42501';
  end if;
  ```
  (`confirm_free_event_registration` uses `p_actor` in place of `p_admin`, with message `'actor identity mismatch'`.) Under the service-role client `auth.uid()` is `NULL`, so this is a no-op on the app's existing call path — every admin action in `lib/actions/admin.ts` keeps working unchanged. It exists as a second line of defence: even if the grant above were ever accidentally restored, an authenticated session still could not act as a *different* admin, because the function itself now refuses any `p_admin`/`p_actor` argument that doesn't match the caller's own `auth.uid()`. The pre-existing `is_admin(p_admin)` check is kept as-is in every function that had it — this guard is additive, not a replacement.
- **Deliberately left executable** (grants unchanged): `is_admin()` and `is_admin_role()` — pure, non-mutating read helpers; `is_admin(auth.uid())` is called directly inside every RLS policy in `0003_rls.sql`/`0004_storage.sql` and is evaluated as the querying role at policy-check time, so revoking it would break RLS project-wide. `issue_registration_code()` — called directly by the participant's own authenticated session client (not the service-role client) in `registerForEvent()`; it only advances a sequence and has no admin check to bypass. `random_token()` — pure computation with no table access and no privileged data in or out.

### 6.2 Search-path hardening and ownership check (`0007_search_path_hardening.sql`)

Closes three remaining Supabase Security Advisor WARN-level findings, additively and safely against an already-migrated live database (no signature, locking, status-guard, idempotency, or 0006 identity-guard change):

- **Mutable `search_path`.** Every function across `0002_functions.sql`, `0005_free_event_approval.sql`, and `0006_function_hardening.sql` was checked; all but two already carry a pinned `search_path = public`. The two without one:
  - `set_updated_at()` (`0001_init.sql`) — its body only assigns `NEW.updated_at` and calls `now()` (a `pg_catalog` builtin, always implicitly searched regardless of `search_path`). Pinned via `alter function set_updated_at() set search_path = ''`.
  - `random_token(integer)` (`0002_functions.sql`) — its body calls `gen_random_bytes()` unqualified (from `pgcrypto`, installed into `public`), so an empty `search_path` would break it. Pinned instead via `alter function random_token(integer) set search_path = pg_catalog, public`.
- **`handle_new_auth_user()`** (`0001_init.sql`) is installed only as an `AFTER INSERT` trigger on `auth.users` and is never called via RPC anywhere in this codebase. Postgres does not check `EXECUTE` privilege against the triggering role when a trigger fires — the trigger manager invokes the function internally — so `EXECUTE` is revoked from `public`, `anon`, `authenticated` with no effect on the `auth.users -> profiles` trigger.
- **`confirm_free_event_registration()`** gains the ownership check documented in §6 above.

**Remaining advisories after `0007`, accepted deliberately:** the `citext` extension stays installed in `public` (`profiles.email` is typed `citext`; relocating the extension risks breaking that column type on a live database for a cosmetic advisory) — not addressed. `is_admin()`, `is_admin_role()`, and `issue_registration_code()` remain executable by `anon`/`authenticated` for the reasons in §6.1 above and will keep showing as "SECURITY DEFINER function executable by anon/authenticated" in the Advisor — that is intentional.

### 6.3 pgcrypto search-path fix (`0008_pgcrypto_search_path.sql`)

`0007` pinned `random_token(integer)` to `search_path = pg_catalog, public`, assuming — from `0001_init.sql`'s unqualified `create extension if not exists pgcrypto;` — that `pgcrypto` resolves in `public`. Verified against the live hosted database, that assumption is wrong: Supabase provisions `pgcrypto` into a dedicated `extensions` schema, so `random_token(32)` failed with `function gen_random_bytes(integer) does not exist` at runtime — breaking every delegate approval (`approve_delegate_payment`) and every event QR issuance (`approve_event_payment`, `confirm_free_event_registration`, `approve_free_event_registration`), since all four call `random_token()` internally.

`0008_pgcrypto_search_path.sql` fixes this with `alter function random_token(integer) set search_path = pg_catalog, extensions, public;` — adding `extensions` ahead of `public` rather than schema-qualifying the call in the function body (`extensions.gen_random_bytes(...)`). The search_path form was chosen because it tolerates either layout: `extensions` on the hosted project, `public` on a fresh database created from `0001_init.sql` as it stands today. Hard-coding `extensions.` would have coupled the function to the hosted layout and broken local `supabase db reset`. Every other function across `0002_functions.sql`, `0005_free_event_approval.sql`, and `0006_function_hardening.sql` was re-audited for the same bug class (unqualified `pgcrypto`/`uuid-ossp`/`citext` calls) — none found; `random_token()` was the only offender, and every issuance path routes through it rather than calling `gen_random_bytes()` directly. `gen_random_uuid()` was confirmed to be a `pg_catalog` builtin since PostgreSQL 13 (not `pgcrypto`-dependent) and is used only in column `DEFAULT` expressions, which resolve their function reference at column-definition time and are not subject to search_path at all. `0001_init.sql` was deliberately left unchanged — the fix is already schema-agnostic, so relocating pgcrypto's install schema for fresh databases would be cosmetic only, and citext's schema is untouched per instruction.

Seeds only what §3.15 of `00-PRODUCT.md` supplies:
- `app_settings`: one row, `launched = false`, symposium dates `2026-10-13` / `2026-10-18`.
- `payment_settings`: one active row, `delegate_fee_inr = null` and every other configurable field null/false — the UI must render a "fee not announced" state.
- `event_types`: `WORKSHOP`, `COMPETITION`, `PRESENTATION`, `OTHER`.
- `events`: all 24 named events across the six programme days, `registration_open = false`, every descriptive field (venue, time, fee, capacity, eligibility, speakers, rules) left `NULL`.
- `delegate_form_fields`: the six baseline fields (`full_name`, `email`, `mobile`, `college`, `year_of_study`, `student_id`), mirroring the dedicated columns on `delegate_applications` so the form can render data-driven from day one.

**Judgement call the orchestrator should confirm:** the spec does not assign an `event_types` category to each named event. Seed data categorizes by a simple keyword rule (name contains "Workshop" → Workshop; quiz/mystery/ideathon-style competitive formats → Competition; "…Presentation" → Presentation; everything else → Other). This is a display/filtering categorization only — no fee, venue, time, or other invented fact — but the mapping itself was not explicitly specified and should be reviewed by whoever owns event content.
