import { describe, expect, it } from 'vitest';
import { hawaiiGame } from '../src/fixtures/hawaii';
import { parseSchedule } from '../src/parser/deterministicParser';
import { resolveSchedule } from '../src/scheduler/scheduleEngine';
import { planTreatments, applyTreatmentPlan } from '../src/scheduler/treatmentPlanner';
import { validateSchedule } from '../src/validation/validateSchedule';
import { referenceDesign } from '../src/graphic/referenceDesign';
import { treatmentLines } from '../src/graphic/designContent';

describe('first operational Hawaii game', () => {
  it('parses all ten groups, court staff, abbreviated identities and game clocks', () => {
    const parsed = parseSchedule(hawaiiGame.text);
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.opponentId).toBe('warriors');
    expect(parsed.homeAway).toBe('home');
    expect(parsed.groups.map(g => g.athletes.map(a => a.id))).toEqual([
      ['loyer','kawamura'], ['martinelli','wesley'], ['baba','wagler'], ['dick','ingram'],
      ['dunn'], ['jackson','pickett'], ['jones','christie'], ['strus'],
      ['garland','hachimura'], ['lopez'],
    ]);
    expect(parsed.groups.map(g => g.clock)).toEqual([null,null,null,null,null,null,95,80,65,50]);
    expect(parsed.groups[0].athletes.map(a => a.workoutStaff)).toEqual(['Conor','Larry']);
    expect(parsed.tip).toMatchObject({hour:1,minute:0,meridiem:'pm'});
    expect(parsed.meetingClock).toBeNull();
    expect(parsed.walkthroughs).toEqual([]);
  });
  it('resolves AM through noon and derives the approved meeting without inventing a game number', () => {
    const schedule = resolveSchedule(parseSchedule(hawaiiGame.text), hawaiiGame.date);
    expect(schedule.game.tip.value).toBe(780);
    expect(schedule.game.date).toBe('2026-10-04');
    expect(schedule.game.number).toBe('');
    expect(schedule.meeting.enabled).toBe(true);
    expect(schedule.meeting.time).toMatchObject({value:745,origin:'inferred'});
    expect(schedule.meeting.clock).toMatchObject({value:35,origin:'inferred'});
    expect(schedule.groups.map(g => [g.court.start.value,g.court.end.value])).toEqual([
      [595,610],[610,625],[625,640],[640,655],[655,670],
      [670,685],[685,700],[700,715],[715,730],[730,745],
    ]);
    expect(schedule.groups.map(g => [g.table.start.value,g.table.end.value,g.performance.start.value,g.performance.end.value])).toEqual([
      [565,580,580,595],[580,595,595,610],[595,610,610,625],
      [595,625,625,640],[625,640,640,655],[640,655,655,670],
      [655,670,670,685],[670,685,685,700],[670,700,700,715],[700,715,715,730],
    ]);
    expect(schedule.groups.map(g => g.athletes.map(a => a.clinician.value))).toEqual([
      ['Lorin','Lorin'],['Dan','Lorin'],['Colby','Maggie'],['Jasen','Maggie'],['Colby'],
      ['Jesse','Jasen'],['Maggie','Dan'],['Dan'],['Maggie','Jesse'],['Dan'],
    ]);
    expect(validateSchedule(schedule).filter(d => d.severity === 'error')).toEqual([]);
  });
  it('proposes distinct clinician appointments while retaining all shooting times', () => {
    const schedule = resolveSchedule(parseSchedule(hawaiiGame.text), hawaiiGame.date);
    const court = structuredClone(schedule.groups.map(g => g.court));
    const plan = planTreatments(schedule);
    expect(plan.issues).toEqual([]);
    expect(plan.slots).toHaveLength(17);
    for (const a of plan.slots) for (const b of plan.slots) {
      if (a !== b && a.clinician === b.clinician) expect(a.start < b.end && b.start < a.end).toBe(false);
    }
    const fletcher = plan.slots.find(a => a.name === 'Fletcher Loyer')!;
    const yuki = plan.slots.find(a => a.name === 'Yuki Kawamura')!;
    expect([fletcher.start,fletcher.end]).toEqual([565,580]);
    expect([yuki.start,yuki.end,yuki.clinician]).toEqual([565,580,'Colby']);
    applyTreatmentPlan(schedule, plan);
    expect(schedule.groups.map(g => g.court)).toEqual(court);
    expect(validateSchedule(schedule).filter(d => d.severity === 'error')).toEqual([]);
    expect(treatmentLines(schedule.groups[0]).map(line=>line.text)).toEqual(['Fletcher · Lorin / Yuki · Colby']);
    expect(plan.slots.find(slot=>slot.name==='Rui Hachimura')).toMatchObject({start:670,end:700});
    expect(plan.slots.find(slot=>slot.name==='Brandon Ingram')).toMatchObject({start:595,end:625,clinician:'Dan'});
    for(const design of ['reference-1','reference-2','reference-4'] as const) {
      // Node's conservative approximate metrics are not the loaded-browser font metrics.
      // Assert content here; browser QA independently requires zero bounds/collisions/errors.
      const text=referenceDesign(schedule,design).elements.filter(element=>element.kind==='text').map(element=>element.text).join(' ');
      for(const group of schedule.groups) for(const athlete of group.athletes) expect(text).toContain(athlete.name.toUpperCase());
      expect(text).toContain('Yuki · Colby');
      expect(text).toContain('Rui · Jesse');
    }
  });
  it('still reports a malformed game time rather than using a fabricated tip', () => {
    const parsed = parseSchedule('Shooting times vs Warriors\nGame 13:00pm');
    expect(parsed.tip).toBeNull();
    expect(resolveSchedule(parsed).game.tip.origin).toBe('unresolved');
  });
});
