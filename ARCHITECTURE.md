# Proposed Application Architecture

Approved architecture, implemented 2026-10-03. The proposed boundaries below remain the design guide; actual files are documented in README.md. PNG export uses SVG shapes/assets plus canvas text runs to ensure installed and bundled fonts survive Chromium rasterization.

## Technical choice

Use React, strict TypeScript, and Vite as requested. Render the export graphic as pure SVG inside React, then serialize that SVG to a canvas for PNG download. SVG gives a deterministic coordinate system, crisp text/icons, explicit overflow measurement, and an export path that does not capture the surrounding editor UI.

No backend, database, authentication, PowerPoint automation, or LLM dependency is needed for the MVP.

## Data flow

```text
raw message
  -> deterministic parser
  -> explicit facts + parser diagnostics
  -> name/opponent normalization
  -> scheduling engine
  -> resolved fields with provenance + rule diagnostics
  -> validation
  -> editable schedule view-model
  -> layout measurement
  -> fixed-viewBox SVG
  -> PNG export
```

Parsing and scheduling must remain separate. Re-running schedule rules must not erase explicit facts or manual edits.

## Suggested source layout

```text
src/
  app/
    App.tsx
    routes-or-workspace components
  config/
    roster.ts
    clinicians.ts
    opponents.ts
    venues.ts
    scheduleRules.ts
    brand.ts
    index.ts
  domain/
    models.ts
    provenance.ts
    diagnostics.ts
    time.ts
  parser/
    parser.ts
    deterministicParser.ts
    lineClassifiers.ts
    normalizers.ts
    parserFixtures.ts
  scheduler/
    scheduleEngine.ts
    ruleRegistry.ts
    rules/
      phaseDefaults.ts
      clockCadence.ts
      walkthrough.ts
      playerOverrides.ts
  validation/
    validateParsedDraft.ts
    validateSchedule.ts
    validateLayout.ts
  editor/
    ScheduleEditor.tsx
    GroupEditor.tsx
    EventEditor.tsx
    DiagnosticsPanel.tsx
  graphic/
    PregameGraphic.tsx
    layout/
      measure.ts
      allocateColumns.ts
      overflow.ts
    components/
      GraphicHeader.tsx
      GroupBlock.tsx
      WalkthroughCard.tsx
      MeetingCard.tsx
    exportPng.ts
  assets/
    logos/
    icons/
    fonts/
    watermark/
tests/
  fixtures/
  parser/
  scheduler/
  validation/
  graphic/
```

Exact folders can be adjusted during scaffolding, but config, parser, scheduler, validation, editor, renderer, and export must remain separable.

## Core domain model

Use branded IDs and discriminated unions; do not represent operational state as free-form component strings.

```ts
type ProvenanceKind = 'explicit' | 'inferred' | 'override' | 'unresolved';

interface Provenance {
  kind: ProvenanceKind;
  sourceLine?: number;
  sourceText?: string;
  ruleId?: string;
  configKey?: string;
  editedByUser?: boolean;
}

interface Field<T> {
  value: T | null;
  provenance: Provenance;
}

interface TimeRange {
  startMinute: number;
  endMinute: number;
}

interface AthleteAssignment {
  athleteId: string;
  workoutStaff?: Field<string>;
  clinicianId: Field<string>;
  treatmentOverride?: Field<TimeRange | string>;
}

interface ScheduleGroup {
  id: string;
  order: number;
  label?: Field<string>;
  athletes: AthleteAssignment[];
  table: Field<TimeRange>;
  performance: Field<TimeRange>;
  court: Field<TimeRange>;
  courtLocation: Field<'main' | 'practice' | string>;
  clockLabel: Field<number>;
  walkthroughState: Field<'none' | 'pre' | 'post'>;
  notes: Field<string[]>;
}
```

Missing phases, such as Kawhi's PERFORMANCE, need an explicit `notApplicable` representation rather than overloading `null` as both absent and unresolved.

Times should be stored as minutes on the game service date, resolved against tip time. Formatting to `3PM`, `3:05PM`, and date rollover belongs at the display boundary.

## Parser contract

Define a provider-neutral interface so a later fallback can be added without changing the app:

```ts
interface ScheduleParser {
  parse(input: string, context: ParseContext): ParseResult;
}
```

`ParseResult` should contain:

- source lines and classifications;
- explicit game facts;
- explicit group/player/event facts;
- recognized aliases and normalization confidence;
- unparsed spans;
- structured diagnostics.

