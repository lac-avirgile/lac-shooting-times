# Clippers Pregame Workout Times

## Public site

Live site: https://lac-shooting-times.pages.dev/

This is a static Vite app. For Cloudflare Pages, connect the `main` branch of
`lac-avirgile/lac-shooting-times`, use `npm run build` as the build command,
and set the output directory to `dist`. Node.js 22 or newer is required.
Each push to `main` can then deploy automatically. The app processes pasted
schedule text in the browser and stores roster changes in that browser's local
storage; it does not send either to a server.

The original PowerPoint deck and its extracted slide folder are intentionally
excluded from this public repository. The app uses the assets already checked
in under `public/assets/`.

Local basketball-operations graphic generator. Paste a daily message, parse, review the immediately rendered graphic, correct highlighted timings, and download a lossless 16:9 PNG at 4000 × 2250 minimum. Dense schedules export larger to preserve generous spacing and legible type.

## Run locally

Use Node.js 22.12+ (Node 24 was used for verification).

```powershell
cd 'C:\Users\avirgile\Dropbox\Adam Only\lac-shooting-times'
npm install
npm run dev
```

Open the local URL printed by Vite, usually http://127.0.0.1:5173. Dependencies are already installed in this workspace. For a repeatable clean installation elsewhere, use `npm ci` with the included lockfile.

For the compiled app:

```powershell
npm run build
npm run preview
```

Both servers bind to localhost. Daily text is processed entirely in the browser. No account, database, backend, external schedule service, or LLM key is required. After installation, all app assets and fonts are served locally. The reference PowerPoint is not opened or used at runtime.

## Daily workflow

1. Paste the message into the large textarea and click **Parse Schedule**. The example selector includes the six supplied historical messages plus an illustrative current-roster schedule (its times are demonstration data, not an actual daily assignment).
2. Review the nearly complete graphic. Open a group to edit players/order, each phase's start/end, individual clinician/treatment exceptions, location, clock, notes, or walkthrough state.
3. Amber fields require a value. Dotted field borders/◌ indicate inferred values; the source is available in the field tooltip. Configured and user overrides are identified in the editor.
4. Review the diagnostic panel. Clicking a group issue opens its editor. Errors block export; warnings identify information that requires operational review, including possible clinician-window overlaps. Warnings do not block export.
5. Edit date/game/venue under **Game details**. Date defaults to local today. A missing game number remains blank and the graphic header reads `PREGAME`.
6. Choose **1 · Clean**, **2 · Sidebar**, **4 · Arena** (default), or **Original · Operations** above the preview. The three new designs follow your October 3 reference images: white operations sheet, photographic Clippers sidebar, and angular dark arena poster. Switching designs preserves every schedule field and edit.
7. Choose **PNG quality** and click **Download PNG**. High quality is 4000 × 2250; Ultra quality is 8000 × 4500 (36 megapixels); Compact is 1920 × 1080. Every PNG is lossless with 300-DPI print metadata. Ultra renders directly at full size, not by upscaling a smaller screenshot. Pixel dimensions determine detail; the DPI tag controls print sizing (8000 pixels at 300 DPI is about 26.7 inches wide). Original low-resolution logos cannot gain new detail through export; replace source assets when sharper logos are needed. Ultra uses more browser memory and may take longer.

Each edit updates the preview immediately. Undo restores the previous edit. Re-parsing replaces structured edits and asks for confirmation if edits exist. Edits are currently kept in memory; keep the tab open until exporting. Refreshing the page clears them.

## Treatment conflicts and longer appointments

Open a player's group and set **Treatment duration (minutes)** (e.g. 30 or 45). Then open **Treatment planner** in the editor. It lists each proposed appointment, clinician, and how far it moved from normal time. Click **Apply reviewed treatment plan** when satisfied. Exact appointments become individual treatment overrides while the group TABLE window remains unchanged. The new designs print individual appointments with the athlete and clinician, highlighted red/pink. Original prints exceptions beside the athlete, omitting a redundant interval when it matches the displayed group window.

