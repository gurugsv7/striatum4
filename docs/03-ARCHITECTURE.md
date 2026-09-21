# STRIATUM 4.0 — Architecture Contract

This is the engineering contract every agent working on this codebase must
follow. It exists so parallel agents (foundation, auth, delegate flow, events
flow, admin) don't collide on files or invent incompatible conventions. If
something here conflicts with `00-PRODUCT.md` or `01-DESIGN-SYSTEM.md`, those
two win — flag the conflict rather than silently resolving it.

Stack: **Next.js 15 (App Router, TypeScript, Tailwind) + Supabase** (Postgres,
Auth, private Storage, RLS). Payments are manual — there is no payment
gateway anywhere in this codebase.

## 1. Directory layout

```
app/
  (marketing)/
    page.tsx                    → "/"        Coming Soon (app_settings.launched = false)
                                                or redirect to /welcome once launched
    welcome/page.tsx            → "/welcome"
  (auth)/
    signin/page.tsx              → "/signin"
    auth/callback/route.ts       → OAuth / magic-link callback
  (participant)/                 layout renders <BottomNav> (each page renders its own header)
    home/page.tsx                → "/home"
    explore/page.tsx             → "/explore"
    my-events/page.tsx           → "/my-events"
    my-events/[registrationId]/page.tsx → "/my-events/[registrationId]"
    programme/page.tsx           → "/programme"
    results/page.tsx             → "/results"
    profile/page.tsx             → "/profile"
  events/[slug]/page.tsx         → "/events/[slug]"           (outside (participant); renders BottomNav itself)
  events/[slug]/register/page.tsx → "/events/[slug]/register"           (focused flow, <FocusedFlowHeader>)
  events/[slug]/register/payment/page.tsx → "/events/[slug]/register/payment" (focused flow, <FocusedFlowHeader>)
  (flow)/                        focused flow, <FocusedFlowHeader> instead of BottomNav
    delegate/register/page.tsx   → "/delegate/register"
    delegate/payment/page.tsx    → "/delegate/payment"
    delegate/status/page.tsx     → "/delegate/status"
    delegate/pass/page.tsx       → "/delegate/pass"           (BottomNav returns after success)
  verify/d/[token]/page.tsx      → "/verify/d/[token]"        delegate QR landing (public verify view)
  checkin/[token]/page.tsx       → redirect target for event QR scans outside /admin (see §5)
  admin/
    layout.tsx                   → auth guard (requireAdmin), admin shell
    page.tsx                     → "/admin"                    overview + PAYMENTS NEEDING REVIEW
    delegates/page.tsx           → "/admin/delegates"
    delegates/[id]/page.tsx      → "/admin/delegates/[id]"
    payments/page.tsx            → "/admin/payments"
    events/page.tsx              → "/admin/events"             CRUD list
    events/[id]/page.tsx         → "/admin/events/[id]"        CRUD edit
    event-registrations/page.tsx → "/admin/event-registrations"
    checkin/page.tsx             → "/admin/checkin"
    results/page.tsx             → "/admin/results"
    results/[eventId]/page.tsx   → "/admin/results/[eventId]"
    settings/payments/page.tsx   → "/admin/settings/payments"
    exports/page.tsx             → "/admin/exports"

components/
  ui/            Button, IconButton, Input, Select, Textarea, Checkbox, Radio, Field,
                 Panel, Sheet, Modal, Chip, StatusChip, Tabs, SegmentedControl,
                 SectionHeader, Divider, Stepper, Skeleton, EmptyState, ErrorState,
                 Toast, Lightbox, FileDropzone, QrPanel, CopyField, Spinner,
                 AppHeader, BottomNav, FocusedFlowHeader, PageContainer
  signal/        Signal.tsx (dormant | travelling | arrived | pulse variants)
  delegate/      DelegateImprint.tsx, DelegateAccessCard.tsx, DelegatePassCard.tsx
  event/         EventRow.tsx, EventDetailSections.tsx, EventRegisterForm.tsx, TeamMemberFields.tsx
  admin/         AdminTable.tsx, PaymentReviewPanel.tsx, ScreenshotLightbox.tsx, ScannerPanel.tsx

lib/
  supabase/
    client.ts     browser client (anon key) — 'use client' components only
    server.ts     server client (anon key, cookies-bound) — Server Components / actions,
                  runs AS the current user, respects RLS
    admin.ts      service-role client — SERVER-ONLY, never imported into a 'use client' file
                  or any module that ends up in the client bundle. Used only inside
                  lib/actions/** for the privileged RPC calls in §4.
  actions/        server actions grouped by domain (auth, delegate, events, payments, admin)
  queries/        typed read helpers (Server Components call these, not the raw client)
  validation/     zod schemas, one file per domain, mirrors delegate_form_fields /
                  event_form_fields shapes for dynamic fields
  qr/             token generation + rendering helpers (see §6)
  format/         date/time/currency/status-label formatting helpers
  types/          database.ts, enums.ts (owned by this deliverable — see docs/02-SCHEMA.md)

public/
  brand/striatum-logo.svg   swappable logo asset slot (neutral fallback mark)
```

