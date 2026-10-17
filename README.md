# ATLAS-7 · The Validation Room

An immersive model validation simulation by Richard LeClezio.

## Play

Open `index.html`, then **Enter the validation room**. The hosted version and ZIP edition contain the same experience. All core features work without a backend. Internet access is used only for optional Google Fonts; local font fallbacks remain available.

- Five review days, a 40-hour budget, and a nine-hour daily limit.
- Twelve tests including the developer interview, spanning eleven defect areas.
- Seeded cases, watch-band follow-ups, findings, severity ratings, daily events and developer challenges.
- A scored debrief, answer key, six-month consequences and committee memo.
- Direct feature navigation: top links open dedicated views for The week, Evidence, Cases and Scoring without scrolling; each view supports direct URLs and browser Back.
- Interactive model observatory: drag-to-rotate perspective geometry, 11 selectable test areas, separated layers and review-state colours. Markers reveal only observed state during play.
- Context-sensitive next steps, evidence-chain displays, completion receipts, and a persistent decision journal.
- A cinematic debrief with a weighted score profile and direct tabs for the answer key, consequences and memo.
- Dedicated evidence selection, mobile panel navigation, automatic local progress saving, Home, Reset, New Case, field guide and light/dark themes.
- Readable 15–16 px investigation copy, higher-contrast supporting text, full-height test lists, and responsive panels that switch directly below 1100 px. Test actions sit below their descriptions so titles and instructions have the full card width.
- Download the memo as text or use Print / save PDF from the final report.

## Project structure

- `index.html` — landing page, evidence explorer, case dealer and interactive challenge.
- `app/index.html` — simulation engine and workspace.
- `assets/landing.css`, `landing.js` — landing presentation and session shortcut.
- `assets/workspace.css`, `workspace.js` — workspace presentation and controls.
- `assets/readability.css` — readable type, contrast and unclipped responsive investigation layout.
- `assets/model-core.webp`, `evidence-landscape.webp`, `committee-room.webp` — original generated artwork, included locally as lossless WebP.
- `assets/experience.js`, `experience.css`, `observatory.js` — observatory, decision journal, guidance and visual debrief.
- `assets/navigation.js`, `landing-visuals.js`, `landing-visuals.css` — direct feature views and visual presentation.
- `.openai/hosting.json` — Sites hosting configuration (excluded from the portable ZIP).

Progress is stored locally in the browser on this device. A different browser or host has a separate save. Reset and New Case replace the current review after confirmation. Private or restricted browser storage may prevent progress saving; the simulation remains playable and reports the storage limitation.

Case links use `app/index.html#case-K7QM` relative to the landing page. If a saved session matches the requested case, it resumes; use Reset to start the same case again.

## Portable ZIP / Vercel

The downloadable ZIP contains the contents of `` at its project root, plus a README and Vercel configuration. Extract it, commit the folder to GitHub, and import it into Vercel with **Framework Preset: Other**, no build command, and output directory `.`. No dependencies or secrets are needed.

## Verification

JavaScript syntax and automated simulation checks passed for 80 complete five-day cases, 44 exhibit states, save/resume, budget limits, deep links, reset, corrupt saved-state recovery and storage-disabled operation. Targeted checks also cover hidden-truth protection, next-action guidance, journal order, old saved cases and direct workspace views. The landing map, all 12 explorer states, dealer and challenges were also checked. The observatory geometry was rendered and inspected using a native canvas renderer. Browser-based visual QA was unavailable in the creation environment; responsive styles and print rules are implemented but were not screenshot-verified.

## Scenario

Institutions, people, models, thresholds and outcomes are fictional. Regulatory references are retained as scenario context, not as an authoritative statement of current requirements. Case generation, evidence, scoring and the original scenario structure are preserved.

## Artwork

`model-core.webp` was created with the built-in image-generation tool. Prompt: a cinematic precision computational core made of graphite and brushed titanium fins, exposed copper circuitry and an amber heart, suspended in a dark charcoal studio; fine orbital rings, realistic materials, restrained copper lighting, negative space at left for page copy; no text, logos or UI.


Additional original artwork was created with the built-in image-generation tool:

- Evidence landscape: a monumental architectural installation of dark metal data fins, stepped like a mountain range, with a continuous copper filament, smoked-glass sample blocks and warm ivory lighting; dark space on the left for HTML text; no labels, charts or UI.
- Committee room: an empty modernist boardroom above Manhattan at blue hour, a long dark stone and walnut table, brass pendant ring, ivory paper folders and restrained amber light; no people, text or UI.

All three PNG originals were transcoded to lossless WebP without changing the image content.

Animation can be paused in the observatory and respects the device's reduced-motion preference. The model has a static artwork fallback when canvas is unavailable. Existing saved cases remain compatible; their journal starts recording new actions after this update.
