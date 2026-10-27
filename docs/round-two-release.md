# Round 2 fees and submissions

This release is for Supabase project `nvuzxbexsleajcjwbxpm`. The migration is
included in the PR; it has not been applied to the production project.

| Event | Round 2 fee |
| --- | --- |
| LUMINARA | ₹400 per team |
| The Diagnostic Abyss | ₹400 per entry |
| Coral Canvas | ₹300 solo / ₹400 for two |
| Chironex | ₹300 solo / ₹400 for two |
| Neuronova | ₹500 per team |
| The Uncharted | ₹300 solo |

Existing registrants use **My Events → Continue to Round 2**. Each registration
in a bulk Round 1 order has its own Round 2 entry and fee. A previous payment
does not settle Round 2. The original orders, abstracts and payment proofs are
not updated, deleted, copied into new evidence, or repriced by this migration.

New participants complete the existing roster form. The server validates it,
creates an original registration anchor, and creates the separate Round 2 fee
record in one transaction. Its zero-value original order is labelled
`Round 2 fee tracked separately`; it is not a Round 2 payment. The registration
anchor does not mean Round 2 is confirmed: both Round 2 statuses must be approved.
No new submission deadline has been assumed. Neuronova's form uses the existing
database limit of three participants, correcting the old frontend limit of four.

Participants pay the existing symposium UPI account and upload a separate Round 2
abstract and payment proof. Finance reviews payments in the finance console;
event admins review abstracts in the event dashboard. Either rejection requires
a reason. Resubmission retains any already approved component, so an abstract
correction never requires a second payment. Every submitted attempt and file is
retained; stale or repeated reviews are refused by the server.

## Access and integrity

- Tables are readable through RLS by their owner and existing admins. Only the
  validated RPCs can write them; participants cannot set a fee or approval.
- Private buckets: `round-two-abstracts` (10 MB) and `round-two-payments` (5 MB).
  Uploads use `user_id/entry_id/random-filename`. The database checks the object
  exists, its metadata, and its entry ownership before accepting submission.
- Owners can read their files; admins can read abstracts; only finance admins
  can read others' payment proofs. Links expire after 60 seconds. There are no
  participant UPDATE or DELETE policies on Round 2 objects.
- RPCs have explicit grants, authentication/authorization checks, and an empty
  search path. Internal fee calculation is in an unexposed private schema.
- The original `create_order(jsonb)` implementation is retained under an
  uncallable internal name. Its public wrapper blocks the six Round 2 events so
  stale clients cannot bypass the new fees. Other events retain the old checkout.
- Refreshing the app preserves staged files in memory; signing out clears them.
  A full browser reload before submission still requires selecting files again.
  Uploads interrupted before submission may leave private, unreferenced files;
  no cleanup job deletes evidence automatically.

## Verification

Run `npm ci`, `npm test`, `node scripts/verify-final-brochure.mjs`, and
`npm run build`. PostgreSQL tests run in PGlite with synthetic users and
Supabase-owned auth/storage scaffolding. They replay the existing migrations,
then exercise fees, ownership/RLS, private files, immutable evidence, historical
preservation, multi-entry orders, closed/full events, review retries, and the
unchanged checkout for other events. The harness preloads the existing
`reject_delegate` definition where old migration ordering requires it.

The current browser suite starts isolated Vite and synthetic HTTP servers, then
runs the production screens and Supabase SDK against real local request bodies
and CORS. Run `npx playwright install chromium`, then `npm run test:e2e`.
It never contacts the hosted backend or creates real payments. The older Python
interception harness remains available for reference.

The 17 browser scenarios cover 360/390/430/1440 px, binary uploads, both transport
routes, lost upload and RPC responses, terminal permission errors, session
refresh, reload recovery, rerenders, duplicate submit attempts, the two-step
draft removal, four-person NEURONOVA registration at ₹500, browser back/forward,
finance approval and organiser correction retaining the approved proof. The
suite waits for the startup overlay to release the page before typing. Set
`R2_ARTIFACTS` to change the screenshot directory (default: ignored
`tests/round-two-screenshots/`).

## 27 October upload investigation and forward fix

