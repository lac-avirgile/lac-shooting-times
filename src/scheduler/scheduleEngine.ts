import { opponents, homeVenue } from '../config/opponents';
import { roster, defaultTreatmentMinutes } from '../config/roster';
import { partnership } from '../config/clinicians';
import { rules } from '../config/rules';
import { candidates, today } from '../domain/time';
import { emptyRange, field, unresolved } from '../domain/models';
import type { Field, ParsedDraft, Schedule, TimeToken, Range } from '../domain/models';
import {syncMeeting} from './meetingRule';

function time(token: TimeToken | null, tip: number | null, source: string): Field<number> {
  if (!token) return unresolved(source);
  if (token.meridiem) return field(candidates(token)[0], 'explicit', source);
  if (tip === null) return unresolved(`AM/PM needs tip context: ${source}`);
  const options = candidates(token).filter(value => value <= tip && tip - value <= rules.maxPreparationLeadMinutes);
  return options.length === 1 ? field(options[0], 'explicit', `${source}; AM/PM resolved against tip`) : unresolved(`Ambiguous AM/PM: ${source}`);
}
function inferredRange(start: number, end: number, rule: string, origin: 'inferred' | 'override' = 'inferred'): Range {
  return { start: field(start, origin, rule), end: field(end, origin, rule), applicable: true };
}
function overlaps(a: Range, b: Range): boolean {
  return a.start.value !== null && a.end.value !== null && b.start.value !== null && b.end.value !== null
    && a.start.value < b.end.value && b.start.value < a.end.value;
}
export function resolveSchedule(parsed: ParsedDraft, date = today()): Schedule {
  // Today's explicit facts are applied before configured overrides/rules/defaults.
  // Manual edits are applied later, never by parsing a historical slide.
  const tip = parsed.tip?.meridiem ? field(candidates(parsed.tip)[0], 'explicit', 'Raw tip line') : unresolved<number>('Explicit AM/PM tip needed');
  const opponent = opponents.find(entry => entry.id === parsed.opponentId);
  const venue = parsed.homeAway === 'home' ? homeVenue : parsed.homeAway === 'away' ? opponent : undefined;
  const walkthroughs = parsed.walkthroughs.map(walk => ({
    id: walk.id, label: 'TEAM WALKTHROUGH',
    range: { start: time(walk.start, tip.value, `Raw line ${walk.sourceLine}`), end: time(walk.end, tip.value, `Raw line ${walk.sourceLine}`), applicable: true },
  }));
  const meetingClock = parsed.meetingClock === null ? unresolved<number>('Meeting clock not supplied') : field(parsed.meetingClock, 'explicit', 'Raw meeting line');
  const meetingTime = tip.value !== null && meetingClock.value !== null
    ? field(tip.value - meetingClock.value, 'inferred', 'meeting-relative-to-tip') : unresolved<number>('Meeting needs tip and clock');
  const schedule: Schedule = {
    raw: parsed.raw,
    game: {
      date, number: '', opponentId: parsed.opponentId,
      opponent: parsed.opponentId ? field(opponent?.name ?? parsed.opponentText, 'explicit', 'Raw opponent alias') : field(parsed.opponentText || null, 'unresolved', 'Unknown opponent'),
      homeAway: parsed.homeAway ? field(parsed.homeAway, 'explicit', 'Raw vs/at') : unresolved('Home/away not supplied'),
      tip, venue: venue?.venue ? field(venue.venue, 'inferred', 'opponent-venue-config') : unresolved('Venue needed'),
      city: venue?.city ? field(venue.city, 'inferred', 'opponent-city-config') : unresolved('City needed'), draft: parsed.draft,
    },
    groups: [], walkthroughs,
    meeting: { enabled: parsed.meetingClock !== null, clock: meetingClock, time: meetingTime },
    parserDiagnostics: parsed.diagnostics,
  };
  schedule.groups = parsed.groups.map(group => {
    let start = time(group.start, tip.value, `Raw line ${group.sourceLine}`);
    let end = time(group.end, tip.value, `Raw line ${group.sourceLine}`);
    const walk = walkthroughs.find(event => event.range.end.value !== null && (
      group.walkthroughState === 'post' || (group.kind === 'pd' && start.value === event.range.end.value)
    ));
    const post = group.walkthroughState === 'post' || Boolean(walk && group.kind === 'pd');
    if (start.value === null && !group.start && group.clock !== null && tip.value !== null) start = field(tip.value - group.clock, 'inferred', 'clock-relative-to-tip');
    if (start.value === null && !group.start && post && walk?.range.end.value !== null && walk?.range.end.value !== undefined) start = field(walk.range.end.value, 'inferred', 'post-walkthrough-start');
    if (!group.end && start.value !== null) {
      if (post && group.kind === 'pd') end = field(start.value + rules.pdCourtMinutes, 'override', 'post-walkthrough-pd-45');
      else if (group.clock !== null) end = field(start.value + rules.clockCourtMinutes, 'inferred', 'clock-group-duration');
    }
    return {
      id: group.id, kind: group.kind,
      athletes: group.athletes.map(player => {
        const known = roster.find(entry => entry.id === player.id);
        return { id: player.id, name: player.name, workoutStaff: player.workoutStaff,
          clinician: known?.active && known.clinician ? field(known.clinician, 'override', `season-clinician-partnership:${partnership(player.id)?.source ?? 'unknown'}`) : unresolved<string>(known && !known.active ? 'Player is not assigned to LA; confirm today’s clinician' : 'Clinician needed'),
          treatment: emptyRange('Individual occupied interval not supplied', false), treatmentNote: '',
        };
      }),
      table: emptyRange('Preparation needs court start'), performance: emptyRange('Preparation needs court start'),
      court: { start, end, applicable: true },
      clock: group.clock === null ? field<number>(null, 'explicit', 'No clock supplied') : field(group.clock, 'explicit', `Raw line ${group.sourceLine}`),
      location: post && group.kind === 'pd' ? 'practice' : group.location,
      walkthroughState: post ? 'post' : group.walkthroughState,
      notes: group.notes.join('\n'),
    };
  });
  // Resolve standard ends from chronological boundaries. Parallel practice-court
  // groups are excluded, and walkthrough starts cap only main-court groups.
  schedule.groups.forEach(group => {
    const start = group.court.start.value;
    if (start === null) return;
    if (group.location === 'main' && group.court.end.origin !== 'explicit' && walkthroughs.some(w => overlaps(group.court, w.range))) {
      group.court.end = unresolved('Configured court duration crosses walkthrough; explicit review required');
    }
    if (group.court.end.value === null && group.clock.value === null && !parsed.groups.find(entry => entry.id === group.id)?.end) {
      const boundaries = schedule.groups.filter(other => other.id !== group.id && other.location === group.location && other.court.start.value !== null && other.court.start.value > start)
        .map(other => other.court.start.value as number);
      if (group.location === 'main') boundaries.push(...walkthroughs.filter(w => w.range.start.value !== null && w.range.start.value > start).map(w => w.range.start.value as number));
      if (meetingTime.value !== null && meetingTime.value > start) boundaries.push(meetingTime.value);
      const boundary = boundaries.length ? Math.min(...boundaries) : null;
      if (boundary !== null && boundary - start <= 60) group.court.end = field(boundary, 'inferred', 'next-explicit-court-event-boundary');
    }
    const kawhi = group.athletes.length === 1 && group.athletes[0].id === rules.kawhi.athleteId;
    const postWalk = walkthroughs.find(w => w.range.end.value === start && w.range.start.value !== null);
    if (kawhi) {
      const tableEnd = postWalk?.range.start.value ?? start;
      group.table = inferredRange(tableEnd - rules.kawhi.tableMinutes, tableEnd, 'kawhi-preparation', 'override');
      group.performance = emptyRange('Kawhi: no performance phase', false);
    } else if (group.walkthroughState === 'post' && group.kind === 'pd' && postWalk?.range.start.value !== null && postWalk?.range.start.value !== undefined) {
      const prepEnd = postWalk.range.start.value;
      group.performance = inferredRange(prepEnd - rules.performanceMinutes, prepEnd, 'pd-before-walkthrough', 'override');
      group.table = inferredRange(prepEnd - rules.performanceMinutes - rules.tableMinutes, prepEnd - rules.performanceMinutes, 'pd-before-walkthrough', 'override');
    } else {
      const tableDuration = group.athletes.length?Math.max(...group.athletes.map(a=>defaultTreatmentMinutes(a.id))):rules.tableMinutes;
      group.performance = inferredRange(start - rules.performanceMinutes, start, 'default-performance-15');
      group.table = inferredRange(start - rules.performanceMinutes - tableDuration, start - rules.performanceMinutes,
        tableDuration !== rules.tableMinutes ? 'configured-player-treatment-duration' : 'default-table-15', tableDuration !== rules.tableMinutes ? 'override' : 'inferred');
      for (const phase of ['table', 'performance'] as const) {
        if (walkthroughs.some(w => overlaps(group[phase], w.range))) {
          group[phase] = emptyRange('Compressed/blocked preparation: review required; no automatic split approved');
        }
      }
    }
  });
  syncMeeting(schedule);
  return schedule;
}
