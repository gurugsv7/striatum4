# STRIATUM 4.0 Website --- AI Builder Continuation Brief

## Mission

Continue the existing **STRIATUM 4.0** mobile-first symposium website.
Do not restart or redesign the product from scratch. Inspect the current
codebase first, preserve working components and the established visual
language, replace placeholder/mock event data with the official event
dataset, and implement the remaining registration flows coherently.

**STRIATUM 4.0** is a medical symposium at **Indira Gandhi Medical
College & Research Institute (IGMC&RI)**, presented by **SIGMA 2026**.

A separate `STRIATUM_4.0_Website_Event_Master_Data.md` contains the
brochure-derived event names, fees, dates, times, slots, eligibility,
rules, prizes, contacts, skills and deadlines. Treat that as the
event-content source of truth. Never invent missing symposium facts.

------------------------------------------------------------------------

# 1. Core Product Flow

``` text
Sign In
→ Home
→ Get Delegate ID
→ Delegate verification/approval
→ Explore Events
→ Event Detail
→ Add to Cart
→ Add more events if desired
→ Cart
→ Apply eligible bundle discount
→ Checkout
→ Payment QR
→ User pays manually
→ Upload payment screenshot
→ Pending manual verification
→ Admin approves/rejects
→ Confirm registrations
→ My Events
```

This is a symposium registration system, **not an ecommerce
storefront**, even though it uses cart/order concepts.

------------------------------------------------------------------------

# 2. Existing Screens / UX

## Sign In

Existing identity includes:

-   IGMC&RI
-   SIGMA 2026
-   STRIATUM 4.0
-   Medical Symposium 2026
-   "A Familiar Journey, A Deeper Dive"
-   Email sign-in
-   Google sign-in
-   Terms/privacy

Keep it cinematic and minimal. Do not turn it into a generic SaaS login
card.

## Home

Current journey:

1.  **Delegate Access --- Get your Delegate ID**
2.  **Explore --- Explore Events**
3.  **Programme --- Event Schedule**

Persistent bottom navigation:

-   Home
-   Explore
-   My Events
-   Profile

Do not casually add a fifth bottom-nav item. Cart can be exposed through
Explore/Event Detail/header/cart indicator.

## Explore Events

Purpose: fast discovery, not full information.

Current structure:

-   STRIATUM header
-   "Find your event."
-   Search
-   Filters
-   Category controls
-   Compact event cards
-   Bottom navigation

Cards should use the **real branded event name as the headline**, with
specialty/type as secondary context.

Good:

``` text
BONEFIRE
Orthopaedics · Workshop
15 OCT · 8:30 AM
₹1,300 onwards · 50 slots
VIEW EVENT →
```

Bad:

``` text
Surgery Workshop
Online Quiz
Research Paper Presentation
```

when official names exist.

## Event Detail

Shared shell:

-   Back navigation
-   Event code/category
-   Large editorial event name
-   Specialty/type
-   Tagline/hook
-   Primary CTA
-   Key facts
-   About
-   Expandable detailed sections
-   Event contacts/in-charges

For registration-enabled events the main CTA should normally become
**ADD TO CART**, not immediately force payment.

Only show meaningful fields. Do not show empty/TBA rows unnecessarily.

------------------------------------------------------------------------

# 3. Event Organisation

There are currently **26 named activities/events**.

## Workshops

  Event           Specialty
  --------------- -----------------------------------------
  THE SONO EDGE   Anaesthesiology / POCUS / Critical Care
  SUTUREX         Surgery
  PAEDOPRAXIS     Paediatrics
  PENUMBRA        Radiology
  GENESIS         Obstetrics
  GLOW CODE       AI & Medical Research
  BONEFIRE        Orthopaedics
  VITALIS         Emergency Medicine
  PLEURALIS       Respiratory Medicine
  RYTHMICA        General Medicine / ECG

Workshop specialty filters may include:

`All · Medicine · Surgery · Paediatrics · OBG · Orthopaedics · Radiology · Emergency · Respiratory · AI/Research`

## Quizzes

