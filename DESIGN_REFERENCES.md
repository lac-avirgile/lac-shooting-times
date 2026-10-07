# October 3 reference-based designs

The selector retains Original and adds user-requested references 1, 2 and 4. Rejected earlier alternatives are no longer selectable.

- 1 · Clean: wide navy-to-red masthead, supplied Clippers watermark and dot texture, two stacked-row columns, numbered navy headers, icons and operational event cards.
- 2 · Sidebar: full-height Clippers identity strip, red arena photography, white schedule canvas, stacked phase rows and events integrated into the schedule flow.
- 4 · Arena: navy arena texture, angular red headline, chamfered outline panels, horizontal TABLE / PERFORMANCE / COURT sections, white icons and red event cards. This is the default.

Schedule text, dates, canonical player names, clinicians, clock labels and clean logos come exclusively from the editable schedule/configuration, not from the generated reference examples. Unknown values remain visibly unresolved and block export through the existing validator.

## Static artwork

`public/assets/reference-art-2.png` and `reference-art-4.png` are untouched copies of the supplied reference PNGs. Nested SVG viewBox crops reuse only photographic excerpts: reference 2's lower-left court photo and reference 4's bottom-left arena exterior. These crops exclude the reference schedule's text and clinician assignments. They are not full-image template backgrounds. Original files remain intact. Photographs are limited to their supplied raster resolution; text, panel shapes, icons and layout remain deterministic vector/browser typography.

## Typography and export

Open-source Bebas Neue and Roboto Condensed are served locally through @fontsource; their licenses are included in their installed packages. Original keeps the local Trade Gothic fallback stack. No protected font was extracted from PowerPoint.

All designs begin at 1920 × 1080 and grow their 16:9 canvas when needed to retain readable type and padding. Exports start at 4000 × 2250 or 8000 × 4500 and scale proportionally with the canvas, with lossless PNG encoding and 300-DPI metadata. Font loading precedes measurement and export. Canvas text export applies each SVG text element's transform relative to the root, preserving nested game-header positions and font choices. Browser QA checks actual exported text coordinates against the live SVG.

Layout measures wrapped names, annotations and individual treatments before choosing a two-column split. Every design puts the meeting directly after the last right-column group with the standard 24-unit gap. All designs insert walkthroughs chronologically in the left column. Capacity includes event cards before choosing the canvas size. Excessive groups, long metadata, extra walkthrough blocks or lengthy notes raise overflow errors instead of truncation if no supported canvas can fit them.

The latest polish pass aligns reference mastheads and logo tiles to one vertical center, uses equal insets and gutters for Arena phase columns, and aligns times to a common tab stop in Clean/Sidebar rows. Original uses 26-unit treatment/body text with 34-unit multiline leading and 28-unit player names. Its navy headers, subtle red glow and visible script watermark retain the original visual identity. The watermark filter clips its result to the source alpha to prevent rectangular artifacts. No slogans are added to the footers.

## Image and spacing refinement

NBA opponents use local SVG logos from the official NBA asset CDN (`https://cdn.nba.com/logos/nba/<team-id>/global/L/logo.svg`); see `scripts/fetch-vector-logos.ps1` for IDs and source URLs. Source PNGs remain intact. The non-NBA Loong Lions reference still uses its PNG. The approved high-resolution Clippers mark is preserved.

Logos retain transparency inside restrained circular backing surfaces, not opaque white square tiles. Approved phase icons are cropped to their artwork bounds, contained without distortion, and aligned inside consistent badges. The JPEG watermark uses a luminance-to-alpha filter so its white background is transparent. Photographs use native SVG gradient masks with explicit viewport coordinates, fading into navy instead of ending at a hard rectangle. Artwork is embedded unchanged for export; effects remain deterministic SVG.

The studio UI has four adjacent template choices on wide screens, more comfortable form padding, improved review labels, responsive controls, and a framed preview. Image decoding/crop-viewport checks and narrow-screen overflow checks are included in browser QA alongside schedule/text/export checks.
