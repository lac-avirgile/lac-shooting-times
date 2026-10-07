# Visual Specification Audit

## User-directed designs 1, 2 and 4

The earlier alternatives were rejected. The user supplied four new reference images and requested designs 1, 2 and 4. These are now three selectable, independently measured compositions: clean white operations sheet, photographic Clippers sidebar, and dark angular arena poster. See [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) for implementation, typography, photographic crop provenance and export details. Schedule data and clean logos remain authoritative; example text embedded in the new references is never reproduced. The remaining historical specification below describes Original · Operations only.

Audit date: 2026-10-03

The production visual target should be the 2025-26 system represented by Slides 1-98, especially the six matched references (Slides 2, 4, 6, 8, 10, and 11). The 2024-25 slides are valuable for layout stress cases, but not as the primary skin.

## Source and canvas

- PowerPoint slide size: 12,192,000 x 6,858,000 EMU, exactly 16:9.
- Every historical export is 4000 x 2250 PNG.
- Live SVG coordinate system: 1920 x 1080; preferred production PNG: historical 4000 x 2250.
- Background: white with a very low-contrast pale-gray Clippers script watermark spanning the center/lower canvas.
- The graphic is edge-dense but retains roughly 1.5% horizontal outer margins.

## Brand tokens observed

| Token | Reference value | Use |
| --- | --- | --- |
| Clippers red | `#C8102E` | Main title bar, walkthrough/meeting cards, game number, override emphasis |
| Clippers navy | `#12173F` | Group headers, current event-card outline/shadow |
| White | `#FFFFFF` | Header/event text and canvas |
| Black | `#000000` | Body rows, icons, game metadata |
| Light logo tile | approximately `#E1E1E1` | Square backing behind team logos |
| Watermark gray | baked into `image1.jpeg` | Subtle background mark |

The deck also contains older near-duplicates (`#C80F2E`, `#C00000`, `#404040`). The current skin should use `#C8102E` and `#12173F` unless brand guidance says otherwise.

## Typography

The current-season slides explicitly use:

- **Trade Gothic Next Heavy**: primary title and game header emphasis.
- **Trade Gothic Next Bold**: group header text.
- **Roboto**: schedule rows, labels, card text, and secondary game metadata.

Typical PowerPoint sizes on the 13.333 x 7.5-inch slide:

- Main title: 24 pt, uppercase, bold.
- Large walkthrough title/time: 24 pt, uppercase, bold.
- Meeting text: 16 pt, uppercase, bold.
- Group headers: 12 pt, uppercase, bold.
- Game block: 12 pt; game/date line heavy, venue line regular.
- Schedule rows: 10 pt; TABLE/PERFORMANCE/COURT label bold and value regular.

No font binaries are embedded in the PowerPoint. A production renderer needs licensed webfont files or an approved metrically tested substitute. Export must wait for `document.fonts.ready`.

## Primary frame geometry

Measurements below are normalized from the current Warriors reference, Slide 2. They are starting tokens for a reusable layout engine, not immutable coordinates.

| Element | X | Y | Width | Height |
| --- | ---: | ---: | ---: | ---: |
| Red title banner | 1.5% | 2.4% | 45.5% | 6.7% |
| Title shadow | about +0.5% | about +1.8% | 45.5% | 5.9% |
| Game metadata block | 52.1% | 0.6% | 35.0% | 9.4% |
| Opponent logo tile | 88.1% | 2.5% | 4.7% | 7.6% |
| Clippers logo tile | 93.8% | 2.5% | 4.7% | 7.6% |
| Left content column | 1.5-1.7% | 11.2% | about 46.5% | flow |
| Right content column | 52.0-52.5% | 11.2% | about 46.5% | flow |
| Column gutter | about 4.0% | — | — | — |
| Standard group header | column edge | flow | about 46.5% | 4.7% |
| Meeting card | about 52.3% | bottom-pinned | about 46.4% | 6.5% |

## Header region

- The red title bar occupies most of the upper-left half and has a hard-edged gray drop shadow down/right.
- `PREGAME WORKOUT TIMES` is centered vertically and horizontally, uppercase white.
- The upper-right game block has three lines:
  1. red game/season label;
  2. black heavy date + `VS.`/`AT` + full opponent;
  3. black regular tip + arena + city/state.
- Opponent logo appears first and Clippers logo second, each centered in its own light-gray square tile.
- Current slides use uppercase franchise names; older slides use mixed case. Use uppercase for the current skin.

## Group block anatomy

1. Navy rectangular header, square corners, white uppercase name(s), prefixed with `#N`.
2. Optional clock label remains in the header on the same line when it fits.
3. Header grows to two lines for PD/Stay Ready/large groups; it must not reduce below the minimum readable font size merely to stay on one line.
4. Body rows are white/transparent over the watermark:
   - medical-cross icon + `TABLE:`;
   - dumbbell icon + `PERFORMANCE:`;
   - basketball icon + `COURT:`.
