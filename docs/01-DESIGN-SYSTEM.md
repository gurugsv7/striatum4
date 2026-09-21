# STRIATUM 4.0 — Design System (authoritative)

Visual principle:
```
OCEAN      = ATMOSPHERE
MEDICINE   = SUBJECT
BIOLUMINESCENCE = VISUAL ENERGY
```
Abyssal, scientific, editorial. Not a literal underwater website.

## 1. FORBIDDEN / REQUIRED
**Never:** jellyfish, fish, coral motifs, ocean wallpaper, generic hospital UI, blue-white
medical dashboards, generic SaaS cards, heavy glassmorphism, purple AI gradients, cyberpunk
HUD, gaming UI, giant DNA graphics, stock doctors, stethoscopes, neon overload, excessive
rounded cards, huge particle explosions, cartoon bubbles, constant animation, parallax.

**Use:** near-black abyssal navy, deep marine blue-black, icy white type, controlled cyan/aqua,
occasional electric blue, subtle volumetric depth, microscopic particles, neural pathways,
synaptic structures, cellular membranes, vascular/anatomical linework, thin structural
geometry, generous negative space.

The official logo (brain + Rod of Asclepius + open book + ECG) is a swappable asset slot at
`/public/brand/striatum-logo.svg` with a neutral fallback mark. Because the logo already
contains those symbols, do NOT scatter brains/snakes/books/ECG lines across screens.

## 2. TOKENS (`app/globals.css` as CSS variables + Tailwind theme extension)
```
--abyss-900  #04070C   page ground (near-black navy)
--abyss-800  #070C14   raised ground
--abyss-700  #0B1220   panel
--abyss-600  #101A2B   panel raised / input
--line-100   #16243A   hairline structural line
--line-200   #1E3350   hairline emphasis
--ice-100    #F2F7FB   primary text (icy white)
--ice-300    #C7D6E4   secondary text
--ice-500    #8CA3B8   tertiary / metadata
--ice-700    #5A7086   disabled
--signal-400 #7FF3FF   signal highlight
--signal-500 #35E4F5   SIGNAL — primary cyan
--signal-600 #12B8CE   signal deep
--electric   #2C6BFF   occasional electric blue accent
--success    #3FD9A4
--warning    #F2B347
--danger     #FF6B6B
```
Radii: `--r-sm 8px`, `--r-md 12px`, `--r-lg 16px`, `--r-pill 999px`. Never exceed 16px on
panels — no pill-shaped cards. Borders are 1px hairlines, not glows.

Depth comes from layered near-black grounds + one faint radial light source, never from drop
shadows on cards.

## 3. TYPOGRAPHY — HARD RULES
Previous drafts had giant titles and microscopic body text. Do not repeat that.

Fonts (next/font):
- Editorial serif — **Instrument Serif** (or Fraunces) — used selectively for major statements
  and page headings only.
- Interface sans — **Inter** — all UI, body, labels, buttons.
- Mono — **JetBrains Mono** — IDs, tokens, indices, scientific notation ONLY.

Mobile scale (the product baseline):
| Role | Size | Notes |
|---|---|---|
| Page heading | 28–34px | serif |
| Section heading | 20–24px | serif or sans |
| Person / event name | 20–28px | sans, 600 |
| Body | 15–17px | sans, 400, line-height 1.55 |
| Important values (fee, ID, date) | 16–18px | never smaller |
| Buttons | 15–16px | 600 |
| Functional metadata | 12–14px | sans |
| Decorative microtype | 10–11px | ONLY when it carries no necessary information |

Never hide required information in tiny letter-spaced uppercase. Uppercase tracked labels
(`0.14em`) are allowed for section eyebrows like `01 / DELEGATE ACCESS` at 12–13px.

## 4. THE SIGNAL
A tiny cyan bioluminescent point travelling along thin structural lines. Recurring motif for:
active navigation, progression, activation, selected event, registration progress, successful
payment, delegate activation, QR/check-in state.

Implement as `components/signal/Signal.tsx` — an SVG path + an animated point with variants:
`dormant | travelling | arrived | pulse`. Subtle: 1.5–2px point, soft 6px bloom, 600–1200ms
easing. It is **not** an ECG waveform. Honour `prefers-reduced-motion` (point jumps to the end
state, no travel).

## 5. THE DELEGATE IMPRINT
Not a membership card, not a phone mockup. A generated scientific/biological identity
structure: neural-like paths, microscopic cellular geometry, contour/depth lines, one
identification axis. `components/delegate/DelegateImprint.tsx`, an SVG that takes
`state: 'unassigned' | 'pending' | 'rejected' | 'active'` and an optional `delegateId`.

- unassigned: unfinished structure, dormant Signal at the origin, shows
  `ID / ——————`, `IDENTITY / UNASSIGNED`, `ACCESS / LOCKED`
- pending: partial propagation, slow breathing pulse, `IDENTITY / UNDER REVIEW`
- rejected: propagation halted at a break in the path, muted amber accent
- active: the Signal has propagated, dormant branches lit, the axis resolves to the real
  Delegate ID, `ACTIVE`

The activation transition is the payoff of the delegate flow — a propagation along the paths,
roughly 900–1400ms, once, not looping.

