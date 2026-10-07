import { describe, expect, it } from 'vitest';
import { parseSchedule } from '../src/parser/deterministicParser';
import { resolveSchedule } from '../src/scheduler/scheduleEngine';
import { currentRosterExample, samples } from '../src/fixtures/samples';
import { expected, expectedClinicians } from './expectedSchedules';
import { toInputTime } from '../src/domain/time';
import { clinicianAssignments } from '../src/config/clinicians';
import { field } from '../src/domain/models';
import { activeRoster, roster } from '../src/config/roster';
import { validateSchedule } from '../src/validation/validateSchedule';

describe('approved scheduling fixtures', () => {
  it('only the user-listed current players receive automatic partnerships', () => {
    expect(activeRoster).toHaveLength(21);
    expect(activeRoster.every(player => Boolean(clinicianAssignments[player.id]))).toBe(true);
    expect(Object.fromEntries(activeRoster.map(player => [player.id,player.clinician]))).toEqual(expectedClinicians);
    expect(roster.filter(player => !player.active).every(player => !clinicianAssignments[player.id] && player.clinician === '')).toBe(true);
  });
  it('current-roster example resolves immediately with configured clinicians', () => {
    const schedule = resolveSchedule(parseSchedule(currentRosterExample.text));
    expect(validateSchedule(schedule).filter(d => d.severity === 'error')).toEqual([]);
    expect(schedule.groups.map(g => g.athletes.map(a => a.clinician.value))).toEqual([
      ['Jesse','Jesse'],['Dan','Dan'],['Colby','Colby'],['Colby','Jesse'],['Jasen','Jasen'],['Jesse','Maggie'],['Maggie','Maggie'],['Dan','Dan'],
    ]);
  });
  samples.forEach((sample, index) => it(`matches the complete expected structured schedule for Sample ${index + 1}`, () => {
    const schedule = resolveSchedule(parseSchedule(sample.text), '2026-10-03');
    const target = expected[index];
    expect(schedule.game.opponentId).toBe(target.opponent);
    expect(schedule.game.homeAway.value).toBe(target.homeAway);
    expect(toInputTime(schedule.game.tip.value)).toBe(target.tip);
    expect(schedule.game.number).toBe('');
    expect(schedule.groups.map(g => ({
      players:g.athletes.map(a => a.id),
      table:[g.table.start.value === null ? null : toInputTime(g.table.start.value), g.table.end.value === null ? null : toInputTime(g.table.end.value)],
      performance:g.performance.applicable ? [toInputTime(g.performance.start.value),toInputTime(g.performance.end.value)] : null,
      court:[toInputTime(g.court.start.value),toInputTime(g.court.end.value)],
      clock:g.clock.value,location:g.location,
    }))).toEqual(target.groups.map(g => ({...g,location:g.location ?? 'main'})));
    expect(schedule.walkthroughs.map(w => [toInputTime(w.range.start.value),toInputTime(w.range.end.value)])).toEqual(target.walkthrough ? [target.walkthrough] : []);
    expect(schedule.meeting.time.value).toBe(schedule.game.tip.value! - 35);
    schedule.groups.forEach(g => g.athletes.forEach(a => {
      expect(a.clinician.value).toBe(expectedClinicians[a.id] ?? null);
      if (!expectedClinicians[a.id]) expect(a.clinician.origin).toBe('unresolved');
    }));
    if ([0,1,3,5].includes(index)) {
      const clock95 = schedule.groups.find(g => g.clock.value === 95)!;
      expect(clock95.table.start.origin).toBe('unresolved');
      expect(clock95.table.end.origin).toBe('unresolved');
    }
  }));
  it('keeps Sample 1 raw starts and Kawhi instead of historical changes', () => {
    const schedule = resolveSchedule(parseSchedule(samples[0].text));
    expect(schedule.groups.slice(0,3).map(g => g.court.start.value)).toEqual([855,870,885]);
    expect(schedule.groups.some(g => g.athletes[0].id === 'leonard')).toBe(true);
  });
  it('explicit ranges override configured clock duration', () => {
    const parsed = parseSchedule('Shooting Times: vs OKC\n5:25-5:45 (95 on Clock) Nico\n7pm tip vs Thunder');
    const g = resolveSchedule(parsed).groups[0];
    expect(g.court.end.value).toBe(1065);
    expect(g.court.end.origin).toBe('explicit');
  });
  it('does not derive standard end when no safe boundary exists', () => {
    const g = resolveSchedule(parseSchedule('Shooting Times: vs OKC\n5:25 Nico\n7pm tip vs Thunder')).groups[0];
    expect(g.court.end.value).toBeNull();
    expect(g.court.end.origin).toBe('unresolved');
  });
  it('caps inferred main-court end at walkthrough start', () => {
    const g = resolveSchedule(parseSchedule('Shooting Times: vs OKC\n4:15 Kris\n4:30-5 Walkthru\n5:00-5:25 Kawhi\n7pm tip vs Thunder')).groups[0];
    expect(g.court.end.value).toBe(990);
  });
  it('leaves clock end unresolved rather than silently shortening it across walkthrough', () => {
    const g = resolveSchedule(parseSchedule('Shooting Times: vs OKC\n5:25 (95 on Clock) Nico\n5:30-5:45 Walkthru\n7pm tip vs Thunder')).groups[0];
    expect(g.court.end.value).toBeNull();
    expect(g.court.end.origin).toBe('unresolved');
  });
  it('leaves ambiguous meridiem unresolved without tip context', () => {
    const g = resolveSchedule(parseSchedule('Shooting Times: vs OKC\n5:25 Nico')).groups[0];
    expect(g.court.start.origin).toBe('unresolved');
  });
  it('manual override is distinguishable and is not silently re-derived', () => {
    const schedule = resolveSchedule(parseSchedule(samples[2].text));
    schedule.groups[0].table.start = field(850,'override','User edit');
    expect(schedule.groups[0].table.start).toEqual({value:850,origin:'override',source:'User edit'});
  });
  it('uses the updated user clinician table and known alias typos', () => {
    const schedule = resolveSchedule(parseSchedule('Shooting Times: vs OKC\n4pm Brad + Rui + Jordan Mller\n4:15 Keaton + Max Straus + Yanic\n4:30 Blake Wesley + Yuki\n7pm tip vs Thunder'));
    expect(schedule.groups.flatMap(g => g.athletes.map(a => [a.name,a.clinician.value]))).toEqual([
      ['Bradley Beal','Jesse'],['Rui Hachimura','Jesse'],['Jordan Miller','Jesse'],['Keaton Wagler','Maggie'],['Max Strus','Dan'],['Yanic Konan Niederhäuser','Colby'],['Blake Wesley','Lorin'],['Yuki Kawamura','Lorin'],
    ]);
  });
});
