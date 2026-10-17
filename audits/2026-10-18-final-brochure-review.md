# STRIATUM 4.0 — Final brochure reconciliation (18 October 2026)

Reference: **STRIATUM 2026 final brochure_compress.pdf**, 58 pages, supplied by the organiser in chat. This is a **source-review proposal**, not a production deployment.

## Main result

All **26 named events** are present in the public.event catalogue. However, the public database still carries the old 14–18 Oct event-date range: the already-committed Oct 7 programme and combo-expiry migrations are **absent from the production migration history**. These must be applied/reviewed before claiming the site matches the new brochure.

## Corrections proposed in this PR

- Frontend event catalogue: canonical 28 Oct–1 Nov dates were already overlaid; add 75-slot STITCHREEF organiser override, brochure 30-slot PLEURALIS, proper 18 Oct GLANDSWARS prelim description, no fabricated 28 Oct start time.
- Submission deadlines from brochure pages 30–44: LUMINARA, Diagnostic Abyss and Coral Canvas **22 Oct**; CHIRONEX, NEURONOVA and The Uncharted **23 Oct**; Beyond the Blue, Tidal Cuts and Memeverse **26 Oct**; PPT submission for CHIRONEX/Diagnostic **30 Oct**.
- Eligibility: Oceanic Odyssey permits at most one 2023-batch third-year student; AQUAQUEST permits **two** 2022-batch final-year students; NEURONOVA may have four-person teams. Update visible rules and database rule migration.
- Academic domains: LUMINARA includes General Surgery rather than the former OBG/Biochemistry domains; Diagnostic Abyss includes ENT and Ophthalmology, not OBG.
- Workshop combo from PDF p.22: GENESIS + STITCHREEF + PLEURALIS: **₹2,800 → ₹2,500**, not ₹2,600. The Oct 18 deadline already exists in the frontend but must also be applied in Supabase.
- Search-crawl fallback: replace the retired SUTUREX/VITALIS labels with STITCHREEF/TRAUMA RESUSCITATION.
- SQL migrations (already tracked, **not applied**): extend combopricing until 18 Oct IST, fix dated events, capacities, team eligibility and the above combo discount.

## Full programme cross-check

| Code | Event | Brochure date/timing | Brochure slots | Notes |
|---|---|---|---:|---|
| S4/01 | THE SONO EDGE | 29 Oct 08:30–16:00 | 40 | Full-day; ₹1,200/₹1,400 |
| S4/02 | STITCHREEF | 29 Oct 08:30–12:30 | 50 printed | **75 explicitly approved in chat**, printed brochure is stale |
| S4/03 | PAEDOPRAXIS | 30 Oct 14:00–16:00 | 30 | ₹800/₹1,000 |
| S4/04 | PENUMBRA | 31 Oct 09:00–13:00 | 40 | ₹600/₹800 |
| S4/05 | GENESIS | 30 Oct 08:00–16:00 | 30 | ₹1,000/₹1,200 |
| S4/06 | GLOW CODE | 31 Oct 08:30–16:00 | 50 | ₹600/₹800 |
| S4/07 | BONEFIRE | 29 Oct 08:30–16:00 | 50 | ₹1,300/₹1,500 |
| S4/08 | TRAUMA RESUSCITATION | 30 Oct 08:00–16:30 | 30 | ₹1,800/₹2,000 |
| S4/09 | PLEURALIS | 29 Oct 14:00–16:30 | **30** | Current DB/old source 40 |
| S4/10 | RYTHMICA | 30 Oct 08:00–13:00 | 40 | ₹600/₹800 |
| S4/11 | OCEANIC ODYSSEY | 1 Nov; report 08:00 | Not stated | Teams of 3; at most one 2023-batch third-year |
| S4/12 | AQUAQUEST | 1 Nov; report 08:00 | Not stated | Solo or up to 3; two 2022 final-year allowed |
| S4/13 | GLANDSWARS | **Online prelim 18 Oct 18:00–18:45**; offline semis/finals 28 Oct | Not stated | Max 2; cross-college allowed |
| S4/14 | LUMINARA | 31 Oct | Not stated | Abstract by 22 Oct; domains revised |
| S4/15 | THE DIAGNOSTIC ABYSS | 1 Nov | Not stated | Abstract by 22 Oct; PPT by 30 Oct |
| S4/16 | CORAL CANVAS | 1 Nov | Not stated | E-poster submission by 22 Oct |
| S4/17 | CHIRONEX | 1 Nov | Not stated | Abstract by 23 Oct; PPT by 30 Oct |
| S4/18 | NEURONOVA | 1 Nov | Not stated | Brochure p.39 says 09:00, p.7 itinerary says afternoon; **confirm** |
| S4/19 | THE UNCHARTED | 31 Oct | Not stated | Abstract by 23 Oct |
| S4/20 | LIFE REIMAGINED | 31 Oct | Not stated | ₹150 |
| S4/21 | BEYOND THE BLUE | Submission by 26 Oct | Not stated | Event date not stated |
| S4/22 | BIOVERSE | 28 Oct | Not stated | Non-registerable exhibition |
| S4/23 | TIDAL CUTS | Submission by 26 Oct | Not stated | Event date not stated |
| S4/24 | MEMEVERSE | Submission by 26 Oct | Not stated | Max 3 entries per person |
| S4/25 | THE MEDICAL VAULT | 1 Nov | Not stated | ₹200 per team, delegate pass not required |
| S4/26 | MEDMAZE | 31 Oct | Not stated | Three-person team, SYNEXA (Tier 2) required |

