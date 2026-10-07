# Scheduling Rules Audit

Audit date: 2026-10-03

This document combines the reference audit with the user's approved implementation decisions (2026-10-03). The decisions below supersede any historical observations or earlier unanswered questions.

## Approved implementation decisions

Additional authoritative partnership update from user: Bradley Beal, Isaiah Jackson, Rui Hachimura, Jordan Miller -> Jesse; Darius Garland, Brandon Ingram, Derrick Jones Jr., Keaton Wagler -> Maggie; Jalen Pickett, Gradey Dick -> JP; Max Strus, Brook Lopez, Cam Christie, Kobe Sanders, Nick Martinelli -> Dan; Yanic Konan Niederhäuser, Baba Miller, Kris Dunn -> Colby; Blake Wesley, Yuki Kawamura -> Lorin. This supersedes historical Cam/Jasen. Known typo aliases include Jordan Mller and Max Straus. Keaton resolves to Keaton Wagler using the official Clippers player page.

The user confirmed Kawhi, Nico, Bennedict, John Collins, Bogdan, Sean, Norchad, and TyTy are no longer on the roster. They remain inactive historical identities for regression parsing only, excluded from new-player choices, with no current clinician partnership. Their clinician fields remain unresolved unless manually overridden. Only user-confirmed current players receive automatic partnerships (the original twenty plus Fletcher Loyer, confirmed Oct 3). Historical-only QA overrides never enter production configuration.

Source-of-truth priority, highest first:

1. Structured editor user edits.
2. Explicit information in today's raw text.
3. Player/group-specific configured overrides.
4. Approved schedule rules.
5. Configurable defaults.
6. Unresolved warning.

Historical slides never override today's explicit text. Sample 1 follows its raw message, retains Kawhi, and uses 2:15, 2:30, and 2:45 as the first three COURT starts. Every bare player/group time means COURT start. Explicit ranges define both ends.

COURT end priority: explicit end; otherwise a clear next start for sequential early groups; otherwise configured duration for clock groups. Do not extend a main-court group through a walkthrough. A final non-clock group may end at an explicit meeting boundary when it fits the known sequential pattern. If no safe boundary exists, leave the end unresolved. Overlapping explicit ranges are preserved and validated, never trimmed silently.

Normal TABLE and PERFORMANCE durations are 15 minutes each, with TABLE immediately preceding PERFORMANCE and PERFORMANCE immediately preceding COURT. Player rules override these defaults. Current Kawhi pattern: 30-minute TABLE, no PERFORMANCE, explicit COURT range preserved; when COURT starts at walkthrough end, TABLE ends at walkthrough start. Current Garland/Collins preparation uses a configured 30-minute TABLE window. Approved post-walkthrough development pattern: 45-minute practice-court COURT, TABLE and PERFORMANCE in the 30 minutes before walkthrough. Other compressed windows require review; do not arbitrarily shorten preparation. Historic ten-minute splits are not globally approved.

Displayed group TABLE is a treatment/preparation window, not exact clinician occupancy. Preserve separate per-athlete treatment timing and notes. Known player-level treatment overlaps may be errors; overlaps based only on group windows are possible-overlap warnings. Parenthetical raw names always denote workout/court staff. MVP only accepts treatment overrides through dedicated editor fields, never arbitrary parentheses.

Additional user-approved treatment requirement: athletes may require different treatment durations (e.g. 30 rather than 15 minutes). A clinician cannot treat two players simultaneously. Prefer normal treatment timing; if unavailable, propose the nearest feasible full-duration appointment that does not overlap clinician bookings, the athlete's workout/shooting, walkthrough, or meeting. Do not shorten treatment or move workout/shooting times to make it fit. Individual appointments remain editable.

Implementation policy for reviewable proposals: explicit individual appointments remain locked; earlier shooting groups take priority among unlocked players. Search in one-minute increments, preferring earlier treatment on equal-distance ties, within a configurable ±120-minute review window on the same date. All treatment completes before the player's PERFORMANCE (or COURT if performance is not applicable). This bounded chronological planner is not a global optimizer and does not claim to model unentered staff obligations. Unknown required inputs, locked conflicts, or no safe slot produce review issues; no partial plan is applied. Applying a reviewed plan records individual overrides and leaves the displayed group TABLE windows unchanged. The planner never runs silently during parsing.

Game date defaults to local today and is editable. Opponent/home-away config resolves venue and city. Game number is editable and may be blank; never invent it. All game metadata is editable. No external game-schedule dependency.