-   OCEANIC ODYSSEY --- Junior Quiz --- Anatomy & Pharmacology
-   AQUAQUEST --- Senior Quiz --- Nephrology
-   GLANDSWARS --- Endocrinology Quiz

## Research / Academic Presentations

-   LUMINARA --- Symposium
-   THE DIAGNOSTIC ABYSS --- Case Presentation
-   CORAL CANVAS --- Poster Presentation
-   CHIRONEX --- Paper Presentation
-   THE UNCHARTED --- Research Idea Pitch

## Innovation

-   NEURONOVA --- Healthcare Innovation / Ideathon

## Creative

-   LIFE REIMAGINED --- Medical Art
-   BEYOND THE BLUE --- Short Film
-   TIDAL CUTS --- Reel Creation
-   MEMEVERSE --- Ophthalmology Meme Creation

## Games / Experiences

-   THE MEDICAL VAULT --- Medical Mystery Room
-   MEDMAZE --- Medical Treasure Hunt

## Exhibition

-   BIOVERSE --- Medical exhibition for school students

Recommended primary Explore filters:

`ALL · WORKSHOPS · QUIZZES · RESEARCH · CREATIVE · GAMES`

Innovation can be a separate filter or included with Research/Innovation
depending on available mobile width. Avoid a huge row of pills.

A secondary filter sheet can expose specialty, date, price,
individual/team, availability and Delegate Pass requirements.

Search must index event **name + specialty + topic + format**. Searching
`ortho` should find BONEFIRE; `ECG` → RYTHMICA; `paper` → CHIRONEX.

------------------------------------------------------------------------

# 4. Event Data Model

Do not combine category, specialty and format into one field. Adapt the
existing schema rather than rewriting working architecture
unnecessarily.

Conceptually:

``` ts
type Event = {
  id: string;
  code?: string;
  name: string;
  tagline?: string;
  description?: string;

  category:
    | "workshop"
    | "quiz"
    | "presentation"
    | "research"
    | "innovation"
    | "creative"
    | "game"
    | "exhibition";

  specialties: string[];
  format?: string;

  date?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;

  slots?: number;
  teamSize?: { min: number; max: number };

  pricing?: {
    earlyBird?: number;
    regular?: number;
    spot?: number;
    individual?: number;
    team?: number;
  };

  delegatePassRequirement?:
    | "required"
    | "not_required"
    | "not_required_for_submission"
    | "unspecified";

  eligibility?: string[];
  skills?: string[];
  rules?: string[];
  abstractDeadline?: string;
  submissionDeadline?: string;
  submissionEmail?: string;
  submissionInstructions?: string[];

  prizes?: { totalValue?: number; notes?: string };

  coordinators?: { name: string; phone?: string }[];

  status?: "open" | "closed" | "coming_soon" | "full";
};
```

Pricing must support early/late, entry/spot, individual/team and
flat-team pricing. Do not reduce every event to `price: number`.

------------------------------------------------------------------------

# 5. Cart --- Core Requirement

Users must be able to select **one or multiple events/workshops** and
pay for them together.

Event Detail CTA:

**ADD TO CART**

After adding:

-   confirm unobtrusively,
-   update cart count,
-   expose View Cart,
-   allow continued browsing,
-   avoid disruptive modal spam.

Prevent duplicate registration for an event already:

-   in cart,
-   in a pending order,
-   approved/registered,
-   full/unavailable.

Possible CTA states:

``` text
ADD TO CART
IN CART · VIEW CART
PAYMENT UNDER REVIEW
REGISTERED
EVENT FULL
```

------------------------------------------------------------------------

# 6. Cart Page

The Cart must feel like STRIATUM, not an online shop.

Each item should show:

-   event name,
-   specialty/type,
-   date/time if available,
-   price,
-   remove action.

Example:

``` text
BONEFIRE
Orthopaedics · Workshop
15 OCT · 08:30 AM
₹1,300
REMOVE
```

Summary:

``` text
EVENTS                3
SUBTOTAL          ₹2,800
BUNDLE DISCOUNT    -₹300
────────────────────────
TOTAL              ₹2,500
```