Manual individual appointments are locked and never moved automatically. Earlier shooting groups take priority. For other players, the planner finds the nearest available full-duration interval, preferring earlier times on ties; it excludes clinician bookings, performance, court, walkthrough, and meeting. It finishes treatment before the player's workout and searches no more than 120 minutes from the preferred TABLE start. It never shortens treatment or shifts workout/court times. Missing information, locked conflicts, or an impossible window prevent applying the plan.

Use **Release planned appointments** to replan previously accepted proposals (manual appointments remain locked), or disable an individual's treatment-times checkbox to unlock only that player. Changing a planned player's duration unlocks that proposal for review. All ranges can still be edited directly and Undo restores the previous plan. This is a bounded chronological planner, not a global optimizer; clinicians' unentered obligations are not represented. Longer annotations can still trigger the renderer's overflow protection.

## Scheduling and source precedence

The parser reads explicit facts. The separate engine derives timing only from approved rules/configuration. Priority is user edits, today's explicit raw text, configured player/group overrides, approved rules, defaults, then unresolved review.

- Bare player times are COURT starts.
- Explicit COURT ranges preserve both endpoints.
- Standard preparation: TABLE 15 minutes, then PERFORMANCE 15 minutes, then COURT.
- Early sequential COURT ends can use the next clear court/event boundary.
- Clock groups use a configured 15-minute court duration.
- Kawhi alone uses 30-minute TABLE and no PERFORMANCE. At walkthrough end, TABLE precedes walkthrough.
- The approved post-walkthrough PD pattern uses the practice court for 45 minutes, with preparation before walkthrough.
- Garland/Collins use a configured 30-minute TABLE window.
- Group TABLE represents a window, not an exact occupied interval for every clinician. Exact individual treatment overrides are separate.
- Parenthetical raw staff are workout staff, never treatment clinicians.

Samples 1, 2, 4, and 6 deliberately leave the 95-clock group's TABLE unresolved: the default sequence would overlap walkthrough. The graphic shows a clear review placeholder, and export is disabled until the editor supplies approved timing. QA uses manual ten-minute TABLE overrides solely to test correction/export; that split is **not** an automatic production rule.

Sample 1 follows its raw text, including Kawhi and all three early court starts. Sample 5 preserves Kawhi's explicit court overlap with the next group and warns for review. Historical day-specific red exceptions are not copied into new daily schedules.

See [RULES.md](RULES.md) for decisions and [VISUAL_SPEC.md](VISUAL_SPEC.md) for measured visual targets.

## Update season configuration

| What to update | File | How |
| --- | --- | --- |
| Roster/canonical names | `src/config/roster.ts` | Add a stable ID, full name, short TABLE name, and aliases to `rosterNames`. `historicalAthleteIds` excludes departed players from current choices/assignments. IDs connect to the partnership table. |
| Player aliases/typos | `src/config/roster.ts` | Add exact known variants. Case, whitespace, periods, and diacritics normalize automatically. Avoid aliases shared by two players. |
| Clinicians/partnerships | `src/config/clinicians.ts` | Edit `clinicianAssignments` and clinician choices. Mark confirmed assignments `source: 'user'`. This is the single assignment table. |
| Opponents/aliases | `src/config/opponents.ts` | Add/edit canonical name, short name, aliases, ID. |
| Away arenas/cities | `src/config/opponents.ts` | Edit `venue` and `city`. These are season data, not a live feed. |
| Home arena/city | `src/config/opponents.ts` | Edit `homeVenue`. Neutral-site days can override metadata in the editor. |
| Logos | `public/assets/`, `src/config/graphicAssets.ts` | NBA opponents use local official vectors in `assets/logos/`; non-NBA opponents fall back to `<opponent-id>.png`. Add vector IDs to `graphicAssets.ts`. Replace approved assets without changing schedule code. |
| Watermark/icons | `public/assets/` and `src/config/brand.ts` | Replace approved assets and update configured paths if needed. |
| Colors/fonts/proportions | `src/config/brand.ts` | Edit centralized branding tokens. |
| Designs/export sizes | `src/config/templates.ts`, `src/config/referenceDesigns.ts` | Template identities, export presets, geometry and background assets. Original layout lives in `graphic/layout.ts`; the three new measured layouts live in `graphic/referenceDesign.ts`, `graphic/scene.ts`, and `graphic/SceneGraphic.tsx`. All share schedule data and the same exporter. |
| Durations/player patterns | `src/config/rules.ts` | Edit approved defaults and named overrides; update corresponding fixture expectations/tests. |