Confirmed defects: cached upload paths and uncertain writes were memory-only;
errors/progress and review reasons could disappear with the app's DOM remounts;
an existing payment-proof object did not protect an otherwise draft entry from
removal; the NEURONOVA catalogue still advertised three in the database; the
database test loader and a migration guard could not replay the current chain.

The client now snapshots a selected file immediately and uploads an ArrayBuffer
with an allowlisted MIME through the SDK's binary route, rather than passing the
same native File to multipart on both routes. Empty/generic Android MIME values
are inferred only for supported extensions; explicit unsupported MIME remains
blocked. File reads, session checks and Round 2 requests have deadlines. There
is one direct attempt and one signed fallback only for transport errors, with
same-path existence/size/MIME reconciliation before retry. Server rejection is
terminal. Mutating RPC retries are explicitly disabled.

Tab-scoped recovery stores only server-object paths/name/size/MIME, expires after
24 hours and clears on sign-out/account switch. It never persists file bodies
or credentials. A reload verifies those immutable objects before submission;
files not yet uploaded must be reselected. Ambiguous final RPC results are
reconciled against the latest attempt, including an attempt already reviewed.
Approved components are never uploaded again. Progress/errors and review reasons
survive DOM remounts; same-tab duplicate submit/remove is locked.

The migration `protect_round_two_payment_uploads` also blocks REMOVE when proof
exists. A private, non-client-executable Storage INSERT trigger locks the matching
entry and validates its owner/path/state, so a late signed-capability upload
cannot create evidence for an already removed/submitted entry. It does not
modify existing Storage rows, bytes or historical ledgers. Existing Storage RLS,
private buckets, size/MIME limits and review permissions remain enforced.
The file was generated with Supabase CLI and ordered after the previously
future-dated draft-removal migration.

Diagnostics are opt-in via **Copy upload diagnostics**. The bounded in-memory
report contains build marker, coarse browser/platform, phase, elapsed time,
HTTP status, safe request ID, file size/MIME and network/visibility state. It
contains no identity, filename, object path, full URL, file bytes, tokens or raw
error text, and is not automatically transmitted.

Live checks confirmed successful POST/PUT CORS preflights and allowed request
headers. Logs included Android/Samsung preflight, listing and signing requests
without corresponding stored-body errors, alongside successful mobile uploads.
This does not identify a unique cause for each participant's `Failed to fetch`.
A Windows Chromium disk-file mutation experiment did not reproduce the native
file failure. An unreadable provider was reproduced as a controlled fixture;
both real local HTTP interruption and recovery paths passed.

Validation: 25 Node/PGlite tests, 17 browser scenarios, TypeScript/Vite production
build, brochure verifier, live negative cross-user RLS/RPC tests in rolled-back
transactions, and live schema/bucket/permission inspection. No participant
submission or payment was created, modified or deleted. Hosted authenticated
upload, a physical Android document provider/UPI handoff, and WebView-specific
behavior remain unverified; use a dedicated test account/entry and an affected
device's copied diagnostics to close that gap. Do not describe the original
Android issue as conclusively solved on this evidence alone.

The dependency audit still reports existing Vite/esbuild/source-map-js build/dev
advisories. Supabase also retains pre-existing advisor warnings (including
password-leak protection and exposed definer functions); no new warning names
the private guard. Those broader upgrades/permission changes are outside this
Round 2 fix.

## Release and hosted smoke test

Review and merge the PR before releasing. Apply
`supabase/migrations/20261025195658_round_two_entries.sql` through the normal
Supabase migration workflow, then release the matching frontend. Coordinate
these steps: an old client attempting one of the six events after migration is
deliberately told to use the Round 2 flow. No edge functions or new secrets are
required. Do not regenerate or reapply the historical event seed as a fee update.

Before opening access, use an approved test account to check a private upload,
another account's inability to read it, finance-only proof access, both review
steps, and a correction that retains payment approval. Confirm public bucket
flags remain false and run the Supabase security advisors. This hosted smoke
test remains a release gate; local PG and intercepted browser tests cannot
establish hosted service configuration. Do not collect a real payment for a test.

If a release issue occurs, retain all Round 2 tables/files and use a forward fix.
Do not drop the ledger or restore historical records from this PR: none were
changed. Re-enabling the old free checkout for these six events would defeat the
Round 2 fee rule.
