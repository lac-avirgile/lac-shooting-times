import { describe, expect, it } from 'vitest';
import { parseSchedule } from '../src/parser/deterministicParser';
import { samples } from '../src/fixtures/samples';
import { expected } from './expectedSchedules';

describe('parser facts independent of scheduling', () => {
  samples.forEach((sample, index) => it(`preserves explicit facts in Sample ${index + 1} (${sample.name})`, () => {
    const result = parseSchedule(sample.text);
    const target = expected[index];
    expect(result.diagnostics).toEqual([]);
    expect(result.opponentId).toBe(target.opponent);
    expect(result.homeAway).toBe(target.homeAway);
    expect(result.groups.map(g => g.athletes.map(a => a.id))).toEqual(target.groups.map(g => g.players));
    expect(result.groups.map(g => g.clock)).toEqual(target.groups.map(g => g.clock));
    expect(result.meetingClock).toBe(35);
    expect(result.walkthroughs.length).toBe(target.walkthrough ? 1 : 0);
    expect(result.tip?.meridiem).toBe('pm');
    const kawhi = result.groups.find(g => g.athletes.some(a => a.id === 'leonard'));
    expect(kawhi?.end).not.toBeNull();
    expect(result.groups[0]).not.toHaveProperty('table');
  }));
  it('retains court staff instead of assigning treatment clinicians', () => {
    const parsed = parseSchedule(samples[0].text);
    expect(parsed.groups[0].athletes[0].workoutStaff).toBe('Chris');
    expect(parsed.groups[0].athletes[0]).not.toHaveProperty('clinician');
  });
  it('handles spacing, capitalization, punctuation and known aliases', () => {
    const result = parseSchedule('Shooting Times (DRAFT): AT sac\n 4:00 - Nico (Conor) + DJJ (Jay)\n4:15 - Jordan Mller (Dahntay) + Benedict Mathurin (BShaw)\n6:00PM tip at Sacramento');
    expect(result.diagnostics).toEqual([]);
    expect(result.groups[0].athletes.map(a => a.id)).toEqual(['batum','jones']);
    expect(result.groups[1].athletes.map(a => a.id)).toEqual(['miller','mathurin']);
  });
  it('supports Stay Ready, multiline PD, and pre-walkthrough qualifiers', () => {
    const result = parseSchedule('Shooting Times: vs Raptors\n4:00 Stay Ready: Cam + Isaiah Practice Court\n4:20 PD Group: Practice Court\nTyty, Sean, and Norchad\n4:45 Kris pre-walkthrough\n5-5:30 Walkthrough\n7:30pm tip vs TOR');
    expect(result.groups.map(g => g.kind)).toEqual(['stay-ready','pd','normal']);
    expect(result.groups[1].athletes).toHaveLength(3);
    expect(result.groups[2].walkthroughState).toBe('pre');
    expect(result.groups[0].location).toBe('practice');
  });
  it('surfaces unknown names, unknown opponent, and unparsed text', () => {
    const result = parseSchedule('Shooting Times: vs Space Jam\n4:00 Jane Mystery\nAsk Joe about dinner');
    expect(result.diagnostics.map(d => d.code)).toEqual(expect.arrayContaining(['unknown-opponent','unknown-player','unparsed-text']));
  });
  it('reports conflicting home/away and opponents', () => {
    const result = parseSchedule('Shooting Times: vs OKC\n7pm tip at Sacramento');
    expect(result.diagnostics.map(d => d.code)).toEqual(expect.arrayContaining(['conflicting-home-away','conflicting-opponent']));
  });
});
