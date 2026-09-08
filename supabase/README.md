# STRIATUM 4.0 — Supabase backend

Prepared but **not yet applied**. Nothing has been run against any Supabase
project. Apply these once the new account's connector is attached.

## Apply order

1. `migrations/20260909000001_striatum_core.sql` — schema, RLS, RPCs, storage bucket
2. `seed/events_seed.sql` — the 26 events with their brochure prices and capacities
3. Make yourself an admin (replace with your auth user id):

   ```sql
   insert into public.admins (user_id) values ('<your-auth-user-uuid>');
   ```

## Why the writes go through functions, not tables

`orders` has **no INSERT policy for delegates**. An order can only be created by
`create_order(p_items jsonb)`, which receives *what* the delegate wants, never
*what it costs*:

```jsonb
[{"event_id": "s4-07", "participation": "individual"}]
```

The function then re-reads every price from `public.events`, re-checks the
Delegate Pass requirement, duplicate registrations, and remaining capacity under
`SELECT … FOR UPDATE`, applies the best active discount rule, and computes the
total server-side. A tampered client cannot pay ₹1 for a ₹1,800 order.

`approve_order()` inserts every registration for the order in one transaction, so
approval can never half-succeed and leave someone paid up but unregistered.

## Pricing phase

The brochure gives early-bird and late-bird fees but **no cutoff date**, so the
phase is an explicit organiser switch rather than a guessed date:

```sql
update public.app_settings set value = '"late"'::jsonb where key = 'pricing_phase';
```

## Bundle discount

`discount_rules` ships with one rule, **inactive, value 0** — the rule is not
finalised, so nothing is invented. When organisers decide, update that row (or
insert another) and both the cart preview and `create_order` pick it up with no
code change.

## Payment proofs

Bucket `payment-proofs` is **private** (5 MB cap, JPEG/PNG only). Objects are
keyed `<user_id>/<order_id>.<ext>`. Storage policies let a delegate write and
read only their own folder; admins can read all. Displaying one requires a
short-lived signed URL — there is no public URL for a payment screenshot.

The client still sniffs magic bytes before upload (see `prepareProof` in
`src/services/registrationService.ts`); the bucket's `allowed_mime_types` is the
second line of defence, not the only one.

### Why not a free image host

Third-party free image hosts (ImgBB, Imgur, and similar) hand back **public
URLs**. A payment screenshot carries a bank or UPI handle, an amount and a
transaction reference, so a public URL means anyone holding or guessing the link
can read a delegate's financial details. That is exactly what the build brief
(§10) forbids.

It is also unnecessary. Screenshots are downscaled to a 1400 px long edge at
JPEG q0.86 before storage, which lands around **300 KB**:

| | |
|---|---|
| 1,000 screenshots × ~300 KB | ~300 MB |
| Supabase free file storage | 1 GB |

Roughly three times the headroom needed, already private, with no extra vendor.

## Admin console

Reachable at **`/admin`** (and `#/admin`, for hosts that do not rewrite unknown
paths — `public/_redirects` and `vercel.json` cover Netlify, Cloudflare Pages and
Vercel).

The passcode comes from `VITE_ADMIN_PASSCODE` (see `.env.example`). **It is a
convenience gate, not a security boundary** — it is compiled into the JavaScript
bundle and can be recovered by anyone who reads it. It exists to stop a delegate
wandering into the console on a shared laptop.

The enforceable boundary is server-side and already deployed: the `admins` table
and `is_admin()`, which every verification RPC checks, plus RLS on every table.
Once Supabase Auth is wired, the passcode gate should be replaced by that check
rather than kept alongside it.

## Keeping the catalogue in sync

`seed/events_seed.sql` is generated — never hand-edit it:

```bash
node scripts/generate-seed.mjs
```

The TypeScript catalogue in `src/data/` stays the single source of truth for
brochure facts; the script projects it into SQL so the two cannot drift.

## Still to do after the connector is attached

- Add a `SupabaseBackend` implementation behind the same surface that
  `src/services/registrationService.ts` already exposes, and switch the app over.
  Every mutation in the app already funnels through that one module, so no view
  needs to change.
- Wire Supabase Auth to the existing email / Google sign-in screen.
- Replace the admin console's device-local reads with the RPCs above.
