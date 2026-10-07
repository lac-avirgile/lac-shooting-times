import { roster } from '../config/roster';
import { clinicianKey,clinicians } from '../config/clinicians';
import type { Diagnostic, Group, Range, Schedule } from '../domain/models';

const overlap = (a: Range, b: Range): boolean => a.start.value !== null && a.end.value !== null && b.start.value !== null && b.end.value !== null && a.start.value < b.end.value && b.start.value < a.end.value;
const sameClinician = (a: string | null, b: string | null): boolean => !!a?.trim() && !!b?.trim() && clinicianKey(a) === clinicianKey(b);
export function validateSchedule(schedule: Schedule): Diagnostic[] {
  const issues: Diagnostic[] = schedule.parserDiagnostics.filter(issue => {
    if (issue.code === 'unknown-player') return schedule.groups.some(g => g.id === issue.groupId && g.athletes.some(a => !roster.some(r => r.id === a.id)));
    if (issue.code === 'unknown-opponent') return schedule.game.opponent.origin === 'unresolved';
    return true;
  });
  const add = (code: string, severity: Diagnostic['severity'], message: string, group?: Group, target?: string): void => { issues.push({ code, severity, message, groupId: group?.id, target }); };
  if (!schedule.game.tip.value) add('missing-tip', 'error', 'Tip time is required.', undefined, 'game');
  if (!schedule.game.homeAway.value) add('missing-home-away', 'error', 'Select home or away.', undefined, 'game');
  if (!schedule.game.opponent.value || schedule.game.opponent.origin === 'unresolved') add('unknown-opponent', 'error', 'Resolve the opponent before export.', undefined, 'game');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(schedule.game.date) || Number.isNaN(Date.parse(schedule.game.date))) add('missing-date', 'error', 'Game date is required.', undefined, 'game');
  if (!schedule.game.venue.value || !schedule.game.city.value) add('missing-venue', 'error', 'Venue and city are required.', undefined, 'game');
  if (!schedule.groups.length) add('missing-groups', 'error', 'Add at least one player group.');
  if (!schedule.meeting.enabled) add('missing-meeting', 'warning', 'No meeting supplied. Add one if required.');
  const seen = new Set<string>();
  function checkRange(range: Range, label: string, group?: Group): void {
    if (!range.applicable) return;
    if (range.start.value === null || range.end.value === null) {
      add('unresolved-timing', 'error', `${label}: complete the highlighted start/end time.`, group);
    } else if (range.start.value < 0 || range.end.value > 1439 || range.end.value <= range.start.value) {
      add('impossible-range', 'error', `${label}: end must follow start on the game date.`, group);
    }
  }
  schedule.groups.forEach((group, index) => {
    const label = `Group ${index + 1}`;
    if (!group.athletes.length) add('missing-player', 'error', `${label}: add a player.`, group);
    if (!group.location.trim()) add('missing-location', 'error', `${label}: court location required.`, group);
    group.athletes.forEach(athlete => {
      if (!roster.some(entry => entry.id === athlete.id)) add('unknown-player', 'error', `${label}: unknown player ${athlete.name}.`, group);
      if (roster.some(entry => entry.id === athlete.id && !entry.active)) add('off-roster-athlete', 'warning', `${athlete.name} is a historical player, not on the active roster. Replace this player for today's schedule.`, group);
      if (seen.has(athlete.id)) add('duplicate-player', 'warning', `${athlete.name} appears more than once; confirm this is intentional.`, group);
      seen.add(athlete.id);
      if (!athlete.clinician.value) add('missing-clinician', 'error', `${athlete.name}: treatment clinician required.`, group);
      else if(!clinicians.some(name=>clinicianKey(name)===clinicianKey(athlete.clinician.value!)))add('unknown-clinician','error',`${athlete.name}: choose a configured clinician, not workout staff.`,group);
      checkRange(athlete.treatment, `${athlete.name} individual treatment`, group);
      if (athlete.treatmentDuration) {
        const duration=athlete.treatmentDuration.value;
        if(duration===null || !Number.isInteger(duration) || duration<1 || duration>120) add('invalid-treatment-duration','error',`${athlete.name}: treatment duration must be 1–120 whole minutes.`,group);
        else if(!athlete.treatment.applicable) add('treatment-plan-required','error',`${athlete.name}: review/apply a treatment plan or enter individual times for the requested ${duration} minutes.`,group);
        else if(athlete.treatment.start.value!==null && athlete.treatment.end.value!==null && athlete.treatment.end.value-athlete.treatment.start.value!==duration) add('treatment-duration-mismatch','error',`${athlete.name}: individual treatment does not provide the requested ${duration} minutes.`,group);
      }
      if (athlete.treatment.applicable && overlap(athlete.treatment, group.court)) add('treatment-during-court', 'error', `${athlete.name}: individual treatment overlaps COURT.`, group);
      if (athlete.treatment.applicable && group.performance.applicable && overlap(athlete.treatment,group.performance)) add('treatment-during-performance','error',`${athlete.name}: individual treatment overlaps PERFORMANCE.`,group);
      if(athlete.treatment.applicable){
        if(schedule.walkthroughs.some(walk=>overlap(athlete.treatment,walk.range)))add('treatment-during-walkthrough','error',`${athlete.name}: individual treatment overlaps walkthrough. Review or move it.`,group);
        if(schedule.meeting.enabled&&schedule.meeting.time.value!==null&&athlete.treatment.end.value!==null&&athlete.treatment.end.value>schedule.meeting.time.value)add('treatment-during-meeting','error',`${athlete.name}: individual treatment extends into team meeting.`,group);
      }
    });
    checkRange(group.table, `${label} TABLE`, group);
    checkRange(group.performance, `${label} PERFORMANCE`, group);
    checkRange(group.court, `${label} COURT`, group);
    if (group.table.applicable && group.performance.applicable && group.table.end.value !== null && group.performance.start.value !== null && group.table.end.value > group.performance.start.value) add('table-after-performance', 'error', `${label}: TABLE overlaps PERFORMANCE.`, group);
    const prep = group.performance.applicable ? group.performance : group.table;
    if (prep.end.value !== null && group.court.start.value !== null && prep.end.value > group.court.start.value) add('performance-after-court', 'error', `${label}: preparation ends after COURT begins.`, group);
    if (group.clock.value !== null && group.court.start.value !== null && schedule.game.tip.value !== null && schedule.game.tip.value - group.court.start.value !== group.clock.value) add('clock-conflict', 'error', `${label}: clock label does not agree with court start and tip.`, group);
    if (group.walkthroughState === 'post') {
      const walk = schedule.walkthroughs.filter(w => w.range.end.value !== null && (group.court.start.value === null || (w.range.end.value as number) <= group.court.start.value));
      if (!walk.length) add('unresolved-post-walkthrough', 'error', `${label}: post-walkthrough timing has no matching walkthrough.`, group);
    }
    for (const walk of schedule.walkthroughs) {
      if (group.location === 'main' && overlap(group.court, walk.range)) add('court-during-walkthrough', 'error', `${label}: main COURT overlaps walkthrough.`, group);
      if (overlap(group.table, walk.range) || (group.performance.applicable && overlap(group.performance, walk.range))) add('preparation-during-walkthrough', 'warning', `${label}: preparation overlaps walkthrough; confirm the exception.`, group);
    }
    if (group.court.end.value !== null && group.court.start.value !== null && group.court.end.value - group.court.start.value > 60) add('suspicious-court-duration', 'warning', `${label}: COURT is longer than 60 minutes.`, group);
    if ([group.table.start, group.performance.start].some(f => f.value !== null && group.court.start.value !== null && group.court.start.value - f.value > 120)) add('suspicious-inferred-time', 'warning', `${label}: preparation is over two hours before court.`, group);
    if ([group.table.start, group.table.end, group.performance.start, group.performance.end].some(f => f.origin === 'unresolved') && group.performance.applicable) add('compressed-window', 'warning', `${label}: review preparation. A compressed window is not automatically divided.`, group);
  });
  for (const walk of schedule.walkthroughs) checkRange(walk.range, 'Walkthrough');
  if (schedule.meeting.enabled && (schedule.meeting.time.value === null || schedule.meeting.clock.value === null)) add('missing-meeting-time', 'error', 'Meeting needs a clock and resolved time.');
  if (schedule.meeting.enabled && schedule.meeting.clock.value !== null && (!Number.isInteger(schedule.meeting.clock.value) || schedule.meeting.clock.value <= 0 || schedule.meeting.clock.value > 180)) add('invalid-meeting-clock', 'error', 'Meeting clock must be a whole number between 1 and 180 minutes.');
  if (schedule.meeting.enabled && schedule.meeting.time.value !== null && (schedule.meeting.time.value < 0 || schedule.meeting.time.value > 1439)) add('invalid-meeting-time', 'error', 'Meeting time must be on the game date.');
  if (schedule.meeting.enabled && schedule.meeting.time.value !== null && schedule.game.tip.value !== null && schedule.meeting.clock.value !== null && schedule.meeting.time.value !== schedule.game.tip.value - schedule.meeting.clock.value) add('meeting-clock-conflict', 'error', 'Meeting time disagrees with its clock value.');
  for (let i = 0; i < schedule.groups.length; i++) {
    const a = schedule.groups[i];
    for (let j = i + 1; j < schedule.groups.length; j++) {
      const b = schedule.groups[j];
      for(const player of a.athletes)if(b.athletes.some(other=>other.id===player.id)) {
        const first=[a.performance,a.court,...(player.treatment.applicable?[player.treatment]:[])];
        const second=[b.performance,b.court,...b.athletes.filter(other=>other.id===player.id&&other.treatment.applicable).map(other=>other.treatment)];
        if(first.some(left=>second.some(right=>overlap(left,right))))add('player-conflict','error',`${player.name}: appointments/workout/court overlap between Groups ${i+1} and ${j+1}.`,b);
      }
      if (a.location === 'main' && b.location === 'main' && overlap(a.court, b.court)) add('court-overlap', 'warning', `Groups ${i + 1} and ${j + 1} share overlapping main-court time. Confirm parallel workouts.`, b);
      for (const pa of a.athletes) for (const pb of b.athletes) {
        if (!sameClinician(pa.clinician.value,pb.clinician.value) || pa.id === pb.id) continue;
        const ra = pa.treatment.applicable ? pa.treatment : a.table;
        const rb = pb.treatment.applicable ? pb.treatment : b.table;
        if (!overlap(ra, rb)) continue;
        const known = pa.treatment.applicable && pb.treatment.applicable;
        add(known ? 'clinician-conflict' : 'possible-clinician-overlap', known ? 'error' : 'warning', `${pa.clinician.value}: ${pa.name} / ${pb.name} ${known ? 'individual treatment times overlap' : 'group treatment windows may overlap; actual occupancy is unknown'}.`, b);
      }
    }
    // Same-clinician assignments within a development group may be staggered.
    for (let j = 0; j < a.athletes.length; j++) for (let k = j + 1; k < a.athletes.length; k++) {
      const pa = a.athletes[j]; const pb = a.athletes[k];
      if (sameClinician(pa.clinician.value,pb.clinician.value)) {
        if (pa.treatment.applicable && pb.treatment.applicable) {
          if (overlap(pa.treatment, pb.treatment)) add('clinician-conflict', 'error', `${pa.clinician.value}: ${pa.name} / ${pb.name} individual treatments overlap.`, a);
        } else add('possible-clinician-overlap', 'warning', `${pa.clinician.value} treats multiple players in Group ${i + 1}; confirm staggered treatment.`, a);
      }
    }
  }
  const inferred = schedule.groups.reduce((n, g) => n + [g.table, g.performance, g.court,...g.athletes.map(athlete=>athlete.treatment)].filter(r => r.applicable).flatMap(r => [r.start, r.end]).filter(f => f.origin === 'inferred').length, 0);
  if (inferred) add('inferred-values', 'info', `${inferred} timing fields use approved rules/defaults; dotted indicators appear in the editor.`);
  return issues.filter((issue, index, all) => all.findIndex(other => other.code === issue.code && other.message === issue.message) === index);
}
