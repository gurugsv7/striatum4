# STRIATUM 4.0 — Product Specification (authoritative)

Medical symposium web app for **Indira Gandhi Medical College & Research Institute (IGMCRI)**,
presented by **SIGMA 2026**.

Identity strings (use verbatim):
- `STRIATUM 4.0`
- `MEDICAL SYMPOSIUM · 2026`
- `A FAMILIAR JOURNEY, A DEEPER DIVE.`
- `IGMCRI · SIGMA 2026`
- Dates: `13 OCT — 18 OCT 2026`

## 0. RESOLVED DECISIONS (override anything that contradicts)
1. **PAYMENTS ARE MANUAL.** There is NO payment gateway. No Razorpay/Cashfree/PhonePe/Stripe
   SDK, no checkout redirect, no payment webhook. Flow is: show admin-configured UPI QR →
   participant pays in their own UPI app → participant uploads a screenshot → **an admin
   manually approves** → only then is the Delegate ID / event QR issued.
2. Stack: **Next.js 15 (App Router, TypeScript, Tailwind) + Supabase** (Postgres, Auth,
   private Storage, RLS). All privileged work happens in server actions / route handlers.
3. Scope: participant app **and** `/admin` console.
4. **Invent nothing.** Fees, UPI ID, payee name, QR image, venues, times, speakers, rules,
   capacities, eligibility all come from the database / admin settings. Where a value is
   absent, render a designed "not announced yet" state — never a made-up number.

## 1. TWO IDENTITY LAYERS
- **Account** = authenticated website user (Supabase auth user + `profiles` row).
- **Delegate** = official STRIATUM participant identity, issued only after admin approval.

Signing in does NOT make someone a delegate. One user maps to zero or one delegate. One
delegate has many event registrations. **Every confirmed event registration gets its own
unique QR token.** The Delegate QR is NEVER used for event check-in.

```
User
└── Delegate S4-26-0184
    ├── Surgery Workshop → QR_TOKEN_A
    ├── ECG             → QR_TOKEN_B
    └── Quiz            → QR_TOKEN_C
```

Once authenticated, never ask the user to type their Delegate ID. Attach it server-side.

## 2. PARTICIPANT JOURNEY
```
COMING SOON → WELCOME → GOOGLE/EMAIL AUTH → FIRST-TIME HOME
→ GET DELEGATE ID → DELEGATE FORM → PROCEED TO PAYMENT
→ OFFICIAL UPI QR SHOWN → user pays externally → UPLOAD SCREENSHOT
→ SUBMIT FOR VERIFICATION → PAYMENT UNDER REVIEW
→ (admin approves) → DELEGATE ID GENERATED → DELEGATE PASS ACTIVE
→ HOME TRANSFORMS TO ACTIVE DELEGATE STATE
→ EXPLORE → EVENT DETAIL → REGISTER
   ├─ FREE  → confirm → (optional admin approval) → EVENT QR
   └─ PAID  → event payment QR → screenshot → admin review → EVENT QR
→ MY EVENTS → EVENT PASS → VENUE CHECK-IN → ATTENDANCE
→ RESULTS WHEN PUBLISHED
```

**THE CRITICAL BUSINESS RULE: SCREENSHOT UPLOAD IS NOT PAYMENT APPROVAL.**
Uploading sets status `PENDING_REVIEW`. Only an admin action moves it to `APPROVED`, and only
that transition issues a Delegate ID or an event QR. Approval must be idempotent — approving
twice must never issue two Delegate IDs or two QR tokens.

## 3. SCREEN-BY-SCREEN REQUIREMENTS

### 3.1 Coming Soon (`/`, when `app_settings.launched` is false)
IGMCRI, SIGMA 2026 PRESENTS, STRIATUM 4.0, MEDICAL SYMPOSIUM 2026,
"A FAMILIAR JOURNEY, A DEEPER DIVE.", COMING SOON, REGISTRATIONS OPENING SOON.
No login CTA. No countdown unless a real launch date is configured. No newsletter, no fake
stats. This screen may be the most cinematic in the product.

### 3.2 Welcome (`/welcome`, when launched)
Establishes: full college name, SIGMA 2026 PRESENTS, official logo slot, STRIATUM 4.0,
MEDICAL SYMPOSIUM · 2026, the tagline. Primary CTA `ENTER STRIATUM →`.
Transition: the Signal on the CTA activates, a translucent cyan membrane/ripple expands
through the viewport revealing auth underneath. 650–850ms total. No cartoon bubbles.