Your latest assignments are configured for Jesse, Maggie, JP, Dan, Colby, and Lorin. Cam Christie is with Dan. `Jordan Mller` maps to Jordan Miller; `Max Straus` maps to Max Strus. `Brad`, `Rui`, `Keaton`, `Yanic`, and `Yuki` map to Bradley Beal, Rui Hachimura, Keaton Wagler, Yanic Konan Niederhäuser, and Yuki Kawamura.

The user confirmed Kawhi, Nico, Bennedict, John Collins, Bogdan, Sean, Norchad, and TyTy are off the roster. They remain in `historicalAthleteIds` for regression parsing but are excluded from active-player choices and have **no automatic clinician assignments**. The original samples therefore flag off-roster players and missing clinicians. Replace them for current daily schedules. Browser QA explicitly enters historical clinician assignments only to verify those original graphics; the application never loads those overrides automatically.

Abbreviated names were verified using official NBA player profiles: [Bradley Beal](https://www.nba.com/player/203078/bradley-beal/bio), [Rui Hachimura](https://www.nba.com/player/1629060/rui_hachimura), [Keaton Wagler](https://www.nba.com/player/1643413/keaton-wagler/profile), [Yanic Konan Niederhäuser](https://www.nba.com/player/1642949/yanic-konan-niederhauser/profile), [Max Strus](https://api-hub.nba.com/player/1629622/max-strus/bio), [Blake Wesley](https://www.nba.com/player/1631104/blake-wesley/videos), [Yuki Kawamura](https://www.nba.com/stats/player/1642530/career/). Partnership assignments come from your instruction, not those pages.

## Fonts and asset provenance

Original uses locally installed Trade Gothic Next/Heavy when available, with Arial Narrow/Roboto/Arial fallbacks. Roboto's 400/700/900 weights are included via `@fontsource/roboto`. The new designs bundle open-source Bebas Neue (display) and Roboto Condensed (schedule text) locally through @fontsource. Each package includes its license. Typography is centralized in branding configuration. Trade Gothic files are not bundled or extracted.

Logos/icons/watermark were extracted once from the approved reference deck using `scripts/extract_reference_assets.py`. The source-to-output manifest is in that script. The new designs reuse photographic excerpts from your supplied reference images, documented in [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md). `public/assets/` is self-contained; production has no PowerPoint or image-generation-model dependency.

The live graphic is SVG. PNG export rasterizes its shapes/logos, then draws the same measured text runs through the browser's canvas font engine, preserving local/fonts and underlines. This avoids a Chromium bug that omitted heavy text when SVG-image webfonts were embedded. Only the graphic is exported; no editor or browser controls are captured.

## Verification

```powershell
npm run verify
npm run test:browser
```

`verify` runs TypeScript, Vitest, and the production build. `test:browser` uses installed Microsoft Edge, starts a temporary local production-preview server, and stops it afterward. Build first when running browser QA independently. To use Chrome, set `$env:QA_BROWSER = 'chrome'`. To use an existing server, set `$env:QA_URL = 'http://127.0.0.1:5173/'`.

Tests include independent complete expected schedules for all six raw samples, parser facts, clinician updates, known aliases, incomplete input, explicit timing precedence, no-walkthrough schedules, PD/Stay Ready/pre/post-walkthrough cases, phase ordering, player-level clinician conflicts, duplicate players, and overflow.

Browser QA checks all six rendered schedules, unresolved export gating, explicit editor corrections, exact 4000 × 2250 PNG dimensions, rendered text bounds/collisions, names, home/away, clinician mapping, clocks, raster header presence, and adversarial oversized text. Artifacts are saved in `qa-output/` (ignored by Git). QA correction values are recorded in `browser-report.json` and are not rule approvals.

Verification on 2026-10-03: 84 unit tests cover parser, rules, validation, treatment planning, layout, PNG density and image composition, including the actual Hawaii message and ordered backup-clinician proposals. Strict TypeScript and production-build checks are included in `verify`. Edge browser QA covers all six schedules in Original and designs 1/2/4, canonical data preservation and bounds/collisions, plus exports at 4000 × 2250 and 8000 × 4500 with 300-DPI metadata. Image decoding, crop viewport dimensions and mobile UI overflow are checked too. Current-roster individual treatment plans are checked in all three designs. Treatment tests cover the Derrick/Garland conflict, longer durations, locked/manual appointments, walkthroughs, impossible windows, and unchanged workout/court times. New-design capacity is validated independently; it does not inherit the original layout's capacity restrictions.

## Oct 4 Hawaii operational test

Click **Load Oct 4 Hawaii game** below Parse Schedule to load the approved message with October 4's date, Honolulu and the Bankoh Arena at Stan Sheriff Center venue override. Pasting that same approved message also loads its daily context. Times remain Hawaii local time; edit Game details for other neutral-site games. Game number is not invented. If no meeting is supplied, the approved rule places it at the resolved final court end: 12:25 PM, 35 on the clock for this game. Editing the final court end or tip updates this inferred meeting; explicit meeting details and manual edits take priority. An unresolved final court end leaves the meeting unresolved rather than inventing a time.

Review **Treatment planner**, then **Apply reviewed treatment plan**. Primaries are attempted at the normal time before Colby, Dan, Jasen Powell backups. Only if no clinician fits is a nearby time proposed. Backup changes are highlighted and displayed in the graphic after acceptance. Explicit clinician edits and manual appointments stay fixed. Update backup order in `src/config/clinicians.ts`; Fletcher Loyer has been added with Lorin as primary. All availability is based on recorded appointments, not external staff calendars.

## Known limits

### Roster settings and conflict resolution

Open **Roster & treatment defaults** below the text input. Add/remove/restore players, type full names and comma-separated aliases, assign primary/secondary clinicians, and edit default minutes. Click **Save roster settings**. These persist across refresh in this browser only. Reparse to apply changed settings; existing schedule edits are preserved until you confirm reparsing.

Default active-player treatment: 15 minutes, except Rui, Darius and Brandon Ingram at 30. Clinicians: Jasen, Colby, Dan, Maggie, Jesse, Eric, Lorin. Older JP/Jasen Powell labels are normalized for conflict checks. A chosen secondary precedes shared backups.

**Timing & clinician conflicts** groups actionable warnings/errors by affected group/player. Confirmed overlaps block export; group-window uncertainty remains a review warning. Treatment alternatives are nearest first and preserve court/workout times. **Preview shorter options** does not modify treatment; selecting a proposed slot explicitly accepts its duration, time and clinician. Unknown occupancy is conservatively reserved from group TABLE windows. If a conflict is in COURT/PERFORMANCE rather than treatment, edit those group phase times directly.

Clean and Sidebar use regular-weight phase times; player headers retain their stronger hierarchy. Run `node scripts/settings-qa.mjs` against the running local preview for roster persistence, three long-duration defaults, explicit shortening, rendered text geometry and 4000×2250 export checks.

- Compressed windows remain review cases until a specific split is approved.
- Exact clinician occupancy is known only when individual treatment times are entered. Group-window overlaps remain warnings.
- Adding/changing a phase or group in the editor does not silently shift other groups. Dependent timing/clock inconsistencies are flagged for manual correction.
- AM/PM resolves against an explicit tip when unique; ambiguous input and schedules crossing midnight need manual review. The MVP models one game date.
- Two-column output has a fixed capacity. Overlong headers/notes/metadata block export instead of shrinking to unreadable sizes.
- Local font installations can affect typography. Microsoft Edge on Windows was used for export QA; other browsers should be verified before operational adoption.
- NBA opponent logos now use local vectors. The non-NBA logo and supplied photographic excerpts remain limited by their original raster resolution; export does not invent additional image detail.
- Rare legacy Vitamin/Rehab/referee types and external team-schedule lookup are deferred.
- No automatic draft persistence across refresh yet.

## Code boundaries

`domain` defines facts/provenance/time; `parser` classifies raw text; `scheduler` derives approved fields; `validation` reports operational issues; `editor` contains normal controls; `graphic/layout.ts` measures/allocates reusable blocks; `graphic/PregameGraphic.tsx` renders SVG; `graphic/exportPng.ts` exports it. The parser interface in `parser/parser.ts` permits a future optional fallback without making an LLM part of the current workflow.
# Quick conflict review

Clinician conflicts show quick actions: use a backup for the full duration, shorten to 15 minutes with the current primary where safe, or move the full treatment to the nearest safe primary slot. These are choices, not automatic changes. More slots are ordered nearest first; custom shorter durations require selecting a slot. **Edit manually** opens the corresponding group editor. A reviewed full-treatment plan can also be explicitly accepted from Treatment planner. Unknown individual occupancy is marked estimated and conservatively checked against displayed group windows.
# Spacious graphic layout

All designs share `src/config/graphicSpacing.ts`: 48-unit outside margins, 24-unit card padding and group gaps, 56-unit minimum name headers, and 30-unit line spacing. Name baselines are optically centered. Main operational type is 24 SVG units (approximately 12pt at 300 DPI in the preferred export); supporting text is at least 20 units (10pt). Headers are larger. Clean and Sidebar preserve the side-by-side performance/court layout for dense schedules. Original now has its own adaptive canvas and no longer silently switches to Clean when crowded. Empty space is intentional; rows are not stretched to fill it. Dense schedules grow in 16:9, with proportionally larger PNG dimensions to retain print legibility. Compact preview exports are screen-oriented, not the recommended print output.

The saved Oct 4 Hawaii fixture reflects the latest update: no Kobe, Brandon Ingram shoots with Gradey at 10:40, and Brook shoots alone at 12:10. Re-load the saved game to replace an earlier parsed version (this replaces structured edits after confirmation). Treatment changes still require explicit approval.

Latest spacing QA: `node scripts/spacing-qa.mjs` checks all six historical fixtures plus the revised Hawaii game in all four templates (28 renders). It checks actual browser text bounds, collisions, optical player-header centering, decorative-rule clearance, and 10pt minimum type. It exports the revised Clean graphic at 5344 × 3006 while preserving print type size. Current `npm run verify`: 105 tests, strict TypeScript, and production build.
# October 4 operational correction

**Load Oct 4 Hawaii game** applies the user's approved daily overrides: Brandon Ingram and Gradey Dick each receive 15 minutes, Yuki receives Colby, and Blake receives Lorin. Initial individual appointments have no clinician/player overlaps. Exact matching pasted text (ignoring case/whitespace) uses the same approved game context and PRESEASON GAME 1 label. Brandon's season default remains 30 minutes for other schedules.

Individual appointments are visible and editable directly inside each player row. Clearing a duration no longer restores its default; incomplete values block export. Typing or using number controls updates that player's start immediately, preserving their end and leaving other athletes alone. Red-star annotations show exceptions to the group TABLE window. Clinician conflicts are checked against individual intervals, including inferred defaults, rather than treating a long group window as every athlete's appointment. Use `node scripts/operational-qa.mjs` for real browser input/export checks.

Latest verification: 111 tests, strict TypeScript and production build pass. Operational Edge QA checks all 17 approved individual appointments and confirms zero initial overlaps, actual clearing/typing/spinner duration edits, independent manual time edits, player-name focus while typing, game metadata editing, group add/delete/reorder, matching-text paste/parse and actual downloads from all four templates. Roster/settings persistence QA and all 28 schedule/template layout checks pass. PNG files were decoded/visually inspected; all four exports contain verified 300-DPI metadata. Original exports at 4672 × 2628; the approved Clean/Sidebar/Arena schedules export at 5344 × 3006. Results and images are under `qa-output/operational/`, `qa-output/spacing/`, and `qa-output/settings-qa-report.json`. Daily structured drafts still do not persist across refresh; roster settings do. Download a draft you need to preserve before reloading the approved game.
