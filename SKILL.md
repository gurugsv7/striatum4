---
name: mockup-to-product
description: Recreate supplied UI screenshots or approved mockups as functional, visually faithful interfaces. Use for screenshot-to-code builds and matching an existing reference design, including cinematic artwork and mobile layouts.
---

# Mockup to product

Treat the supplied mockup as the visual specification. Preserve its composition while building real controls, readable text, and actual application states. User-requested changes override the reference. Do not interpret an attractive implementation as proof of an exact match.

## Establish the visual contract

Inspect every supplied image before implementation. Record source dimensions, screen identity, section order, content gutters, hero proportions, card spacing, type hierarchy, icon style, navigation placement, and repeated visual motifs. Separate device chrome from application UI; do not reproduce an iPhone status bar as web content unless explicitly requested.

Create a small reference map and shared token file. Record which reference governs each screen and which deviations the user requested. Derive colors, fonts, borders, radii, and spacing from the references instead of substituting a generic component-library aesthetic. Keep long screens scrollable; do not compress their sections into one viewport.

## Preserve artwork; implement the interface

Classify each region:
- **Artwork:** photographic scenes, texture, illustrations, decorative handwriting. Prefer supplied original assets. If only screenshots are available, reuse clean editorial regions from user-provided references where appropriate. Read [crop geometry](references/crop-geometry.md) for a responsive implementation.
- **Live UI:** headings, descriptions, buttons, tabs, icons, metrics, search, lists, charts and navigation. Rebuild as semantic components backed by application state. Never place invisible hotspots over a full screenshot and call it a functional implementation.
- **Dynamic visuals:** maps, charts, avatars and camera overlays. Render from their actual data. Reference route shapes and sample scores are design examples, not production records.

Do not crop artwork that contains baked-in controls, metrics or unwanted text. Inspect crop edges at the narrowest and widest target widths. If clean artwork cannot be separated, use another authorized asset or an explicitly requested generated replacement, and disclose the visual difference. CSS viewport clipping of existing images does not require rewriting the image file.

## Build efficiently

Implement shared primitives first: application shell, navigation, header, panel, action row, activity card, editorial image viewport, empty state and dialog. Restyle accessible library primitives to the reference; their default appearance is not the design specification.

Build one representative screen to establish proportions and typography, then reuse its tokens and components across related screens. Use a constrained mobile canvas on desktop when matching mobile references, with an intentional desktop surround. Account for safe-area insets and reserve content space beneath fixed navigation.

Use local licensed fonts and verify the emitted font URLs in the production build. Narrow display type, body type and handwritten accents perform different jobs; do not replace all three with one generic sans-serif. Keep decorative text secondary to legible functional text.

Maintain real empty, loading, error, disabled and populated states. Wire every visible action or clearly identify its actual availability. Keep synthetic fixtures in a separate development harness. Never seed mockup people, achievements or scores as real user history.

For a requested 3D element, inspect model bounds, scale and actual clip names. Preserve the loaded rig; normalize through wrapper groups. Confirm visible rendering and provide loading/error/reduced-motion behavior. A successful asset request or an error-free canvas does not establish that the model is visible.

## Compare and finish

Follow the user's ordering preferences. If they defer browser checks, implement first and keep a specific visual-check backlog; do not claim pixel accuracy during the deferral.

When verification is authorized, compare reference and implementation at matching content widths and scroll positions. If the reference is a high-density screenshot, compare proportions rather than equating source pixels with CSS pixels. Test narrow and wide mobile widths, fixed-nav clearance, long content, dialogs, keyboard focus and font loading. For BEATCHAIN the useful width set was 360, 390, 412 and 430 CSS pixels.

Correct the largest differences first: section geometry and hero composition, then type scale, then spacing, then borders, color and details. Check interactive flows independently of visual resemblance. Record what was actually inspected and any deliberate deviations. Reserve “exact match” for evidence supporting it; otherwise say “closely follows the reference.”

For the original project's choices and unresolved verification, read [BEATCHAIN notes](references/beatchain.md). Those values are a case study, not defaults for unrelated products.