5. Icons are black, left-aligned in a fixed icon gutter. Labels align to a common text start.
6. TABLE clinician details follow the time in parentheses. Multiple assignments use a vertical bar in current slides; older slides sometimes use semicolons.
7. Athlete-specific exceptions are red and bold, often prefixed by `*`.
8. A normal three-row block consumes approximately 20% of canvas height including its header and inter-block gap. Blocks with missing PERFORMANCE use only the rows present.

## Walkthrough card

Current references have two responsive variants:

- **Large card**: approximately 46.5% wide x 18.4% high, red fill, navy outline/shadow, large Clippers logo on the left, underlined title and time stacked on the right. Used when the left column has vertical room (Slide 2).
- **Compact card**: approximately 46.5% wide x 7-8% high, red fill, navy outline/shadow, small Clippers logo, underlined title and time inline. Used in denser schedules (Slides 4, 8, and 11).

The card belongs in the schedule flow at the chronological boundary. The layout engine chooses large or compact based on measured fit; users should not have to position it manually.

## Meeting card

- Pinned to the bottom of the right column after the final group.
- Red fill with navy border/shadow in the current skin.
- White playbook icon, underlined `TEAM MEETING`, then the clock value inline.
- Standard current value is `35:00 ON THE CLOCK`; historical references also show `40:00`.
- Overflow above the meeting card is an error; the card must never be covered or pushed outside the canvas.

## Watermark and layering

- The pale Clippers script is centered across both columns, mostly below the top third.
- It is intentionally visible through row whitespace but must not reduce text contrast.
- All text and icons render above the watermark.
- Use the supplied watermark only after asset approval; preserve its low contrast rather than applying browser opacity that can vary with compositing.

## Responsive layout behaviors observed

- One-, two-, and three-plus-player headers.
- Two-line special group headers.
- Groups with two rows (Kawhi) and three rows (standard).
- 10-, 15-, 20-, 25-, 30-, 40-, 45-, and 60-minute court ranges.
- Walkthrough inserted in the left column.
- Large and compact walkthrough cards.
- Red inline exception text without moving the surrounding row off baseline.
- Practice-court notes appended in bold/current examples or sentence case/older examples.
- Older dense graphics sometimes put PERFORMANCE and COURT side by side. This is a fallback stress pattern, not the preferred current layout.

## Layout policy for the web renderer

1. Render from a fixed 16:9 coordinate system, preferably an SVG `viewBox` of 1920 x 1080.
2. Measure blocks, then allocate them to two column flows. Do not manually encode a slide-specific coordinate map.
3. Preserve current vertical row spacing and hierarchy first.
4. Use compact walkthrough form before reducing body type.
5. Allow group headers to wrap and increase height.
6. Define minimum body/header font sizes. If the measured schedule still does not fit, return a visual-overflow error and require editing; do not silently shrink to illegibility.
7. Keep the meeting card bottom-right and reserve its height before laying out right-column groups.
8. Export the graphic alone after fonts/assets decode, with no editor chrome. SVG shapes/assets are rasterized and the same positioned text runs are drawn with canvas to preserve browser fonts.

## Asset inventory inside the PowerPoint

The PowerPoint contains 86 embedded media files:

- 77 PNGs: Clippers logo, NBA opponent logos (with duplicates/era variants), Loong Lions logo, and related team/tournament graphics.
- 3 JPEGs: the pale Clippers script watermark and in-season tournament graphics.
- 6 SVGs:
  - playbook/meeting icon (`image2.svg`);
  - basketball icon (`image3.svg`);
  - medical/table icon (`image4.svg`);
  - dumbbell icon (`image5.svg`, current performance icon);
  - body-builder icon (`image55.svg`, older performance icon);
  - whistle icon (`image58.svg`, referee blocks).

`image6.png` is the current Clippers round logo. `image1.jpeg` is the pale script watermark. The exact opponent image mapping should be extracted into a documented asset manifest during implementation rather than inferred from filenames.
# Approved spacing refinement (October 3, 2026)

Use the shared `graphicSpacing` configuration rather than independent ad hoc gaps: 48-unit outer margins / column gutter, 24-unit card inset / group gaps, 56-unit minimum player headers, 30-unit body leading, and 50-unit minimum phase rows. Operational timing text is 24 units; secondary information remains at least 20. Player names and number tabs are optically centered using their cap height, with multiline headers centered as a block. Icons are vertically centered within phase rows. Side-by-side phases share the same row height and baseline. Metadata, rules, event blocks, and footer have separate clear space; no decorative rule crosses venue text. Do not stretch rows to occupy blank areas. Balance column heights and grow the native 16:9 canvas when needed; scale PNG dimensions proportionally so extra breathing room never reduces print legibility. Original retains its own design on an adaptive canvas.