## 2. Route table

### Participant

| Path | Screen | Notes |
|---|---|---|
| `/` | Coming Soon | shown when `app_settings.launched = false`; else redirects to `/welcome` (first visit) or `/home` (has a session) |
| `/welcome` | Welcome | primary CTA → `/signin` |
| `/signin` | Auth | email OTP/magic link + Google OAuth |
| `/auth/callback` | OAuth/magic-link callback (route handler, not a page) | |
| `/home` | Home | |
| `/explore` | Explore (EVENTS / SCHEDULE modes) | |
| `/events/[slug]` | Event detail | |
| `/events/[slug]/register` | Event registration (focused flow) | |
| `/delegate/register` | Delegate registration form (focused flow) | |
| `/delegate/payment` | Delegate payment (focused flow) | |
| `/delegate/status` | Payment submitted / under review (focused flow) | |
| `/delegate/pass` | Delegate pass (focused flow, BottomNav returns after) | only reachable when `delegates` row exists |
| `/my-events` | My Events | |
| `/my-events/[registrationId]` | Event pass | only for the owning user, confirmed registrations show the QR |
| `/programme` | Programme | |
| `/results` | Results | |
| `/profile` | Profile | |
| `/verify/d/[token]` | Public delegate-verification landing page (what the Delegate Pass QR resolves to) | read-only, shows name/college/status, no PII beyond what's already on the physical pass |
| `/checkin/[token]` | Event QR landing — for `/admin` scanning this is consumed via RPC, not page navigation; this route exists so the QR is a valid URL if opened outside the admin scanner (shows a "present this at the venue" state, does not self-check-in) | |

### Admin (all under `/admin`, guarded — see §3)

| Path | Screen |
|---|---|
| `/admin` | Overview: Total Accounts, Delegate Applications, Pending Delegate Payments, Approved Delegates, Rejected/Resubmission Required, Total Event Registrations, Pending Event Payments, Confirmed Event Registrations, Checked-In Participants; primary panel = Payments Needing Review |
| `/admin/delegates` | Applications table: filter/search/sort/paginate |
| `/admin/delegates/[id]` | Application detail, screenshot lightbox, approve/reject |
| `/admin/payments` | Combined delegate+event review queue, tabs + auto-advance |
| `/admin/events` | Event CRUD list |
| `/admin/events/[id]` | Event CRUD edit |
| `/admin/event-registrations` | Registrations table, filter by event, team rows expand |
| `/admin/checkin` | QR scanner (camera or manual token paste) |
| `/admin/results` | Per-event results entry, draft → publish |
| `/admin/results/[eventId]` | Result entry editor for one event |
| `/admin/settings/payments` | Fee, QR upload, payee, UPI id, instructions, require-transaction-ref, per-event overrides |
| `/admin/exports` | CSV export center |

## 3. Auth guard conventions

```ts
// lib/actions/_guards.ts (or lib/supabase/server.ts — pick one home, keep it singular)
async function requireUser(): Promise<{ id: string; email: string }> { /* throws / redirects if no session */ }
async function requireAdmin(roles?: AdminRole[]): Promise<{ id: string; role: AdminRole }> {
  /* requireUser() first, then checks admin_users via RPC is_admin()/is_admin_role();
     throws/redirects if not an admin or not in `roles` when given */
}
```

`requireAdmin()` must be called in **three** independent places for every
admin surface — none of them optional, none of them a substitute for another:
1. `app/admin/layout.tsx` (or middleware) — redirects a non-admin away from `/admin/**` before any admin page renders.
2. Every server action under `lib/actions/admin/**` — re-checks even though the layout already gated the page, because server actions are independently invocable.
3. RLS policies in `0003_rls.sql` — the actual last line of defense if the first two are ever bypassed or buggy.

