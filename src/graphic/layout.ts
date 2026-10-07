import { brand } from '../config/brand';
import { roster } from '../config/roster';
import { formatTime } from '../domain/time';
import type { Diagnostic, Group, Range, Schedule } from '../domain/models';
import {graphicSpacing as space} from '../config/graphicSpacing';
import {originalDesign as original} from '../config/originalDesign';

export interface TextPart { text: string; color?: string; bold?: boolean }
export interface RowPlan { phase: 'table' | 'performance' | 'court'; lines: TextPart[][]; height: number; xOffset:number }
export interface GroupPlan { type: 'group'; group: Group; number: number; x: number; y: number; height: number; header: string[]; rows: RowPlan[]; compact: boolean }
export interface WalkPlan { type: 'walkthrough'; id: string; label: string; time: string; x: number; y: number; height: number; compact: boolean }
export interface Layout { blocks: (GroupPlan | WalkPlan)[]; diagnostics: Diagnostic[]; bodySize: number; width:number; height:number; columnWidth:number }
let context: CanvasRenderingContext2D | null = null;
function textWidth(text: string, font: string, size: number, bold = false): number {
  if (typeof document !== 'undefined') {
    context ??= document.createElement('canvas').getContext('2d');
    if (context) { context.font = `${bold ? '700' : '400'} ${size}px ${font}`; return context.measureText(text).width; }
  }
  return text.length * size * (font.includes('Bebas Neue')?0.36:font.includes('Roboto Condensed')?(bold?0.48:0.43):(bold?0.56:0.51));
}
export function wrapParts(parts: TextPart[], width: number, size: number, font = brand.bodyFont): TextPart[][] {
  const lines: TextPart[][] = [[]];
  let used = 0;
  parts.forEach(part => {
    const words = part.text.match(/\S+\s*|\s+/g) ?? [];
    words.forEach(word => {
      let value = word;
      const measure = textWidth(value, font, size, part.bold);
      if (used + measure > width && lines[lines.length - 1].length) {
        lines.push([]); used = 0; value = value.trimStart();
      }
      const line = lines[lines.length - 1];
      const previous = line[line.length - 1];
      if (previous && previous.bold === part.bold && previous.color === part.color) previous.text += value;
      else line.push({ ...part, text: value });
      used += textWidth(value, font, size, part.bold);
    });
  });
  return lines;
}
function rangeParts(range: Range): TextPart[] {
  if (range.start.value === null || range.end.value === null) return [{ text: `${range.start.value === null ? 'START NEEDED' : formatTime(range.start.value)} – ${range.end.value === null ? 'END NEEDED' : formatTime(range.end.value)}`, color: brand.red, bold: true }];
  return [{ text: `${formatTime(range.start.value)} – ${formatTime(range.end.value)}` }];
}
function groupPlan(group: Group, number: number, bodySize: number, compact=false,columnWidth=brand.columnWidth): GroupPlan {
  const kind = group.kind === 'pd' ? 'PD GROUP: ' : group.kind === 'stay-ready' ? 'STAY READY GAME: ' : '';
  const header = `#${number} ${kind}${group.athletes.map(a => a.name.toUpperCase()).join(' + ')}${group.clock.value !== null ? ` (${group.clock.value}:00 ON THE CLOCK)` : ''}`;
  const headerLines = wrapParts([{ text: header, bold: true }], columnWidth - 56, original.nameSize, brand.headerFont).map(line => line.map(p => p.text).join(''));
  const rows: RowPlan[] = [];
  for (const phase of ['table', 'performance', 'court'] as const) {
    const range = group[phase];
    if (!range.applicable) continue;
    const parts: TextPart[] = [{ text: `${phase.toUpperCase()}: `, bold: true }, ...rangeParts(range)];
    if (phase === 'table') {
      parts.push({ text: ' (' });
      group.athletes.forEach((athlete, index) => {
        const short = roster.find(r => r.id === athlete.id)?.short ?? athlete.name;
        if (index) parts.push({ text: ' | ' });
        parts.push({ text: `${short} w/${athlete.clinician.value ?? 'CLINICIAN NEEDED'}`, color: athlete.clinician.value === null ? brand.red : undefined });
        if (athlete.treatment.applicable && (athlete.treatment.start.value !== group.table.start.value || athlete.treatment.end.value !== group.table.end.value)) parts.push({ text: ` *${formatTime(athlete.treatment.start.value)}–${formatTime(athlete.treatment.end.value)}`, color: brand.red, bold: true });
        if (athlete.treatmentNote) parts.push({ text: ` *${athlete.treatmentNote}`, color: brand.red, bold: true });
      });
      parts.push({ text: ')' });
    }
    if (phase === 'court' && group.location === 'practice') parts.push({ text: ' (PRACTICE COURT)', bold: true });
    else if (phase === 'court' && group.location !== 'main') parts.push({ text: ` (${group.location.toUpperCase()})`, bold: true });
    if (phase === 'court' && group.notes) parts.push({ text: ` *${group.notes}`, color: brand.red, bold: true });
    const parallel=compact&&group.performance.applicable&&phase!=='table';
    const lines = wrapParts(parts, (parallel?columnWidth/2:columnWidth) - 94, bodySize, original.bodyFont);
    rows.push({ phase, lines, height: Math.max(space.rowHeight, lines.length * original.rowLeading + space.rowPadding),xOffset:parallel&&phase==='court'?columnWidth/2:0 });
  }
  const rowHeight=compact&&group.performance.applicable?rows.filter(row=>row.phase==='table').reduce((n,row)=>n+row.height,0)+Math.max(...rows.filter(row=>row.phase!=='table').map(row=>row.height)):rows.reduce((n,row)=>n+row.height,0);
  return { type: 'group', group, number, x: 0, y: 0, header: headerLines, rows, compact, height: Math.max(original.headerHeight, headerLines.length * original.headerLeading + 24) + rowHeight + 12 };
}
export function buildLayout(schedule: Schedule,canvasWidth=1920): Layout {
  const canvasHeight=canvasWidth*9/16;
  const dimensions={columnWidth:(canvasWidth-space.margin*2-space.gutter)/2,rightX:canvasWidth/2+space.gutter/2,contentTop:176,contentBottom:canvasHeight-84};
  const blocks = schedule.groups.map((g, i) => groupPlan(g, i + 1, original.bodySize, schedule.groups.length>=10,dimensions.columnWidth));
  const rightLimit = schedule.meeting.enabled ? dimensions.contentBottom-space.eventHeight-space.groupGap : dimensions.contentBottom;
  const walks = schedule.walkthroughs.map(w => ({
    type: 'walkthrough' as const, id: w.id, label: w.label, time: `${formatTime(w.range.start.value)} – ${formatTime(w.range.end.value)}`,
    x: space.margin, y: 0, height: space.eventHeight, compact: true,
  }));
  const firstClock = schedule.groups.findIndex(g => g.clock.value !== null);
  const preferredSplit = firstClock > 0 ? firstClock : Math.max(1, Math.floor(schedule.groups.length / 2));
  let selected: { left: (GroupPlan | WalkPlan)[]; right: GroupPlan[]; excess: number; balance:number } | null = null;
  const splits = [...new Set([preferredSplit, ...Array.from({ length: Math.max(1, blocks.length) }, (_, i) => i + 1)])];
  for (const split of splits) {
    const left: (GroupPlan | WalkPlan)[] = blocks.slice(0, split);
    const right = blocks.slice(split);
    walks.forEach((walk, i) => {
      const time = schedule.walkthroughs[i].range.start.value;
      const position = left.findIndex(block => block.type === 'group' && block.group.court.start.value !== null && time !== null && block.group.court.start.value >= time);
      left.splice(position < 0 ? left.length : position, 0, walk);
    });
    const lh = left.reduce((n, b) => n + b.height, 0)+Math.max(0,left.length-1)*space.groupGap;
    const rh = right.reduce((n, b) => n + b.height, 0)+Math.max(0,right.length-1)*space.groupGap;
    const excess = Math.max(0, lh - (dimensions.contentBottom - dimensions.contentTop)) + Math.max(0, rh - (rightLimit - dimensions.contentTop));
    const balance=Math.abs(lh-rh-(schedule.meeting.enabled?space.eventHeight+space.groupGap:0));
    if (!selected || excess < selected.excess || (excess===selected.excess&&balance<selected.balance)) selected = { left, right, excess,balance };
  }
  if (!selected) selected = { left: walks, right: [], excess: 0,balance:0 };
  const place = (column: (GroupPlan | WalkPlan)[], x: number): void => {
    const gap=space.groupGap;
    let y = dimensions.contentTop;
    column.forEach(block => { block.x = x; block.y = y; y += block.height + gap; });
  };
  place(selected.left, space.margin);
  place(selected.right, dimensions.rightX);
  const diagnostics: Diagnostic[] = [];
  if (selected.excess > 0) diagnostics.push({ code: 'visual-overflow', severity: 'error', message: `This schedule exceeds this template's readable capacity by ${Math.ceil(selected.excess)} pixels. Try Clean, Sidebar or Arena; do not remove operational information to fit a graphic.` });
  const all = [...selected.left, ...selected.right];
  for (const block of all) if (block.type === 'group') {
    if (block.header.length > 3) diagnostics.push({ code: 'header-overflow', severity: 'error', groupId: block.group.id, message: `Group ${block.number}: header needs more than three lines.` });
    if (block.header.some(line => textWidth(line, brand.headerFont, original.nameSize, true) > dimensions.columnWidth - 56 + 1)) diagnostics.push({ code: 'header-overflow', severity: 'error', groupId: block.group.id, message: `Group ${block.number}: header text is too long to fit.` });
    for (const row of block.rows) for (const line of row.lines) if (line.reduce((n, p) => n + textWidth(p.text, original.bodyFont, original.bodySize, p.bold), 0) > (block.compact&&block.group.performance.applicable&&row.phase!=='table'?dimensions.columnWidth/2:dimensions.columnWidth) - 94 + 1) diagnostics.push({ code: 'text-overflow', severity: 'error', groupId: block.group.id, message: `Group ${block.number}: a word or annotation is too long to fit.` });
  }
  for (const block of all) if (block.type === 'walkthrough') {
    const labelWidth = textWidth(block.label, brand.bodyFont, block.compact ? 30 : 44, true);
    const timeWidth = textWidth(block.time, brand.bodyFont, block.compact ? 30 : 44, true);
    if (labelWidth > (block.compact ? 395 : 650) || timeWidth > (block.compact ? 390 : 650)) diagnostics.push({ code: 'walkthrough-text-overflow', severity: 'error', message: 'Walkthrough label/time is too long for its card. Shorten the label.' });
  }
  const formattedDate = new Date(`${schedule.game.date}T12:00:00`).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'}).toUpperCase();
  const gameLine = `${formattedDate} ${schedule.game.homeAway.value === 'away' ? 'AT' : 'VS.'} ${(schedule.game.opponent.value ?? '').toUpperCase()}`;
  if (textWidth(gameLine, brand.titleFont, gameLine.length > 57 ? 20 : 23, true) > 660) diagnostics.push({ code: 'game-metadata-overflow', severity: 'error', target: 'game', message: 'Date/opponent line is too long for the game header. Shorten the opponent display name.' });
  if (textWidth(schedule.game.number ? `GAME ${schedule.game.number}` : 'PREGAME', brand.titleFont, 24, true) > 660) diagnostics.push({ code: 'game-number-overflow', severity: 'error', target: 'game', message: 'Game number text is too long for the header.' });
  const venueText = `${formatTime(schedule.game.tip.value)} - @ ${schedule.game.venue.value ?? 'VENUE NEEDED'} (${schedule.game.city.value ?? 'CITY NEEDED'})`;
  if (wrapParts([{text:venueText}],660,original.metadataSize,original.bodyFont).length>2) diagnostics.push({ code: 'game-metadata-overflow', severity: 'error', target: 'game', message: 'Venue/city needs more than two lines in this template. Select another design.' });
  return { blocks: all, diagnostics, bodySize: original.bodySize,width:canvasWidth,height:canvasHeight,columnWidth:dimensions.columnWidth };
}

export function adaptiveOriginalLayout(schedule:Schedule):Layout {
  let width=1920,layout:Layout;
  do{layout=buildLayout(schedule,width);if(!layout.diagnostics.some(issue=>issue.severity==='error'))return layout;width+=320;}while(width<=16384);
  return layout;
}
