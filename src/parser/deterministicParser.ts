import { findAthlete, normalize } from '../config/roster';
import { findOpponent } from '../config/opponents';
import type { ParsedAthlete, ParsedDraft, ParsedGroup, TimeToken } from '../domain/models';
import { parseTimeToken } from '../domain/time';
import type { ScheduleParser } from './parser';

const timePattern = '(?:\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?)';
const prefixPattern = new RegExp(`^(${timePattern})(?:\\s*[-–—]\\s*(${timePattern}))?(?=\\s|[-–—]|\\(|$)\\s*`, 'i');

export function parseSchedule(input: string): ParsedDraft {
  const draft: ParsedDraft = {
    raw: input, opponentId: null, opponentText: '', homeAway: null, tip: null,
    draft: false, groups: [], walkthroughs: [], meetingClock: null, diagnostics: [],
  };
  let continuation: ParsedGroup | null = null;
  function opponent(text: string, state: string, line: number): void {
    const name = text.trim().replace(/[.!*]+$/, '').trim();
    const entry = findOpponent(name);
    const homeAway = state.toLowerCase() === 'vs' ? 'home' : 'away';
    if (draft.homeAway && draft.homeAway !== homeAway) draft.diagnostics.push({ code: 'conflicting-home-away', severity: 'error', message: `Header and tip disagree on home/away (line ${line}).` });
    if (draft.opponentId && entry && draft.opponentId !== entry.id) draft.diagnostics.push({ code: 'conflicting-opponent', severity: 'error', message: `Header and tip disagree on opponent (line ${line}).` });
    draft.homeAway ??= homeAway;
    if (!draft.opponentText || !draft.opponentId) {
      draft.opponentText = name;
      draft.opponentId = entry?.id ?? null;
    }
    if (!entry) draft.diagnostics.push({ code: 'unknown-opponent', severity: 'error', message: `Unknown opponent "${name}" (line ${line}). Select an opponent or edit game metadata.`, target: 'game' });
  }
  function athletes(text: string, line: number, groupId: string): ParsedAthlete[] {
    return text.split(/\s*\+\s*|\s*,\s*(?:and\s+)?|\s+and\s+/i).map(value => value.trim()).filter(Boolean).map(value => {
      const match = value.match(/^(.+?)(?:\s*\(([^()]*)\))?$/);
      const name = match?.[1]?.trim() ?? value;
      const found = findAthlete(name);
      if (!found) draft.diagnostics.push({ code: 'unknown-player', severity: 'error', message: `Unknown player "${name}" (line ${line}).`, groupId });
      return { id: found?.id ?? `unknown:${normalize(name)}`, name: found?.name ?? name, workoutStaff: match?.[2]?.trim() ?? '', sourceLine: line };
    });
  }
  input.split(/\r?\n/).forEach((original, index) => {
    const lineNumber = index + 1;
    const line = original.replace(/[*•]/g, '').trim();
    if (!line || /^[—–-]+$/.test(line)) return;
    if (/^shooting\s+times/i.test(line)) {
      draft.draft ||= /\bdraft\b/i.test(line);
      const match = line.match(/\b(vs\.?|at)\s+(.+)$/i);
      if (match) opponent(match[2], match[1].replace('.', ''), lineNumber);
      else draft.diagnostics.push({ code: 'unparsed-header', severity: 'warning', message: `Home/away or opponent missing in header (line ${lineNumber}).` });
      return;
    }
    if (/\btip\b/i.test(line) || /^game\s+\d/i.test(line)) {
      const match = line.match(new RegExp(`^(?:game\\s+)?(${timePattern})(?:\\s*tip)?(?:\\s+(vs\\.?|at)\\s+(.+))?$`, 'i'));
      if (match) {
        const token = parseTimeToken(match[1]);
        if (draft.tip && token && draft.tip.raw !== token.raw) draft.diagnostics.push({ code: 'conflicting-tip', severity: 'error', message: 'Multiple different tip times were supplied.' });
        draft.tip ??= token;
        if (match[2] && match[3]) opponent(match[3], match[2].replace('.', ''), lineNumber);
      } else draft.diagnostics.push({ code: 'unparsed-tip', severity: 'error', message: `Cannot parse tip line ${lineNumber}: ${line}` });
      continuation = null;
      return;
    }
    if (/\bmeeting\b/i.test(line)) {
      const match = line.match(/meeting\s+(?:at\s+)?(\d{1,3})(?::00)?\s+(?:on\s+(?:the\s+)?)?clock/i);
      if (match) {
        const clock = Number(match[1]);
        if (draft.meetingClock !== null && draft.meetingClock !== clock) draft.diagnostics.push({ code: 'conflicting-meeting', severity: 'error', message: 'Multiple different meeting clock values were supplied.' });
        draft.meetingClock ??= clock;
      } else draft.diagnostics.push({ code: 'unparsed-meeting', severity: 'warning', message: `Cannot parse meeting line ${lineNumber}: ${line}` });
      continuation = null;
      return;
    }
    const prefix = line.match(prefixPattern);
    const start: TimeToken | null = prefix ? parseTimeToken(prefix[1]) : null;
    const end: TimeToken | null = prefix?.[2] ? parseTimeToken(prefix[2]) : null;
    let body = prefix ? line.slice(prefix[0].length).trim().replace(/^[-–—]\s*/, '') : line;
    if (prefix && (!start || (prefix[2] && !end))) draft.diagnostics.push({ code: 'invalid-time', severity: 'error', message: `Invalid time on line ${lineNumber}.` });
    const clockMatch = body.match(/\(?\s*(\d{1,3})(?::00)?\s+on\s+(?:the\s+)?(?:game\s+)?clock\s*\)?/i);
    const clock = clockMatch ? Number(clockMatch[1]) : null;
    if (clockMatch) body = body.replace(clockMatch[0], '').trim().replace(/^[-–—]\s*/, '');
    const post = /\bpost[ -]*(?:walkthru|walkthrough)\b/i.test(body);
    const pre = /\bpre[ -]*(?:walkthru|walkthrough)\b/i.test(body);
    if (/\b(?:walkthru|walkthrough)\b/i.test(body) && !post && !pre) {
      draft.walkthroughs.push({ id: `walkthrough-${lineNumber}`, start, end, sourceLine: lineNumber });
      continuation = null;
      return;
    }
    const pd = /\bPD\s+Group\b/i.test(body);
    const stay = /\bStay\s+Ready(?:\s+Game)?\b/i.test(body);
    const practice = /\bPractice\s+Court\b/i.test(body);
    if (start || clock !== null || pd || stay || post || pre) {
      const group: ParsedGroup = {
        id: `group-${lineNumber}`, athletes: [], start, end, clock,
        kind: pd || post ? 'pd' : stay ? 'stay-ready' : 'normal',
        location: practice ? 'practice' : 'main', walkthroughState: post ? 'post' : pre ? 'pre' : 'none',
        notes: [], sourceLine: lineNumber,
      };
      const names = body.replace(/\b(?:PD\s+Group|Stay\s+Ready(?:\s+Game)?)\s*:?/gi, '')
        .replace(/\bPractice\s+Court\b/gi, '')
        .replace(/\b(?:post|pre)[ -]*(?:walkthru|walkthrough)\b/gi, '')
        .replace(/^[\s:,-]+|[\s:,-]+$/g, '');
      if (names) group.athletes = athletes(names, lineNumber, group.id);
      draft.groups.push(group);
      continuation = group.athletes.length ? null : group;
      return;
    }
    if (continuation) {
      continuation.athletes.push(...athletes(body, lineNumber, continuation.id));
      continuation = null;
      return;
    }
    draft.diagnostics.push({ code: 'unparsed-text', severity: 'warning', message: `Unparsed line ${lineNumber}: ${original.trim()}` });
  });
  if (!input.trim()) draft.diagnostics.push({ code: 'empty-input', severity: 'error', message: 'Paste a shooting-times message to begin.' });
  return draft;
}
export const deterministicParser: ScheduleParser = { parse: parseSchedule };
