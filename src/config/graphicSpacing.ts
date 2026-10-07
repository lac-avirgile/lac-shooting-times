/** Native SVG units; preferred PNG scaling preserves 10–12pt operational type at 300 DPI. */
export const graphicSpacing = {
  margin:48, gutter:48, groupGap:24,
  inset:24, headerHeight:56, headerLeading:32,
  bodySize:24, nameSize:26, labelSize:24,
  rowLeading:30, rowPadding:20, rowHeight:50,
  noteLeading:28, notePadding:16,
  iconSize:30, iconGap:16,
  eventHeight:104,
} as const;
/** Alphabetic baseline positioned by cap height (Roboto/Bebas ~0.72em), not em-box midpoint. */
export const opticalBaseline=(center:number,size:number):number=>center+size*0.36;