The deterministic parser should use ordered line classifiers for title/header, tip, walkthrough, meeting, PD/special group, continuation player list, and timed player group. It should never derive TABLE/PERFORMANCE ranges; that belongs to the schedule engine.

An optional future LLM adapter may propose parsed facts, but those facts must still pass the same normalization and validation and must be marked with their own provenance. The application must work fully without it.

## Scheduling engine

Implement a pure function:

```ts
resolveSchedule(parsed: ParsedDraft, config: SeasonConfig): ScheduleResult
```

Recommended stages:

1. Resolve identity aliases and home/away/opponent.
2. Resolve 12-hour times against tip and chronological constraints.
3. Apply explicit court/event ranges.
4. Resolve clock-relative starts from configured cadence.
5. Derive safe court ends from explicit next starts/meeting boundaries.
6. Place walkthrough-dependent groups.
7. Apply season/player/group phase-duration defaults.
8. Apply configured athlete overrides.
9. Preserve daily explicit treatment overrides.
10. Mark any field without a single approved result unresolved.

Each rule should have a stable ID and operate only when its preconditions are satisfied. Rules return facts plus diagnostics; they do not mutate UI state.

## Configuration

Use a single season configuration object composed from typed modules. It should cover:

- roster IDs, canonical display names, aliases, spelling variants, active state;
- workout-staff aliases (separate namespace from clinicians);
- clinician IDs and athlete partnerships;
- default TABLE/PERFORMANCE/COURT durations;
- player/group-specific overrides;
- clock cadences and meeting defaults;
- opponent canonical names, abbreviations, colloquial aliases;
- home/away/neutral venues and city/state display;
- logo asset keys;
- Clippers logo and watermark;
- brand colors, typography, icon keys, export sizes.

Season rollover should require editing config/data files, not React components.

## Validation

Use a shared diagnostic shape:

```ts
interface Diagnostic {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  sourceLine?: number;
  entityId?: string;
  field?: string;
}
```

Validation layers:

- **Parser validation**: unknown player/opponent, missing tip/home-away, unparsed text, ambiguous AM/PM.
- **Schedule validation**: missing clinician, duplicate player, impossible range, phase order, conflicting explicit facts, clinician overlap, unresolved post-walkthrough timing, suspicious inference, missing required values.
- **Layout validation**: header/row overflow, event-card collision, meeting-card collision, column overflow, missing/undecoded image, unloaded font.

Errors block export. Warnings require visible review but may allow export after explicit acknowledgement if operations approves that policy. Infos explain benign inference.

## Editor state

The editor should expose normal form controls, not JSON:

- game metadata and home/away;
- ordered groups and athletes;
- TABLE/PERFORMANCE/COURT start/end;
- per-athlete clinician and treatment override;
- clock label, notes, court location, pre/post-walkthrough state;
- walkthrough and meeting blocks;
- add/delete/reorder actions.

Show provenance unobtrusively per field and provide a diagnostics panel linked to the affected control. A manual edit changes provenance to override/manual without deleting the original parsed fact, allowing reset/re-derive.

## Graphic layout engine

Build semantic blocks first, measure their required height, then allocate blocks to the left/right flows.

Policies:

- preserve schedule order;
- place walkthrough at its chronological boundary in the left flow;
- reserve the right-column meeting card before allocation;
- select large or compact walkthrough form based on available height;
- wrap group headers to two lines;
- use only approved minimum font sizes;
- emit an error if no valid layout fits.

The SVG renderer consumes a fully resolved layout plan. It should not contain scheduling logic.

## PNG export

1. Await fonts and all logo/icon image decoding.
2. Serialize only the SVG graphic.
3. Rasterize SVG shapes/assets into an offscreen canvas, then draw the same positioned text runs with the browser font engine at 1920 x 1080 or preferred 4000 x 2250. This avoids missing heavy webfont text in SVG-image rasterization.
4. Export with `canvas.toBlob('image/png')`.
5. Sanitize the filename using game date, home/away marker, and opponent display name.

No screenshot of the browser viewport and no PowerPoint process should be involved.

## Test boundaries

- Parser fixture tests assert only explicit facts and parser diagnostics.
- Scheduling tests feed structured facts and assert derived fields/provenance.
- Validation tests assert issue codes/severities.
- Layout tests assert bounding boxes and overflow decisions at fixed fonts/sizes.
- Export smoke test decodes a generated PNG and checks exact dimensions.
- Optional visual-regression tests compare renderer screenshots to approved references with a documented tolerance.
