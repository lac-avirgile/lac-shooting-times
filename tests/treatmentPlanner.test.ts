import { describe,expect,it } from 'vitest';
import { field } from '../src/domain/models';
import { parseSchedule } from '../src/parser/deterministicParser';
import { resolveSchedule } from '../src/scheduler/scheduleEngine';
import { planTreatments as planner,applyTreatmentPlan,releaseTreatmentPlan } from '../src/scheduler/treatmentPlanner';
// Retain the original time-only cases when backups are intentionally unavailable.
const planTreatments: typeof planner = schedule => planner(schedule,{backupClinicians:[]});
import { validateSchedule } from '../src/validation/validateSchedule';

function fixture() {
  return resolveSchedule(parseSchedule(`Shooting Times: vs Warriors
5:00 (120 on Clock) - Derrick Jones Jr
5:15 (105 on Clock) - Darius Garland
7:00pm tip vs Warriors
Meeting at 35 on the clock`));
}
describe('individual treatment slot planner',()=>{
  it('uses a backup at the normal time and restores the primary when released',()=>{
    const schedule=fixture(),plan=planner(schedule);
    expect(plan.issues).toEqual([]);
    expect(plan.slots.find(s=>s.name==='Darius Garland')).toMatchObject({start:990,end:1020,clinician:'Colby',originalClinician:'Maggie'});
    applyTreatmentPlan(schedule,plan);
    expect(schedule.groups[1].athletes[0].clinician.value).toBe('Colby');
    releaseTreatmentPlan(schedule);
    expect(schedule.groups[1].athletes[0].clinician.value).toBe('Maggie');
    expect(schedule.groups[1].athletes[0].treatment.applicable).toBe(false);
  });
  it('tries backups in order and never double-books them',()=>{
    const schedule=resolveSchedule(parseSchedule('Shooting Times: vs Warriors\n5:00 (120 on Clock) Fletcher + Yuki + Blake + Cam + Kobe\n7pm tip vs Warriors'));
    const plan=planner(schedule);
    expect(plan.issues).toEqual([]);
    expect(plan.slots.map(s=>s.clinician)).toEqual(['Lorin','Colby','Dan','Jasen','Dan']);
    expect(plan.slots.slice(0,4).every(s=>s.start===990)).toBe(true);
    expect(plan.slots[4].start).toBe(975);
    for(const a of plan.slots) for(const b of plan.slots) if(a!==b && a.clinician===b.clinician) expect(a.start<b.end && b.start<a.end).toBe(false);
  });
  it('moves Garland thirty-minute treatment around Derrick, without changing court/performance',()=>{
    const schedule=fixture(), before=structuredClone(schedule);
    const plan=planTreatments(schedule);
    expect(plan.issues).toEqual([]);
    expect(plan.slots.find(s=>s.name==='Derrick Jones Jr.')).toMatchObject({start:270+1440/2,end:285+1440/2});
    expect(plan.slots.find(s=>s.name==='Darius Garland')).toMatchObject({start:960,end:990});
    expect(schedule).toEqual(before);
    applyTreatmentPlan(schedule,plan);
    expect(schedule.groups.map(g=>[g.performance,g.court,g.table])).toEqual(before.groups.map(g=>[g.performance,g.court,g.table]));
    expect(validateSchedule(schedule).filter(d=>d.code==='clinician-conflict')).toEqual([]);
  });
  it('preserves locked manual appointment and avoids it case-insensitively',()=>{
    const schedule=fixture();
    const derrick=schedule.groups[0].athletes[0];
    derrick.clinician=field('maggie','override','manual');
    derrick.treatment={applicable:true,start:field(990,'override','manual'),end:field(1005,'override','manual')};
    const plan=planTreatments(schedule);
    expect(plan.issues).toEqual([]);
    expect(plan.slots[0]).toMatchObject({locked:true,start:990,end:1005});
    expect(plan.slots[1]).toMatchObject({start:960,end:990});
  });
  it('supports a user duration and never shortens it to fit',()=>{
    const schedule=fixture(); schedule.groups[1].athletes[0].treatmentDuration=field(45,'override','manual');
    const plan=planTreatments(schedule);
    const garland=plan.slots.find(s=>s.name==='Darius Garland');
    expect(garland).toMatchObject({start:945,end:990});
    expect(plan.issues).toEqual([]);
  });
  it('avoids walkthrough and finishes before performance',()=>{
    const schedule=fixture();
    schedule.walkthroughs=[{id:'w',label:'WT',range:{applicable:true,start:field(960,'explicit','raw'),end:field(990,'explicit','raw')}}];
    const plan=planTreatments(schedule);
    expect(plan.slots.find(s=>s.name==='Darius Garland')).toMatchObject({start:930,end:960});
    expect(plan.issues).toEqual([]);
  });
  it('reports impossible bounded windows without applying a partial plan',()=>{
    const schedule=fixture();
    schedule.walkthroughs=[{id:'w',label:'WT',range:{applicable:true,start:field(0,'explicit','raw'),end:field(1035,'explicit','raw')}}];
    const before=structuredClone(schedule),plan=planTreatments(schedule);
    expect(plan.issues.some(i=>i.includes('no 30-minute slot'))).toBe(true);
    expect(()=>applyTreatmentPlan(schedule,plan)).toThrow();
    expect(schedule).toEqual(before);
  });
  it('does not invent unresolved preferred time, staff or phases',()=>{
    const schedule=fixture();schedule.groups[1].table.start.value=null;
    expect(planTreatments(schedule).issues.join(' ')).toContain('preferred TABLE start');
    schedule.groups[0].athletes[0].clinician.value=null;
    expect(planTreatments(schedule).issues.join(' ')).toContain('clinician is required');
  });
  it('locks overlapping manual appointments and reports rather than moves them',()=>{
    const schedule=fixture();
    for(const group of schedule.groups) group.athletes[0].treatment={applicable:true,start:field(975,'override','manual'),end:field(990,'override','manual')};
    const plan=planTreatments(schedule);
    expect(plan.slots.every(s=>s.locked)).toBe(true);
    expect(plan.issues.join(' ')).toContain('locked appointments');
  });
  it('validates custom duration and treatment overlapping workout',()=>{
    const schedule=fixture(),a=schedule.groups[1].athletes[0];
    a.treatmentDuration=field(30,'override','manual');
    expect(validateSchedule(schedule).some(d=>d.code==='treatment-plan-required')).toBe(true);
    a.treatment={applicable:true,start:field(1020,'override','manual'),end:field(1050,'override','manual')};
    expect(validateSchedule(schedule).some(d=>d.code==='treatment-during-performance')).toBe(true);
  });
});