## Significant unresolved product/organiser decisions

1. **QR scanning / one-time enforcement:** Brochure p.9 promises a *one-time QR* checked at a registration desk. Current delegate QR generator encodes `/verify?type=delegate&id=…`, but neither `src/services/router.ts` nor `vercel.json` registers a `/verify` route; Supabase lists **zero Edge Functions**. Do not claim the one-time verification workflow works until an actual scanner/validator is demonstrated.
2. **Delegate ID delivery:** Brochure p.9 promises the Delegate ID on the phone and email. Current login uses email/password and there is no SMS integration visible in this repo/Supabase Edge Functions. External/manual messaging may exist, but is unverified. Don't claim automatic dual delivery.
3. **Abstract channel:** Brochure instructs sending abstracts to `striatum04@gmail.com`; site UI advertises direct upload. Decide whether both are allowed and ensure the organisers monitor the chosen channel.
4. **NEURONOVA time conflict:** Itinerary p.7 labels 1 Nov *afternoon*; event detail p.39 says 9 AM. Leave start time unconfirmed instead of guessing.
5. **CORAL CANVAS poster specs:** P.33 requires landscape 4ft×3ft but also 1080×1920 pixels (portrait). Confirm official dimensions/resolution before enforcing.
6. **STITCHREEF printed vs organiser approved capacity:** Printed brochure says 50, live database and organiser instruction say 75. Keep 75 in website; update brochure/promotions separately.
7. **PLEURALIS capacity:** Brochure says 30 vs DB 40. Current booking counts are below both, but confirm that the 40-seat setting wasn't a separate organiser increase before applying the lowering migration.
8. **Late-bird price phase:** Brochure p.8 defines early Oct 10–18 and late Oct 19–Nov 1. `public.app_settings.pricing_phase` and frontend code are presently `early`; confirm a controlled switchover for Oct 19 (including server-side price calculation).
9. **Solo/team forms and quiz rosters:** Test Oceanic/Aquaquest/GLANDSWARS registrations and all four-person Neuronova teams end to end after rule changes.
10. **Admin proof/verification lag:** The user earlier reported scroll lag; this audit did not performance-test authenticated admin UI on real devices. Run a separate device/performance smoke test.
11. **Supabase migrations:** Some checked-in SQL files were never applied in the production history. Review drift/sequence with `list_migrations`, then execute in a maintenance window with backups and rollback plan.
12. **Live site validation:** Search-crawler cached content may differ from the currently deployed build. Perform a fresh production browser smoke test after merge; verify real payment totals, not only static cards.

## Required QA before release

- `npm ci && npm run build` in a clean checkout; verify the generated SEO and sitemap use the final programme.
- Mobile (390×844) and desktop: Home, Explore, each event, Programme, Combos, Cart, Registration, Profile, My Bookings.
- Validate all 26 dates/fees/rules against the reference PDF and check that *within-page collapsible facts* match the hero metadata.
- Verify actual checkout pricing with a safe test order (do not charge a real attendee), combo expiry and capacity holds.
- Re-run DB query for event dates/slots, registration year limits, combo `ends_at` and `discount_value` after migration.
- Test the real verification QR from pass image/download; avoid announcing it as one-time until server-backed semantics work.

**Status:** Draft corrections only, no deploy or production DB updates were made during this review. The previous 75-seat STITCHREEF live update from the prior conversation remains in place.
