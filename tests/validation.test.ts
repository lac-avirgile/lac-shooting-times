import { describe, expect, it } from 'vitest';
import { parseSchedule } from '../src/parser/deterministicParser';
import { resolveSchedule } from '../src/scheduler/scheduleEngine';
import { validateSchedule } from '../src/validation/validateSchedule';
import { samples } from '../src/fixtures/samples';
import { field } from '../src/domain/models';
const base = () => resolveSchedule(parseSchedule(samples[2].text));
describe('operational validation', () => {
  it('flags incomplete input and unresolved timings', () => {
    const codes = validateSchedule(resolveSchedule(parseSchedule('4:00 Cam'))).map(d => d.code);
    expect(codes).toEqual(expect.arrayContaining(['missing-tip','missing-home-away','unknown-opponent','unresolved-timing']));
  });
  it('flags duplicate players, missing clinician and impossible range', () => {
    const s = base(); s.groups[0].athletes[0].clinician.value = null;
    s.groups[1].athletes.push(structuredClone(s.groups[0].athletes[0]));
    s.groups[0].court.end.value = s.groups[0].court.start.value! - 1;
    expect(validateSchedule(s).map(d => d.code)).toEqual(expect.arrayContaining(['duplicate-player','missing-clinician','impossible-range']));
  });
  it('distinguishes group-window warning from known individual conflict', () => {
    const s = base(); const a = s.groups[0].athletes[0]; const b = s.groups[1].athletes[0];
    a.clinician.value = 'Jesse';
    b.clinician.value = a.clinician.value;
    s.groups[1].table = structuredClone(s.groups[0].table);
    expect(validateSchedule(s).some(d => d.code === 'possible-clinician-overlap' && d.severity === 'warning')).toBe(true);
    a.treatment = {applicable:true,start:field(850,'override','User treatment'),end:field(875,'override','User treatment')};
    b.treatment = {applicable:true,start:field(860,'override','User treatment'),end:field(880,'override','User treatment')};
    expect(validateSchedule(s).some(d => d.code === 'clinician-conflict' && d.severity === 'error')).toBe(true);
  });
  it('does not infer a conflict when individual exception resolves actual occupancy', () => {
    const s = base(); const a = s.groups[0].athletes[0]; const b = s.groups[1].athletes[0];
    a.clinician.value = 'Jesse';
    b.clinician.value = a.clinician.value; s.groups[1].table = structuredClone(s.groups[0].table);
    a.treatment = {applicable:true,start:field(780,'override','User'),end:field(795,'override','User')};
    const matches = validateSchedule(s).filter(d => d.message.includes(`${a.name} / ${b.name}`));
    expect(matches).toEqual([]);
  });
  it('checks TABLE/PERFORMANCE/COURT ordering and clock consistency', () => {
    const s = base(); s.groups[0].table.end.value = 1000; s.groups[0].performance.end.value = 1000;
    s.groups[4].clock.value = 90;
    expect(validateSchedule(s).map(d => d.code)).toEqual(expect.arrayContaining(['table-after-performance','performance-after-court','clock-conflict']));
  });
  it('preserves explicit court overlap as a warning rather than silently trimming it', () => {
    const s = resolveSchedule(parseSchedule(samples[4].text));
    expect(s.groups[0].court.end.value).toBe(1045);
    expect(validateSchedule(s).some(d => d.code === 'court-overlap' && d.severity === 'warning')).toBe(true);
  });
  it('requires matching walkthrough for post-walkthrough group', () => {
    const s = resolveSchedule(parseSchedule('Shooting Times: vs OKC\nTyty, Sean post walkthru\n7pm tip vs Thunder'));
    expect(validateSchedule(s).some(d => d.code === 'unresolved-post-walkthrough')).toBe(true);
  });
  it('all sample errors are intentionally unresolved retired-player clinicians and compressed TABLE, never unknown names', () => {
    samples.forEach((sample,index) => {
      const errors = validateSchedule(resolveSchedule(parseSchedule(sample.text))).filter(d => d.severity === 'error');
      expect(errors.filter(d => d.code !== 'missing-clinician').map(d => d.code)).toEqual([0,1,3,5].includes(index) ? ['unresolved-timing'] : []);
      expect(errors.filter(d => d.code === 'missing-clinician')).toHaveLength(index === 4 ? 5 : 8);
    });
  });
});