MVP includes normal groups, Kawhi special preparation, walkthrough, post-walkthrough PD, practice court, Stay Ready, clock groups, individual treatment exceptions, and meeting. Legacy Vitamin/Rehab/referee features are deferred, with an extensible domain model.

Typography is centralized. Use locally installed Trade Gothic Next when available, a similar fallback otherwise, and bundled open-source Roboto. Do not redistribute or extract protected Trade Gothic files. Supplied embedded logos, icons, and watermark are approved for internal reuse.

Field provenance remains explicit/inferred/override/unresolved. Editor distinguishes inferred and unresolved values; export does not display provenance. Unresolved required timing blocks export until corrected. Preferred export is at least 4000 x 2250. The native renderer starts at 1920 x 1080 and grows in 16:9 for readable spacing; PNG dimensions scale proportionally. Newer Slides 1-98 define the original visual system, with subsequent user-approved design and spacing refinements.

Daily workflow: paste -> parse -> immediate graphic -> review highlighted fields -> edit -> download. Each of the six samples must have expected structured fixture assertions, including intentionally unresolved values. Final QA includes every fixture graphic.

Remaining decisions: no blanket compressed-window split is approved; individual treatment occupancy is unknown unless entered or accepted from a reviewed plan; neutral venues may need manual edits. These cases remain reviewable in the editor rather than blocking implementation.

## Evidence key

- **Confirmed**: directly repeated in the reference deck or preserved between a supplied message and its matching export.
- **Default candidate**: common enough to configure as a default, but not safe as an unconditional rule.
- **Exception**: a recurring or one-off departure that must be representable.
- **Unresolved**: requires an operational decision; the application must warn rather than guess.

## Sample-to-reference crosswalk

| Input | Closest exported reference | Match quality | Important observations |
| --- | --- | --- | --- |
| Sample 1, Warriors | `Slide2.PNG`, Game 82, Apr. 12, 2026 | Partial | Opponent, tip, walkthrough, most personnel, and clock groups match. The export omits Kawhi, moves Sean/Norchad's court start from the raw 2:15 line to 2:30, and places Cam/TyTy after the walkthrough although the raw text does not say `post walkthru`. This is not safe precedent for silent inference. |
| Sample 2, OKC | `Slide4.PNG`, Game 80, Apr. 8, 2026 | Strong | The post-walkthrough trio becomes a 45-minute practice-court group beginning at walkthrough end. |
| Sample 3, Sacramento | `Slide6.PNG`, Game 78, Apr. 5, 2026 | Strong | No walkthrough. Explicit Kawhi and clock-relative court times are preserved. Jordan and John have day-specific clinician exceptions. |
| Sample 4, Portland | `Slide8.PNG`, Game 76, Mar. 31, 2026 | Strong | Same post-walkthrough pattern as Sample 2. |
| Sample 5, Indiana | `Slide10.PNG`, Game 74, Mar. 27, 2026 | Strong | No walkthrough and no clock labels on the group headers. Ten-minute court blocks are used where the next stated court start is ten minutes later. |
| Sample 6, Toronto | `Slide11.PNG`, Game 73, Mar. 25, 2026 | Strong | The named PD group starts at walkthrough end and uses the practice court for 45 minutes. |

## A. Confirmed rules and facts

### Input semantics

1. `vs` and `at` determine home/away state. The final game line expands opponent aliases to a full franchise name.
2. A range explicitly attached to a player/group is a court range in the matching references. Examples include Kawhi's `5:00-5:25` and all explicit walkthrough ranges.
3. Clock labels are relative to tip, not arbitrary captions. In the current 35-minute cadence:
   - 95 on clock = court starts tip minus 95 minutes.
   - 80 on clock = tip minus 80 minutes.
   - 65 on clock = tip minus 65 minutes.
   - 50 on clock = tip minus 50 minutes.
   - team meeting at 35 = tip minus 35 minutes.
4. The staff member in parentheses in the supplied messages is not the final TABLE clinician. For example, raw `Norchad Omier (Chris)` becomes `Norchad w/Jasen`, and raw `Sean Pedulla (Cookie)` becomes `Sean w/Colby`. The parser must retain this as a distinct `workoutStaff` fact and must not use it as treatment assignment.
5. `Walkthru` and `Walkthrough` represent the same event. Historical graphics normalize the display label to `TEAM WALKTHROUGH`.
6. A comma/`and` player list following a `PD Group` or post-walkthrough statement belongs to that named group even when it is on the next line.
7. Group numbers are presentation order, not player identifiers. They restart at `#1` on every graphic.
8. Final graphics normalize player display names and known spelling variants. The historical output uses `BENNEDICT MATHURIN` even when the raw text says `Benedict`.

