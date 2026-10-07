# Implementation Status

Audit and architecture approved on 2026-10-03. The MVP is implemented; unsupported operational timings remain reviewable fields.

## Completed

- [x] Audit 184 slide texts and inspect current/historical visual examples.
- [x] Record approved source precedence, current roster, and scheduling decisions.
- [x] React + Vite + strict TypeScript, production build and lockfile.
- [x] Central roster/aliases, clinician partnerships, opponents/venues, branding, and rules.
- [x] Apply all twenty current player partnerships; remove departed players from active choices and automatic clinician assignment.
- [x] Preserve inactive historical identities only for regression parsing.
- [x] Reuse approved logos, watermark, and medical/dumbbell/basketball/playbook icons.
- [x] Local Trade Gothic fallback stack and bundled open-source Roboto.
- [x] Deterministic parser/provider interface, source-line tracking, and unknown/unparsed diagnostics.
- [x] Six original messages with independent expected structured schedules, including intentional unresolved values.
- [x] Current-roster demonstration and immediate-resolution test.
- [x] Separate scheduler with explicit/inferred/override/unresolved provenance.
- [x] Bare-time court starts, explicit ranges, clock cadence, safe ends, and blocked events.
- [x] Kawhi preparation, Garland/Collins TABLE, post-walkthrough PD preparation/practice court.
- [x] No arbitrary compressed-window split; unsupported preparation remains unresolved.
- [x] Separate workout staff, treatment clinicians, individual treatment ranges, and exception notes.
- [x] Editable metadata, groups, athletes, phases, clock, location, and notes without JSON.
- [x] Add/delete/reorder groups and athletes; walkthrough and meeting editing.
- [x] Immediate preview, provenance indicators, linked diagnostics, undo, and reparse confirmation.
- [x] Operational validation, including individual-conflict errors and possible group-window warnings.
- [x] Current-season SVG layout with measured reusable two-column blocks.
- [x] Header/row wrapping, compact/large walkthrough, bottom-right meeting, watermark, logo tiles.
- [x] Overflow reporting and export gating instead of unreadable shrinking.
- [x] Graphic-only 4000 x 2250 PNG and lower-resolution option with browser fonts/assets.
- [x] Replace rejected alternatives with three reference-directed designs: 1 · Clean, 2 · Sidebar, 4 · Arena; original retained.
- [x] Inspect all 18 new historical-sample graphics and actual 8K exports; test individual appointments in every new design.
- [x] Replace NBA opponent raster logos with 29 local official vectors; preserve originals.
- [x] Normalize icon artwork bounds, preserve transparency, soften photo edges and convert watermark white to alpha.
- [x] Refine studio spacing, responsive controls and capacity-based graphic padding without shrinking type.
- [x] Direct 8000 x 4500 ultra export and lossless PNG 300-DPI metadata.
- [x] Per-player treatment duration and reviewed nearest-slot planner with fixed appointments, clinician occupancy, workout/court exclusions, and bounded failure warnings.
- [x] Independent parser, scheduler, validation, and layout tests.
- [x] Browser QA of six historical schedules through explicit review edits, current-roster immediate export, editor actions, clipping/collisions, raster headers, and overflow rejection.
- [x] Visual inspection of actual downloaded graphics.
- [x] README with run/build/test instructions and season configuration guide.

## Daily review cases

- Compressed 95-clock preparation requires explicit approved timing until a specific pattern is configured.
- Off-roster names in historical messages must be replaced for current daily schedules.
- Unknown/neutral venue metadata and court ends without safe boundaries remain unresolved.

## Deferred by scope

- External game schedule feed.
- Vitamin/Rehab/referee legacy features.
- Optional LLM fallback.
- Automatic persistence across refresh.

QA artifacts are generated in `qa-output/`. Historical treatment assignments and ten-minute TABLE corrections in QA are explicit test-review edits, not production defaults or approvals.