CTA:

**PROCEED TO PAYMENT**

------------------------------------------------------------------------

# 7. Bundle / Multi-Event Discounts

Users buying multiple eligible events may receive a discount.

**The exact discount rule is NOT yet final. Do not invent percentages or
amounts.**

Build discounts to be configurable. Future rules may involve:

-   minimum number of eligible events,
-   percentage discount,
-   fixed discount,
-   category-specific bundles,
-   specific event combinations,
-   maximum discount caps.

Illustrative model:

``` ts
type DiscountRule = {
  id: string;
  name: string;
  minEligibleItems?: number;
  eligibleEventIds?: string[];
  eligibleCategories?: string[];
  discountType: "percentage" | "fixed";
  discountValue: number;
  active: boolean;
};
```

The backend/database must be authoritative for the payable total. Never
trust only a client-calculated total.

Before creating a payment order:

1.  Revalidate current prices.
2.  Revalidate registration eligibility.
3.  Revalidate event availability.
4.  Apply the active discount rule.
5.  Calculate authoritative total.
6.  Persist the order.
7.  Show payment against that persisted amount.

Snapshot event names/prices and subtotal/discount/total on the order so
historical orders do not change when future prices change.

------------------------------------------------------------------------

# 8. Manual QR Payment

There is **no automatic payment gateway** in the current plan.

Flow:

``` text
Cart
→ Final total
→ Payment page
→ Display official payment QR
→ User pays using UPI/payment app
→ Upload screenshot
→ Submit proof
→ Pending manual verification
→ Admin approves or requests re-upload
```

## Payment Page

Hierarchy should make the amount unambiguous:

``` text
03 / PAYMENT

Complete your
registration.

ORDER S4 / 0241

3 EVENTS

Subtotal             ₹2,800
Bundle discount       -₹300

PAY                   ₹2,500
```

Then:

-   prominent official payment QR,
-   "Scan using any UPI app",
-   "Pay exactly ₹2,500",
-   screenshot upload area.

Suggested upload guidance:

``` text
UPLOAD PAYMENT SCREENSHOT
JPG / JPEG / PNG
Make sure the paid amount and transaction details are visible.
```

After choosing an image:

-   show preview,
-   allow replacement,
-   require explicit **SUBMIT FOR VERIFICATION**.

Do not allow accidental duplicate submission.

------------------------------------------------------------------------

# 9. Payment Status

At minimum support:

``` text
cart
awaiting_payment
payment_submitted
under_review
approved
rejected
cancelled
```

`payment_submitted` and `under_review` may be merged if unnecessary.

## Pending

``` text
Payment submitted.

Your payment proof is being verified.
Your registrations will be confirmed after approval.
```

## Approved

``` text
Payment verified.

Your registrations are confirmed.
```

Then events appear correctly under **My Events**.

## Rejected / Re-upload Required

Do not simply say "Payment Failed".

Show the admin reason when available, e.g.:

-   Amount does not match.
-   Screenshot is unclear.
-   Transaction details are not visible.

Provide:

**UPLOAD A NEW SCREENSHOT**

Do not force users to recreate their entire cart/order.

------------------------------------------------------------------------

# 10. Payment Proof Privacy

Payment screenshots may contain personal/financial transaction
information.

Treat them as private:

-   no public storage URLs,
-   authenticated/signed access where supported,
-   only relevant user and authorised admin can access,
-   validate MIME type and size,
-   do not trust file extensions alone.

------------------------------------------------------------------------

# 11. Delegate ID

Delegate registration is separate from event registration.

Concept:

``` text
Sign In
→ Register as Delegate
→ Required manual verification
→ Approval
→ Delegate ID issued
→ Eligible registrations unlocked
```

Do **not** globally require a Delegate ID for every event.

Known brochure rules:

### Delegate Pass Required

All listed workshops.

### Explicitly Not Required

-   THE MEDICAL VAULT
-   MEDMAZE

### Not Required for Abstract Submission