### 3.3 Auth (`/signin`)
Conventional and familiar. `Sign in to STRIATUM`, email field, `CONTINUE WITH EMAIL`
(passwordless magic link / OTP), divider `or`, `CONTINUE WITH GOOGLE` (Google OAuth).
STRIATUM atmosphere around the controls; the controls themselves behave normally.
After auth: new user → first-time Home; returning user → Home with their real data.

### 3.4 Home (`/home`)
Compact header: `STRIATUM 4.0` over `IGMCRI · SIGMA 2026`, notification + profile on the
right. Small greeting. NOT a marketing landing page. Numbered sections:

- `01 / DELEGATE ACCESS` — state machine, see §3.5.
- `02 / EXPLORE` — "See what awaits." `EXPLORE EVENTS →` (browsing needs no delegate).
- `03 / PROGRAMME` — `13 OCT — 18 OCT`, `6 DAYS`, `VIEW SCHEDULE →`.
- `04 / YOUR EVENTS` — empty state "Nothing here yet. Events you register for will appear here
  with their individual QR passes." Once registrations exist, show them compactly.

Forbidden on Home: Featured / Popular / Recommended / Trending sections, fake registrations,
fake activity, fake QR passes, any hardcoded person name or Delegate ID.

### 3.5 Delegate Access card states (drives the Delegate Imprint)
| Application status | Card shows | CTA |
|---|---|---|
| none | "Your Delegate ID starts everything." | `GET DELEGATE ID →` |
| `PAYMENT_PENDING` (form saved, no proof yet) | "Payment step incomplete" | `COMPLETE PAYMENT →` |
| `PAYMENT_UNDER_REVIEW` | `VERIFICATION PENDING` + "Your payment proof has been received. The STRIATUM team will review it before activating your Delegate ID." | `VIEW SUBMISSION` |
| `PAYMENT_REJECTED` | `PAYMENT NEEDS ATTENTION` + "Your Delegate payment could not be verified." + reason | `RESUBMIT PAYMENT PROOF →` |
| `APPROVED` | `DELEGATE ACTIVE`, name, Delegate ID | `VIEW DELEGATE PASS →` |

The card must never keep showing `GET DELEGATE ID` as if nothing happened.

### 3.6 Delegate registration (`/delegate/register`)
Not event registration. Copy: `ONE ID.` / `MANY POSSIBILITIES.` Fields are **database-driven**
(`delegate_form_fields`) so organizers can add fields later without a redesign. Baseline
fields: Full Name, Email (prefilled, read-only from auth), Mobile Number, College/Institution,
Year of Study, Student ID (optional unless configured required). Prefill from the auth
profile. Validate fully on this page. **No separate Review step.** CTA `PROCEED TO PAYMENT →`.

### 3.7 Delegate payment (`/delegate/payment`)
No bottom navigation during this flow. Header `DELEGATE REGISTRATION` / "Complete your
access." Summary: Participant, Institution, "Delegate registration", Amount (from
`payment_settings`). Then the **official payment QR, large enough to scan from another
device** (min 240px square, quiet zone preserved, rendered on a light plate for contrast),
with Payee Name, UPI ID (if set), Amount underneath.

Instructions, numbered:
1. Scan the QR using your preferred UPI/payment app.
2. Complete the exact payment.
3. Take a screenshot of the successful transaction.
4. Upload the screenshot below.
5. STRIATUM organizers will verify your payment.

`UPLOAD PAYMENT SCREENSHOT` — accepts JPG/JPEG/PNG/WEBP, max 8MB. Real preview. User can
choose / preview / replace / remove before submitting. Optional `UTR / Transaction Reference`
field, required only when `payment_settings.require_transaction_ref` is true.
CTA `SUBMIT FOR VERIFICATION →`. This is not a fake gateway screen — never render fake card
or UPI input fields.

### 3.8 Payment submitted (`/delegate/status`)
`PAYMENT SUBMITTED` / "Verification pending." / status chip `UNDER REVIEW`.
Allow `VIEW SUBMISSION` and, while still pending or when an admin requested resubmission,
`REPLACE SCREENSHOT`. The user may leave the page; Home reflects the pending state.

### 3.9 Delegate pass (`/delegate/pass`) — only when APPROVED
`REGISTRATION COMPLETE` / "You're in." / "Your Delegate ID is ready." (no giant headline).
The credential is the hero, split composition:
- LEFT ~40–42%: large delegate verification QR, `DELEGATE PASS`, `SCAN TO VERIFY`.
- RIGHT ~58–60%: `ACTIVE`, participant name 24–28px, Delegate ID prominent (format
  `S4-26-0184`), institution, year. Important values at least 16px. Activated Delegate
  Imprint subtly behind the information.