### Schedule relationships

1. The normal displayed phase order is TABLE, PERFORMANCE, COURT.
2. PERFORMANCE ends when COURT begins in the ordinary groups inspected.
3. TABLE normally ends when PERFORMANCE begins, except where an athlete-specific treatment time or walkthrough rule is called out.
4. Explicit values must win over derived values. Historical exceptions are visibly annotated in red rather than hidden.
5. A named post-walkthrough/PD group in Samples 2, 4, and 6 begins COURT at walkthrough end and runs 45 minutes on the practice court.
6. The post-walkthrough group's TABLE and PERFORMANCE occur before the walkthrough in those same examples.
7. Current 95/80/65/50 groups normally occupy consecutive 15-minute court blocks, ending at the 35-minute meeting point.
8. In Sample 5, where clock labels are absent, successive stated court starts determine preceding court ends: 5:20, 5:30, 5:40, 5:50, 6:00, and 6:15 produce a mixture of 10- and 15-minute court ranges. The last group ends at the explicit 35-minute meeting time.
9. The application must preserve a daily explicit treatment override separately from the group TABLE window. Historical red callouts include forms such as `Jordan w/Jesse at 5PM`, `post-walkthrough`, and `John w/Jesse at 5:50PM`.

### Current-season clinician partnerships observed

These are confirmed observations in the 2025-26 references, but remain configurable data rather than immutable scheduling rules.

| Athlete | Modal final TABLE clinician | Observed exception |
| --- | --- | --- |
| Kawhi Leonard | Maggie | None in the six matched examples |
| Nicolas/Nico Batum | Jasen | None in the six matched examples |
| Derrick Jones Jr. | Maggie | None in the six matched examples |
| Jordan Miller | Jesse | Jasen on the Sacramento reference |
| Bennedict Mathurin | Colby | None in the six matched examples |
| Darius Garland | Maggie | None in the six matched examples |
| John Collins | Jesse | Dan on the Sacramento reference |
| Brook Lopez | Dan | None in the six matched examples |
| Bogdan Bogdanovic | Colby | None in the six matched examples |
| Cam Christie | Jasen | None in the six matched examples |
| Isaiah Jackson | Jesse | None in the six matched examples |
| Kris Dunn | Colby | None in the six matched examples |
| Kobe Sanders | Dan | None in the six matched examples |
| Sean Pedulla | Colby | None in the six matched examples |
| Norchad Omier | Jasen | None in the six matched examples |
| TyTy Washington | Dan | None in the six matched examples |

## B. Common but configurable defaults

These defaults should be centralized, versioned by season, and always overridable.

1. Standard TABLE duration: 15 minutes.
2. Standard PERFORMANCE duration: 15 minutes.
3. Standard clock-group COURT duration: 15 minutes.
4. Standard early-group COURT end: next group's court start, when that produces a plausible positive range.
5. Current meeting default: 35 minutes on the clock.
6. Current late-group cadence: 95, 80, 65, 50, then meeting at 35.
7. Kawhi pattern in current references: 30-minute TABLE, no PERFORMANCE row, and 25-minute COURT.
8. Darius Garland/John Collins group: a 30-minute displayed TABLE window in the matched current examples.
9. Brook Lopez/Bogdan Bogdanovic group: a 15-minute TABLE window.
10. Early standard groups: 15-minute TABLE and 15-minute PERFORMANCE, unless walkthrough placement or an explicit override changes them.
11. Post-walkthrough development group: 45-minute COURT on the practice court, with preparation before walkthrough.
12. Unqualified times in these afternoon/evening messages are PM after resolving them against the explicit tip time and chronological order. If more than one AM/PM resolution remains plausible, the result is unresolved.
13. Display uses full franchise name, configured arena/city, and configured team logos after alias normalization.

## C. Genuine exceptions that the model must support