## 4. Server-action conventions

```ts
'use server';

import { z } from 'zod';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

const schema = z.object({ /* ... */ });

export async function someAction(input: unknown): Promise<ActionResult<SomeShape>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message, code: 'VALIDATION' };
  }

  const user = await requireUser(); // or requireAdmin() for admin actions

  // Privileged transitions (approve/reject/confirm/redeem/publish) call the
  // matching RPC function from 0002_functions.sql via the admin (service-role)
  // client in lib/supabase/admin.ts. Everything else uses the server client
  // (lib/supabase/server.ts), which runs as the user and is bound by RLS.
  const { data, error } = await supabaseAdmin.rpc('approve_delegate_payment', {
    p_submission_id: parsed.data.submissionId,
    p_admin: user.id,
    p_note: parsed.data.note ?? null,
  });

  if (error) return { ok: false, error: error.message, code: error.code };

  revalidatePath('/admin/payments');
  revalidatePath('/admin/delegates');
  return { ok: true, data };
}
```

Rules:
- Every server action starts with `'use server'`, validates input with a `zod` schema from `lib/validation/**`, and returns `ActionResult<T>` — never throw across the server/client boundary for an expected failure (validation, not-found, not-authorized); only unexpected errors should throw.
- Auth guard first, always — before touching the database.
- Any action that reaches into `payment_submissions`, `delegates`, `event_registrations` status transitions, `qr_credentials`, or `check_ins` **must** go through the matching function in `0002_functions.sql` via `lib/supabase/admin.ts`. Never write those status transitions with a raw `.update()` call, even from a server action — the functions are where idempotency and row-locking live.
- Ordinary CRUD that RLS already allows for the acting user (e.g. a participant editing their own `DRAFT` delegate application) may use the server client (`lib/supabase/server.ts`) directly.
- Call `revalidatePath()` for every path whose data the mutation could affect, admin and participant side both (e.g. approving a delegate payment revalidates the admin queue **and** that user's `/home` and `/delegate/*` pages the next time they're visited).

## 5. Environment variables (`.env.local.example`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe for the browser bundle, used by `lib/supabase/client.ts` and `lib/supabase/server.ts`.
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**, used exclusively by `lib/supabase/admin.ts`. Never reference this env var outside that file. Never import `lib/supabase/admin.ts` from a `'use client'` component, a client-bundled hook, or anything under `app/**` that isn't a server action or route handler.
- `NEXT_PUBLIC_SITE_URL` — origin used to build the QR payload URLs in §6 and OAuth redirect URLs; must match a configured Supabase Auth redirect URL.

## 6. Signed-URL helper contract (payment screenshots)

```ts
// lib/queries/payments.ts (or similar) — server-only
async function getScreenshotSignedUrl(submissionId: string, actor: { id: string }): Promise<string> {
  // 1. requireAdmin() (or: requireUser() + assert submission.user_id === actor.id
  //    for a participant viewing their own submission)
  // 2. fetch payment_submissions.screenshot_storage_path
  // 3. supabaseAdmin.storage.from('payment-screenshots').createSignedUrl(path, 60)
  // 4. return the signed URL — never cache it, never persist it, ~60s TTL
}
```
- Signed URLs are minted **server-side only**, after an explicit admin (or self-ownership) check, using the service-role client — never the anon client, since the bucket is private and RLS on `storage.objects` already restricts direct access anyway.
- TTL is short (~60 seconds) — mint on demand when the lightbox opens, not ahead of time, not batched into a list response.
- Never construct a "public" URL for this bucket; it has no public policy (see `0004_storage.sql`).

## 7. QR contract