-   THE DIAGNOSTIC ABYSS
-   CORAL CANVAS

For unspecified events, do not invent the requirement.

------------------------------------------------------------------------

# 12. My Events

My Events is the user's registration hub.

Useful groups:

``` text
CONFIRMED
PENDING
ACTION REQUIRED
```

Examples:

``` text
BONEFIRE
15 OCT · 08:30 AM
ORTHOPAEDICS WORKSHOP
CONFIRMED
```

``` text
CHIRONEX
Payment verification pending
```

``` text
Order S4 / 0241
Payment proof needs resubmission
RE-UPLOAD →
```

Users must always understand what they selected, what they paid for, and
its verification state.

------------------------------------------------------------------------

# 13. Programme / Schedule

Home already links to **Event Schedule**.

Programme should answer:

-   What happens on each day?
-   What is happening now/next when relevant?
-   What time does my event start?
-   Do selected/registered events overlap?

Prefer a date-oriented programme/timeline over another giant event-card
list.

Do not blindly trust placeholder schedule dates if official programme
data later differs.

------------------------------------------------------------------------

# 14. Admin Workflow

Manual payment verification requires an admin interface.

Admin should see:

-   user,
-   Delegate ID if applicable,
-   order ID,
-   selected events,
-   individual prices,
-   applied discount,
-   expected total,
-   payment screenshot,
-   submission timestamp,
-   verification status.

Actions:

``` text
APPROVE
REJECT / REQUEST RE-UPLOAD
```

Rejection should support a short reason.

Approval must reliably confirm all applicable registrations. Avoid
partial client-side approval where the payment is approved but only some
event registrations are created.

------------------------------------------------------------------------

# 15. Slots / Capacity

Some workshops have limited capacity (30/40/50 etc.).

Capacity is functional data, not decorative text.

Track:

-   confirmed registrations,
-   pending orders/payment verification,
-   available capacity.

Do not silently oversell limited workshops. The exact pending-slot hold
policy can be finalised later, but the data model must support it.

Before checkout, detect:

-   already registered,
-   already pending,
-   event full,
-   Delegate ID missing when required,
-   invalid team configuration,
-   registration closed.

Where practical, warn about schedule conflicts **before payment**.

------------------------------------------------------------------------

# 16. Adaptive Event Detail Sections

Use a common visual shell but adapt content by event type.

### Workshop

``` text
ABOUT
SKILLS COVERED
WHO CAN PARTICIPATE?
IMPORTANT INFORMATION
EVENT IN-CHARGES
```

### Quiz

``` text
ABOUT
ELIGIBILITY
TEAM RULES
QUIZ FORMAT
IMPORTANT INFORMATION
EVENT IN-CHARGES
```

### Paper / Case / Poster

``` text
ABOUT
ELIGIBILITY
ABSTRACT GUIDELINES
SUBMISSION
SELECTION PROCESS
FINAL PRESENTATION
PRIZES
EVENT IN-CHARGES
```

### Creative

``` text
ABOUT
THEME
SUBMISSION FORMAT
RULES
JUDGING
DEADLINE
EVENT IN-CHARGE
```

Do not dump all information into the first viewport.

------------------------------------------------------------------------

# 17. Design Language --- Preserve Exactly

The established identity is:

**deep-ocean exploration + bioluminescence + medicine + editorial
scientific expedition**

The ocean is not just wallpaper. The interface should feel like users
are descending/exploring through information.

Preserve:

-   deep black/navy cinematic underwater environments,
-   restrained cyan/bioluminescent highlights,
-   large editorial serif headlines,
-   clean sans-serif body copy,
-   widely tracked uppercase metadata,
-   fine technical lines,
-   vertical timelines,
-   cyan nodes,
-   corner brackets,
-   small expedition/scientific annotations,
-   strong negative space,
-   asymmetrical compositions,
-   restrained dark/translucent panels,
-   thin borders,
-   minimal meaningful glow.

Existing interface grammar includes:

``` text
S4 / 01
01 / DELEGATE ACCESS
02 / EXPLORE
03 / PROGRAMME
```