No microscopic decorative filler. Below: `SAVE PASS` (renders a PNG client-side) and `SHARE`
(Web Share API with graceful fallback) — implement only what genuinely works.
Then `WHAT'S NEXT?` / "Find your events." with `EXPLORE EVENTS →` and `VIEW PROGRAMME →`.
Bottom navigation returns.

### 3.10 Explore (`/explore`)
Premium conference programme + scientific specimen catalogue + medical editorial index.
NOT a card marketplace. Search. Filters built from actual `event_types` rows (do not
hardcode). Two modes: `EVENTS` (browse/register) and `SCHEDULE` (chronological). No
Featured/Trending/Recommended. Each row exposes: name, type, date, session/time, venue (if
known), individual/team, fee (if paid), registration state. Row CTA `VIEW EVENT →` — never
register straight from the catalogue.

### 3.11 Event detail (`/events/[slug]`)
Not a promotional poster. Show type, name, description, date, time, venue, format,
individual/team, eligibility, fee, registration state. Optional sections rendered **only when
the row actually has data**: About, Format, Rules, Speakers, Schedule, Venue, FAQs.
CTA depends on delegate state:
- no delegate → "Delegate access required. You'll need your Delegate ID to register for this
  event." `GET DELEGATE ID →` (browsing stays fully open)
- pending → `DELEGATE VERIFICATION PENDING` (disabled)
- rejected → `COMPLETE DELEGATE VERIFICATION →`
- active → `REGISTER FOR THIS EVENT →`
- closed / full / already registered → the corresponding designed state.

### 3.12 Event registration (`/events/[slug]/register`)
Delegate attached automatically. Event-specific fields from `event_form_fields`.
Team events: team name plus members between `min_team_size` and `max_team_size`; the
registrant is team lead and owns the registration; prevent duplicate team registrations.
- Free event → confirm → `CONFIRMED` (or `PENDING_APPROVAL` when `requires_admin_approval`)
  → QR issued.
- Paid event → event payment screen (same manual architecture; event-specific QR override if
  configured, otherwise the global QR) → screenshot → `PAYMENT_UNDER_REVIEW` → admin →
  `CONFIRMED` → QR issued.
**Never generate the event QR while payment is merely pending.**

### 3.13 My Events (`/my-events`)
Empty: `MY EVENTS` / "Nothing registered yet." / "Find an event that interests you."
`EXPLORE EVENTS →`. Populated: event name, date, time, venue, registration status, payment
status when relevant, `VIEW PASS →` (only for confirmed registrations).

### 3.14 Event pass (`/my-events/[registrationId]`)
That event's own unique QR. Shows event name, participant, Delegate ID, registration ID,
date/time, QR, registration and check-in state. Visually distinct from the Delegate Pass.

### 3.15 Programme (`/programme`)
Chronological and editorial — not a spreadsheet. Day spine 13 → 18 OCT with the Signal
travelling vertically. Tapping an event opens its detail page. Seed reference data (names
only; no invented venues, times, fees):
- 13 OCT — Inauguration, Online Quiz Semifinal & Finals, Expo
- 14 OCT — Surgery Workshop, OBG Workshop, RM, Symposium
- 15 OCT — Paediatrics Workshop, Disaster Management, Anaesthesia, Fine Art, Mystery Room
- 16 OCT — Ortho Workshop, EM 2, Radio Workshop, 3 Mins Research
- 17 OCT — CM Workshop, ECG, Ideathon, Gala Night
- 18 OCT — Junior and Senior Quiz, Case Presentation, Research Presentation, Poster Presentation

### 3.16 Profile (`/profile`)
Compact, not a dashboard. Name, email, institution, year, delegate status, Delegate ID if
active. Actions: View Delegate Pass, Registration details, Account settings, Sign out.
Only settings that genuinely exist.

### 3.17 Results (`/results`, plus a section on event detail)
Admin-controlled and database-driven. Never expose `DRAFT` results. States: `RESULTS NOT
PUBLISHED`, or a published list with position, participant/team, institution. Editorial and
scientific in presentation — not a gold/silver/bronze leaderboard.

## 4. ADMIN CONSOLE (`/admin`)
Protected: only rows in `admin_users` may enter. Participants must never reach admin routes or
admin data. Enforce in middleware AND in every server action AND in RLS.

- `/admin` — operational overview: Total Accounts, Delegate Applications, Pending Delegate
  Payments, Approved Delegates, Rejected/Resubmission Required, Total Event Registrations,
  Pending Event Payments, Confirmed Event Registrations, Checked-In Participants. The primary
  panel is **PAYMENTS NEEDING REVIEW**, not vanity charts.