1. **No PERFORMANCE phase:** Kawhi commonly has TABLE and COURT only.
2. **Compressed preparation:** the interval from walkthrough end to the 95-clock court slot can be only 25 minutes. In different current references either TABLE or PERFORMANCE is ten minutes. There is no proven universal split rule.
3. **Post-walkthrough treatment:** Jordan is repeatedly shown with a red treatment note after walkthrough while the paired athlete uses the normal displayed TABLE window.
4. **Pre-walkthrough preparation:** older slides show TABLE/PERFORMANCE before walkthrough and COURT afterward, often on the practice court.
5. **Practice-court blocks:** PD, Stay Ready, Vitamin, Rehab Vitamin, and some ordinary groups have 40-, 45-, or 60-minute court blocks.
6. **Large groups:** historical headers contain three to six players and wrap to two lines.
7. **Special group labels:** `PD GROUP`, `STAY READY GAME`, `VITAMIN GROUPS`, and `REHAB VITAMIN` are all present in the deck.
8. **Alternative clock cadence:** 2024-25 examples use 85/70/55 with a 40-minute meeting rather than 95/80/65/50 with a 35-minute meeting. A few historical slides also use 60-minute labels.
9. **Ten-minute court blocks:** present in Sample 5 and other no-walkthrough references.
10. **Player-specific early treatment:** Isaiah, Jordan, John, Norman Powell, Ivica Zubac, Ben Simmons, and others have red callouts at times outside the group TABLE window.
11. **Clinician changes by day:** Jordan and John differ on the Sacramento slide from their modal current-season assignments.
12. **Optional operational blocks:** older graphics include referees and additional rehab groups. These are real history but may be outside the MVP scope.
13. **Historical visual generation changes:** 2024-25 uses a gray/red outlined event-card treatment and a different performance icon; 2025-26 uses red event cards, navy outlines, and a dumbbell icon.

## D. Original audit questions (resolved by approved decisions above)

This list preserves the original audit trail. Answers above supersede these questions. Remaining daily review cases are compressed preparation without an approved split, off-roster historical players, unknown/neutral venue metadata, and court ends with no safe boundary.

1. In Sample 1, should the expected output follow the raw text literally, or reproduce Slide 2's later operational changes (Kawhi omitted, Sean/Norchad shifted, Cam/TyTy moved after walkthrough)?
2. Does a bare time on every player line always mean COURT start? Sample 1's closest reference contradicts that interpretation; the other five samples support it.
3. What exact rule decides whether the 25-minute post-walkthrough preparation window is TABLE 15 + PERFORMANCE 10 or TABLE 10 + PERFORMANCE 15?
4. Are displayed group TABLE ranges the exact occupied interval for every listed clinician, or only a shared availability window containing staggered individual treatments? This affects clinician-overlap validation.
5. How is the final court end derived when there is no following group and no meeting-at-clock value?
6. What syntax in a daily message denotes an explicit treatment-clinician override, since ordinary parentheses denote workout staff?
7. Which season's clinician partnership table is authoritative at launch, and who owns updates?
8. Should older features (referee cards, Vitamin/Rehab blocks, 40-minute cadence) be editable in MVP or only preserved in the domain model for future use?
9. Raw messages do not contain game date, game number, arena, or city. Should date default to the local date, and should game number be optional/manual?
10. For home games, is Intuit Dome always assumed? For neutral-site/preseason games, how is venue selected?
11. When opponent aliases conflict between header and tip line, which line is authoritative? The safe default is an error requiring review.
12. Are clinician conflicts hard errors or warnings when the historical slide itself displays overlapping group TABLE windows?
13. Are Trade Gothic Next font files available and licensed for bundling? The PowerPoint references them but does not embed font binaries.
14. Is the pale Clippers script watermark approved for direct reuse from the deck, or should a current brand asset replace it?

## Required provenance policy

### First operational game and backup clinician approval (2026-10-03)

Subsequent user-approved settings supersede duration/backup labels below for the active roster:

- In-app roster editing allows typed names, removal/restoration, aliases, primary/secondary clinicians and per-player default treatment minutes. Clinician choices: Jasen, Colby, Dan, Maggie, Jesse, Eric, Lorin. Jasen/JP/Jasen Powell refer to the same clinician for conflict detection.
- All active players default to 15 minutes except Rui Hachimura, Darius Garland and Brandon Ingram, who default to 30. Daily explicit duration edits still override season settings. Legacy inactive player exceptions remain available for historical regression fixtures.
- A configured secondary is tried before the shared Colby → Dan → Jasen backup order. Manual daily clinician edits are fixed unless the user explicitly accepts a clinician-changing conflict-resolution option.
- Same-player overlaps across groups and known clinician double-bookings are errors. Unknown individual occupancy yields clearly separate possible-overlap warnings, not definite claims.
- Treatment conflict options are listed nearest-to-furthest from the current individual start (or displayed TABLE start if none is recorded), within the existing bounded search. Other unknown clinician occupancy is conservatively reserved using displayed TABLE windows. Missing times cannot be treated as available space.
- Shorter treatment options are preview-only until explicitly selected; the accepted duration/time/clinician carries override provenance. No automatic shortening or workout/court shifting is allowed.
- Settings persist in this browser's local storage. Saving does not replace current structured edits; export is gated until reparsing applies changed settings. Settings do not currently synchronize between people or browsers.

