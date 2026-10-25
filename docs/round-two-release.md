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

Browser tests use the production screens and services with intercepted Supabase
responses. They do not validate the hosted Storage API or create real payments.
To repeat them with Python Playwright installed:

1. Run `node tests/round-two-dev.mjs` in one terminal.
2. Run `python tests/round-two-browser.py` in another.

Both mobile (390 px) and desktop (1440 px) paths cover original registrations,
uploads, persisted statuses, finance approval, organiser correction requests,
and retained payment approval. A new participant is also tested from event page
through roster submission. Screenshots are saved in the ignored
`tests/round-two-screenshots/` directory.

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