plus vertical cyan lines, glowing nodes, tiny uppercase side notes and
restrained cyan punctuation.

Reuse these intentionally, not randomly.

## Do NOT introduce

-   generic SaaS dashboards,
-   generic ecommerce styling,
-   huge grids of identical cards,
-   purple AI gradients,
-   excessive glassmorphism,
-   random neon borders,
-   cartoon medical graphics,
-   generic hospital-blue UI,
-   oversized rounded cards everywhere,
-   generic Material-style dashboard components,
-   unnecessary information density.

Negative space is part of the visual system.

------------------------------------------------------------------------

# 18. Mobile-First Rule

This is a **mobile-first product**.

Do not cram desktop quantities of information into a mobile viewport.

Use:

-   concise summaries,
-   accordions,
-   dedicated detail pages,
-   bottom sheets where appropriate,
-   clear primary CTAs.

The Explore screen should let users see multiple options quickly rather
than scrolling through full descriptions.

------------------------------------------------------------------------

# 19. Known Brochure Issues --- Do Not Guess

### SUTUREX

Displayed event name is SUTUREX, but one brochure description says
STITCHREEF. Use SUTUREX unless organisers confirm otherwise.

### CORAL CANVAS

Poster specifications conflict: "digital posters in print", landscape, 4
ft × 3 ft, and 1080 × 1920. Do not guess the final specification.

### CHIRONEX

Brochure says final PowerPoint deadline is **18 October 2026**. Verify
before publishing as final.

### NEURONOVA

Brochure still contains placeholders such as:

``` text
Submit your ideas to EMAIL
Payment Link
QR Code for registration
```

Never expose these placeholders publicly.

### Missing data

Several events do not specify event date/time on their individual
brochure page. Do not invent them.

Use `TBA` only when organisers explicitly intend to announce something
later. If a field is not applicable, hide it.

------------------------------------------------------------------------

# 20. Immediate Development Priorities

1.  Preserve existing screens and visual system.
2.  Replace placeholder events with official master data.
3.  Structure categories + specialty/topic tags.
4.  Improve Explore search/filtering.
5.  Make Event Detail data-driven and adaptive.
6.  Implement Add to Cart.
7.  Implement Cart.
8.  Implement configurable bundle discounts.
9.  Implement authoritative checkout/order calculation.
10. Implement manual QR payment page.
11. Implement screenshot upload and private storage.
12. Implement pending/approved/rejected/re-upload states.
13. Implement My Events status handling.
14. Implement admin payment verification.
15. Connect approval atomically to registrations.
16. Enforce per-event Delegate Pass requirements.
17. Handle capacity and duplicate registrations safely.
18. Build/refine Programme/Schedule.
19. Finish remaining profile/delegate flows.

Do not solve these by unnecessarily redesigning screens that already
work.

------------------------------------------------------------------------

# 21. Instruction Before Every New Screen

Before building, determine:

1.  What is the user's goal?
2.  What is the single primary action?
3.  What must be visible immediately?
4.  What can live one tap deeper?
5.  Which established STRIATUM motifs naturally belong here?
6.  Should secondary information use an accordion, sheet or separate
    page?
7.  Does it work comfortably on a normal mobile viewport?
8.  Is every factual symposium value sourced from official data?

Do **not** begin with "what cards can I put here?"

Begin with the journey.

------------------------------------------------------------------------

# 22. Final Product Principle

The website should feel like:

> **A purpose-built digital companion for a premium medical symposium.**

Not:

> **An ecommerce template with an ocean background.**

Cart, orders, discounts and payment states are functional concepts.
Their presentation must remain symposium-specific.

Continue from the existing codebase. Inspect before modifying. Reuse
working components. Preserve the visual identity. Use official event
data. Keep overview screens uncluttered and detailed rules one level
deeper. Treat cart totals and eligibility as real transactional data.
Treat payment screenshots as private. Treat manual verification as a
first-class workflow, not a temporary hack.

The finished product should feel as if **every existing and future
STRIATUM screen was designed as one coherent system from the
beginning.**
