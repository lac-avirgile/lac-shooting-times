import {describe,expect,it} from 'vitest';
import {samples,currentRosterExample} from '../src/fixtures/samples';
import {parseSchedule} from '../src/parser/deterministicParser';
import {resolveSchedule} from '../src/scheduler/scheduleEngine';
import {referenceDesign} from '../src/graphic/referenceDesign';
import {referenceDesigns,type ReferenceDesignId} from '../src/config/referenceDesigns';
import {applyTreatmentPlan,planTreatments} from '../src/scheduler/treatmentPlanner';
import {brand} from '../src/config/brand';
import {rangeLabel} from '../src/graphic/scene';

it('centers the Sidebar title in its masthead and omits unrequested slogans',()=>{
  const scene=referenceDesign(resolveSchedule(parseSchedule(currentRosterExample.text)),'reference-2');
  const title=scene.elements.find(e=>e.kind==='text'&&e.text==='PREGAME WORKOUT TIMES');
  expect(title).toMatchObject({kind:'text',y:96+73*0.36});
  const text=scene.elements.filter(e=>e.kind==='text').map(e=>e.text).join(' ');
  expect(text).not.toContain('PEOPLE. PROCESS.');
  expect(text).not.toContain('PERFORMANCE.');
  expect(text).not.toContain('BASKETBALL OPERATIONS');
});

describe.each(Object.keys(referenceDesigns) as ReferenceDesignId[])('%s reference-driven design',design=>{
  it.each(samples)('$name retains every group, phase, clinician, event and clock',sample=>{
    const schedule=resolveSchedule(parseSchedule(sample.text)),scene=referenceDesign(schedule,design);
    const text=scene.elements.filter(e=>e.kind==='text').map(e=>e.text).join(' ');
    for(const group of schedule.groups) {
      for(const athlete of group.athletes) expect(text).toContain(athlete.name.toUpperCase());
      for(const phase of [group.table,group.performance,group.court].filter(p=>p.applicable)) expect(text).toContain(rangeLabel(phase));
      if(group.clock.value!==null) expect(text).toContain(`${group.clock.value}:00 ON THE CLOCK`);
    }
    expect(text).toContain('TEAM MEETING');
    for(const walk of schedule.walkthroughs) expect(text).toContain(rangeLabel(walk.range));
    expect(scene.elements.filter(e=>e.kind==='image'||e.kind==='crop-image').map(e=>e.href)).toEqual(expect.arrayContaining([brand.logo,brand.icons.table,brand.icons.performance,brand.icons.court]));
  });
  it('prints actual individual appointments prominently, without changing the group window',()=>{
    const schedule=resolveSchedule(parseSchedule(currentRosterExample.text));
    const plan=planTreatments(schedule);applyTreatmentPlan(schedule,plan);
    const scene=referenceDesign(schedule,design),text=scene.elements.filter(e=>e.kind==='text').map(e=>e.text).join(' ');
    for(const group of schedule.groups) {
      expect(text).toContain(rangeLabel(group.table));
      for(const athlete of group.athletes) expect(text).toContain(rangeLabel(athlete.treatment));
    }
  });
  it('flags visually impossible text and excessive groups rather than truncating data',()=>{
    const schedule=resolveSchedule(parseSchedule(currentRosterExample.text));
    schedule.groups[0].notes='impossible'.repeat(300);
    expect(referenceDesign(schedule,design).diagnostics.some(d=>d.severity==='error')).toBe(true);
    schedule.groups[0].notes='';schedule.groups=[...schedule.groups,...structuredClone(schedule.groups)];
    expect(referenceDesign(schedule,design).diagnostics.some(d=>d.severity==='error')).toBe(true);
  });
});