- Oct 4 Hawaii preseason game: vs Warriors, 1:00 PM tip. All message times are Hawaii local time; do not convert them to the computer's timezone. Venue override: Bankoh Arena at Stan Sheriff Center; city: Honolulu, HI. The raw `vs` designation is retained, not used to replace the supplied neutral-site venue with Intuit Dome. Game number remains blank and no meeting/walkthrough is invented.
- Fletcher means Fletcher Loyer, primary clinician Lorin. Yuki Kawamura and Blake Wesley also remain with Lorin as their primary. Confirmed aliases: KD = Kris Dunn, Pick = Jalen Pickett, DJ = Derrick Jones Jr., DG = Darius Garland, BI = Brandon Ingram.
- Treatment planner first seeks the full required duration at the normal TABLE start with the primary clinician, then backups in order: Colby, Dan, Jasen Powell. A clinician cannot occupy two overlapping player appointments, including when acting as backup. If nobody fits at the normal time, use the existing nearest-time search, earlier on ties, checking primary then backups at each candidate time.
- Backup assignment/time changes are reviewable proposals, never applied silently. Explicit individual appointments remain locked. A manually edited clinician is fixed; season-derived primary assignments may use backups. Releasing a planned backup restores the prior primary unless the clinician was subsequently manually edited.
- This is a deterministic chronological-priority planner, not a globally optimal solver. Availability is based on recorded appointments only; off-schedule clinician commitments must be entered/reviewed operationally.

Every editable or derived schedule field must carry one of:

- `explicit`: parsed directly from a source line, with source line number/text.
- `inferred`: derived from an approved rule, with a stable rule ID.
- `override`: supplied by season/player configuration or manually edited, with its source.
- `unresolved`: no approved deterministic value exists.

No unresolved value may be silently replaced with a plausible-looking time. Manual edits should remain distinguishable from parser facts and configuration overrides in the internal model.
# Conflict approval and quick resolutions

Primary clinicians and configured durations remain unchanged when a conflict is found. Backup assignments, shorter appointments, and shifted appointments are proposals requiring an explicit user choice; no proposal is silently applied. Ordinary non-conflicting primary appointments may be populated from approved defaults. Conflict cards prioritize one-click backup / keep-full-duration, shorten-to-15 / keep-primary (when applicable), and nearest safe full-duration / keep-primary actions. Other available slots and custom durations remain available, with **Edit manually** at the bottom. Every accepted option is revalidated against the current schedule. If no safe option exists, keep the conflict visible rather than manufacture a resolution.

Dense graphics use the TABLE full-width / PERFORMANCE and COURT side-by-side arrangement observed in newer Slides 28 and 55. Adaptive 16:9 canvases and proportional high-resolution export preserve content and the minimum typography, rather than asking staff to remove operational groups to fit.
# Independent individual treatment and October 4 approvals

Each athlete has a separate occupied treatment interval. A longer displayed group TABLE window never grants its shorter-duration partner a longer appointment. Populate ordinary per-player intervals even when another player needs a conflict review; retain the primary clinician and expose overlaps as errors. Red asterisks identify personal ranges differing from the group window in every template. Duration edits preserve that player's treatment end, recalculate their start immediately, and never lengthen another player's treatment. An empty duration remains empty/unresolved while editing and blocks export. Manual individual start/end edits are preserved.

For the approved October 4 Hawaii schedule only: Brandon Ingram and Gradey Dick each get 15 minutes (10:10–10:25 AM), Yuki gets Colby, and Blake gets Lorin. Brandon's season default remains 30 minutes. The approved game header is PRESEASON GAME 1. These explicit daily approvals apply when loading the saved game or pasting its matching text; do not infer them for other days.
# Meeting fallback approved after operational review

When today's text omits a meeting, schedule it at the latest resolved COURT end across shooting groups. Clock = tip minus that end: 35 minutes before tip means meeting at 35; 40 means meeting at 40. Track edits to final shooting end and tip. Explicit meeting details and manual edits/disable actions override this rule. Do not use the inferred meeting to resolve an unknown court end; unknown ends/tip keep meeting timing unresolved. This supersedes earlier "no supplied meeting, do not create one" notes. October 4 Hawaii: 12:25 PM meeting, 35 on the clock, 1:00 PM tip.