- Rendering: the `qrcode` npm package (`components/ui/QrPanel.tsx` wraps it), rendered client-side onto a light plate with the correct quiet zone per `01-DESIGN-SYSTEM.md` §7 (min 240px square).
- Token generation: **server-side only**, inside the SECURITY DEFINER functions via `random_token(32)` (`node:crypto` equivalent — `gen_random_bytes(32)` base64url-encoded in Postgres). If a token ever needs generating from application code instead of SQL, use `crypto.randomBytes(32).toString('base64url')` from `node:crypto` — never `Math.random()`, never client-side.
- **Delegate pass QR** encodes: `${NEXT_PUBLIC_SITE_URL}/verify/d/${delegates.verification_token}`.
- **Event pass QR** encodes: `${NEXT_PUBLIC_SITE_URL}/checkin/${qr_credentials.token}`.
- These two token spaces are **never the same value and never interchangeable**. A delegate's `verification_token` can only ever resolve identity (`/verify/d/...`, read-only, no check-in side effect). A `qr_credentials.token` can only ever be redeemed for exactly one event via `redeem_event_qr(p_token, p_event_id, p_admin)`, which explicitly checks `WRONG_EVENT` if the token doesn't belong to the event being scanned. Do not build any code path that accepts either token type in the other's place.
- The admin scanner (`/admin/checkin`) calls `redeem_event_qr` via RPC — camera scan or manual paste both feed the same server action; the client never interprets the token itself beyond extracting it from the scanned URL.

## 8. File-ownership map

To keep parallel agents from editing the same files:

| Area | Owns | Directories |
|---|---|---|
| **Database + backend contract** (this deliverable) | Schema, RLS, functions, storage policy, hand-written DB types, this document | `docs/02-SCHEMA.md`, `docs/03-ARCHITECTURE.md`, `supabase/**`, `lib/types/database.ts`, `lib/types/enums.ts` |
| **Foundation / design system** | Next.js scaffold, Tailwind/globals.css tokens, root layout, fonts, `components/ui/**`, `components/signal/**` | `package.json`, `next.config.*`, `tailwind.config.*`, `app/layout.tsx`, `app/globals.css`, `components/ui/**`, `components/signal/**` |
| **Auth** | Sign-in flow, OAuth callback, session/profile bootstrap | `app/(auth)/**`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/actions/auth/**` |
| **Delegate flow** | Delegate registration/payment/status/pass, Delegate Access card, Delegate Imprint | `app/(flow)/delegate/**`, `app/verify/d/**` (or wherever `/verify/d/[token]` lands), `components/delegate/**`, `lib/actions/delegate/**`, `lib/validation/delegate.ts` |
| **Events flow** | Explore, Programme, Event detail/register, My Events, Event pass, Results (participant view) | `app/(participant)/explore/**`, `app/(participant)/programme/**`, `app/(participant)/my-events/**`, `app/(participant)/results/**`, `app/(flow)/events/**`, `app/checkin/**`, `components/event/**`, `lib/actions/events/**`, `lib/actions/payments/**` (event side), `lib/validation/events.ts` |
| **Admin console** | Everything under `/admin` | `app/admin/**`, `components/admin/**`, `lib/actions/admin/**`, `lib/queries/**` (admin-facing queries), `lib/qr/**` |

Shared/no-owner files (`app/(participant)/home/**`, `app/(participant)/profile/**`, `lib/format/**`) should be coordinated explicitly between agents before editing — they're small enough that a collision is more about communication than ownership.

## 9. Judgement calls made in this deliverable (confirm with orchestrator)

1. **Route grouping** (`(marketing)`, `(auth)`, `(participant)`, `(flow)`) is this deliverable's proposal for satisfying "BottomNav present on X, hidden during focused flows Y" from the design system doc — the frontend-owning agents may restructure the route groups as long as the path table in §2 and the hidden-BottomNav set in `01-DESIGN-SYSTEM.md` §8 are preserved.
2. **`/verify/d/[token]` and `/checkin/[token]`** are new routes not explicitly named in `00-PRODUCT.md`'s screen list — they're required by the QR contract in §6 (a QR must encode a resolvable URL) and are the natural landing points implied by "delegate verification QR" / "event check-in QR." Confirm the exact copy/behavior of these two pages with whoever owns the delegate/events flow.
3. **`events.session` is free text**, not an enum, even though the spec's example values are "Forenoon/Afternoon/Evening" — encoding it as an enum would mean inventing the exhaustive list; free text lets an admin enter exactly what's announced.
4. **`delegates.status` (`ACTIVE`/`REVOKED`) has no dedicated `revoke_delegate()` function** in 0002 — the product spec doesn't describe a revoke flow, so this is a plain admin-writable column for now (covered by `delegates_write_admin` RLS policy). Add a proper audited function later if revocation becomes a real admin action.