- `/admin/delegates` — searchable, filterable, sortable, paginated table of applications.
  Columns: Application ID, Name, Email, Mobile, College, Year, Student ID, Submitted, Expected
  Amount, Payment Status, Delegate Status, Delegate ID, Actions. Filters: All / Pending Review
  / Approved / Rejected / Needs Resubmission. Search: name, email, mobile, delegate ID,
  college, transaction reference.
- `/admin/delegates/[id]` — full detail: PERSONAL INFORMATION, ACADEMIC INFORMATION, PAYMENT
  (expected amount, transaction ref, submitted at, screenshot). `VIEW SCREENSHOT →` opens a
  large authenticated lightbox with zoom and open-full-size, sourced from a short-lived signed
  URL. `APPROVE PAYMENT` / `REJECT / REQUEST RESUBMISSION`, both behind a confirm step.
- `/admin/payments` — combined queue for delegate + event submissions. Tabs ALL / DELEGATE /
  EVENT and PENDING / APPROVED / REJECTED. Review flow: open pending → large screenshot beside
  participant/payment details → Approve or Reject → **auto-advance to the next pending item**.
  Optimize for hundreds of submissions.
- `/admin/events` — CRUD over event data (every field tolerant of being unset; nothing
  invented).
- `/admin/event-registrations` — filter by event; columns Registration ID, Participant,
  Delegate ID, College, Team/Individual, Payment Status, Registration Status, QR Status,
  Check-In Status, Registered At. Team rows expand to lead, team name, and members.
- `/admin/checkin` — scan an event QR (camera or manual token paste). Server validates and
  returns `VALID` (name, Delegate ID, event, college) with `CHECK IN →`, or `ALREADY CHECKED
  IN` plus the original timestamp, or `WRONG EVENT`, or `INVALID PASS`. Check-in is
  server-authorized.
- `/admin/results` — per event, enter positions/participants/scores, `DRAFT` → `PUBLISH
  RESULTS` (confirm); unpublish/edit behind confirmation.
- `/admin/settings/payments` — Delegate Registration Fee, Payment QR image upload, Payee Name,
  UPI ID, payment instructions, require-transaction-ref toggle, plus per-event overrides.
  Changing the QR updates participant screens with no code deploy.
- `/admin/exports` — CSV export: All Delegates, Approved Delegates, Pending Payments, All
  Event Registrations, Registrations for a selected Event, Check-In/Attendance, Published
  Results. Normalized data, not UI formatting.

### Payment screenshot security (non-negotiable)
The bucket is **private**. Never store base64/binary in the DB — store the storage path only.
Never create permanent public URLs. Admins view via short-lived signed URLs minted server-side
after an admin check. Participants can view only their own submission. Screenshots are never
exposed to other participants.

## 5. STATE MACHINES (keep separate — no single generic `status`)
```
delegate_applications.status : DRAFT | PAYMENT_PENDING | PAYMENT_UNDER_REVIEW
                               | PAYMENT_REJECTED | APPROVED
event_registrations.status   : DRAFT | PAYMENT_PENDING | PAYMENT_UNDER_REVIEW
                               | PAYMENT_REJECTED | PENDING_APPROVAL | CONFIRMED | CANCELLED
payment_submissions.status   : NOT_SUBMITTED | PENDING_REVIEW | APPROVED | REJECTED
                               | NEEDS_RESUBMISSION
check-in state               : NOT_CHECKED_IN | CHECKED_IN
results.status               : DRAFT | PUBLISHED
```

## 6. NOTIFICATIONS
Persist a `notifications` row on: payment proof submitted, delegate payment approved, delegate
payment rejected, Delegate ID issued, event payment approved, event payment rejected, event
registration confirmed, event QR issued, results published. Participants must see changes
without signing out and in again — revalidate on navigation plus a manual refresh affordance.
Supabase realtime is a bonus, not a requirement.

## 7. REQUIRED STATES ON EVERY MAJOR PAGE
loading, empty, error, success. Specifically: no Delegate ID, no registrations, no results
published, payment pending, payment failed/rejected, registration closed, event full, already
registered, QR already checked in, network error. Each must look deliberately designed.

## 8. HARD PROHIBITIONS
No hardcoded participant names (never ship "Guru G"), no hardcoded Delegate IDs, no fake
registrations, no invented event details/prices/venues/speakers, no placeholder success states
that pretend a payment or approval happened. Every state transition corresponds to real
persisted data.