## 6. COMPONENT INVENTORY (`components/ui`, mobile-first)
Primitives: `Button` (primary solid signal / secondary outline / ghost / destructive; 44px min
touch target), `IconButton`, `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Field`
(label + hint + error), `Panel` (hairline-bordered surface), `Sheet`, `Modal`, `Chip`,
`StatusChip` (maps every status enum to a colour), `Tabs`, `SegmentedControl`,
`SectionHeader` (numbered eyebrow + serif heading), `Divider`, `Stepper`, `Skeleton`,
`EmptyState`, `ErrorState`, `Toast`, `Lightbox`, `FileDropzone` (image preview / replace /
remove), `QrPanel` (renders a QR on a light plate with correct quiet zone), `CopyField`,
`Spinner`.

Shell: `AppHeader` (compact: `STRIATUM 4.0` / `IGMCRI · SIGMA 2026`, notifications, avatar),
`BottomNav` (HOME / EXPLORE / MY EVENTS / PROFILE, Signal moves to the active item),
`FocusedFlowHeader` (back arrow + title, used where BottomNav is hidden),
`PageContainer` (max-width 480px on mobile, centered and framed on larger screens).

Status colour mapping: pending → warning, approved/confirmed/active → signal, rejected/
cancelled → danger, draft/not-submitted → ice-500, checked-in → success.

## 7. LAYOUT REFERENCE (from the supplied mockups)
Keep this structure so the frontend can be refined later without re-architecting.

- **Sign in**: brand block top-left (logo mark, three-line college name, `SIGMA 2026 PRESENTS`
  with a hairline rule); vertical tracked microtype at top right; huge serif `STRIATUM` with
  `4.0` in cyan beside a vertical rule and `MEDICAL SYMPOSIUM 2026`; tagline with the second
  line in cyan; then `Welcome` (serif), subtitle, email field with a mail icon, full-width
  light `Continue with Email` button carrying a Signal dot on its left edge, `or` divider,
  outlined `Continue with Google`, then a shield icon with terms/privacy links; footer rule
  with `IGMCRI · STRIATUM 4.0 / SIGMA 2026` and vertical microtype at the right.
- **Home**: logo + `STRIATUM 4.0` + two-line subtitle, bell with an unread dot, avatar; serif
  greeting where the name is on its own line in cyan; a right-hand vertical microtype column;
  then the numbered section cards `01 DELEGATE ACCESS` (imprint artwork on the right, filled
  cyan CTA on the left, footer line `ONE ID. MANY OPPORTUNITIES.`), a two-up row of
  `02 EXPLORE EVENTS` and `03 PROGRAMME`, then a full-width `04 YOUR EVENTS`; closing pull
  quote in serif italic with an attribution rule; BottomNav.
- **Explore**: back button, centered brand lockup, search and filter icon buttons; `EXPLORE`
  eyebrow and a large serif title with `4.0` in cyan; a horizontal row of circular icon
  filters (All / Workshops / Competitions / Presentations / Others) with an underline on the
  active one; a wide date/venue banner; `All Events` list where each row is a date block (month over day) + type chip + name +
  session + venue + a circular arrow button; sort control on the right.
- **Event detail**: back, brand lockup, bookmark + share; type eyebrow, large serif event
  name, one-line summary, paragraph description; a three-up meta strip (date/day, time/
  duration, venue/campus) separated by hairlines; full-width primary register CTA with a
  helper line beneath; tab bar (Overview / Speakers / Schedule / Venue / FAQs — render only
  tabs with data); `About` section with an optional media tile; `Key Highlights` as a 4-up
  grid of icon tiles; `Who can attend?` with a seats panel; a closing serif pull quote.
- **Delegate registration**: focused header, `DELEGATE REGISTRATION` eyebrow, serif
  `One ID.` / `Many possibilities.`, explanatory paragraph, a numbered vertical stepper on the
  left (**two steps only — Your Details, then Payment; there is no Review step**), imprint
  artwork on the right, then the form panel with an `01 — YOUR DETAILS` header, icon-prefixed
  fields, and a full-width cyan `Continue` CTA.

Do not implement mockups as fixed-height images — everything is real HTML/CSS.

## 8. RESPONSIVENESS
Mobile first, primary target 360–430px. No horizontal overflow anywhere. Touch targets at
least 44px. BottomNav is fixed with safe-area insets and is present on Home, Explore, My
Events, Profile, Programme, Results, Event Detail. It is hidden during focused flows: auth,
delegate registration, delegate payment, event registration, event payment — and returns after
success. Tablet/desktop: keep the same components, widen `PageContainer`, allow two-column on
list+detail. Desktop is an adaptation, never the design driver — except in `/admin`.

## 9. MOTION
- Welcome → Auth: large subtle cyan membrane/ripple, 650–850ms.
- Opening an event: small depth/ripple transition.
- Registration progression: the Signal travels the stepper line.
- Delegate approval seen for the first time: the Imprint activates.
- Event registration success: a controlled cyan pulse, then the QR reveals.
- Navigation: the Signal moves to the active nav item.
All motion respects `prefers-reduced-motion` (transitions collapse to fades under 120ms).
Use CSS transitions/keyframes and light Framer Motion only where it earns its place.

## 10. ADMIN DESIGN (deliberately different)
Same identity — near-black navy, cyan Signal, clean type, hairline structure — but tuned for
operations, not cinema. Dense readable tables, sticky filter bars, obvious statuses, large
screenshot review, fast approve/reject, keyboard-friendly. Desktop-first with a usable
narrow-screen fallback. No cinematic animation between admin screens. It should read as a
sophisticated STRIATUM operations console — not a generic Supabase admin template and not a
cyberpunk dashboard.

## 11. ACCESSIBILITY
Semantic landmarks, labelled inputs, visible focus rings in `--signal-400`, contrast at least
4.5:1 for body text against the abyssal ground, keyboard-operable dialogs and lightboxes, live
regions for async status changes.
