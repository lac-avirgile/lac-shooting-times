import {describe,expect,it} from 'vitest';
import {hawaiiGame} from '../src/fixtures/hawaii';
import {parseSchedule} from '../src/parser/deterministicParser';
import {resolveSchedule} from '../src/scheduler/scheduleEngine';
import {prepareTreatments} from '../src/scheduler/prepareTreatments';
import {validateSchedule} from '../src/validation/validateSchedule';
import {adaptiveOriginalLayout} from '../src/graphic/layout';
import {adaptiveDesign} from '../src/graphic/adaptiveDesign';
import {exportDimensions} from '../src/graphic/exportPng';
import {applyTreatmentPlan,planTreatments} from '../src/scheduler/treatmentPlanner';

describe('automatic daily preparation and adaptive fit',()=>{
  it('keeps exact standard export dimensions and grows adaptive PNGs without reducing print type',()=>{
    expect(exportDimensions(1920)).toEqual({width:4000,height:2250});
    expect(exportDimensions(1920,'ultra')).toEqual({width:8000,height:4500});
    expect(exportDimensions(2240)).toEqual({width:4672,height:2628});
  });
  it('proposes backups without silently assigning them, preserving all court and workout times',()=>{
    const schedule=resolveSchedule(parseSchedule(hawaiiGame.text)),before=structuredClone(schedule.groups.map(group=>[group.court,group.performance]));
    const result=prepareTreatments(schedule);
    expect(result.applied).toBe(false);
    expect(result.changes).toEqual(expect.arrayContaining([expect.stringContaining('Yuki Kawamura: Lorin → Colby'),expect.stringContaining('Brandon Ingram: Maggie → Dan')]));
    expect(schedule.groups[0].athletes[1].clinician.value).toBe('Lorin');
    expect(schedule.groups[3].athletes[1].clinician.value).toBe('Maggie');
    applyTreatmentPlan(schedule,planTreatments(schedule));
    expect(schedule.groups.map(group=>[group.court,group.performance])).toEqual(before);
    expect(validateSchedule(schedule).filter(issue=>issue.severity==='error'||issue.code==='possible-clinician-overlap')).toEqual([]);
    const layout=adaptiveOriginalLayout(schedule);
    expect(layout.diagnostics.filter(issue=>issue.code==='visual-overflow')).toEqual([]);
    expect(layout.blocks.filter(block=>block.type==='group')).toHaveLength(10);
    expect(layout.blocks.filter(block=>block.type==='group').every(block=>block.compact&&block.rows.find(row=>row.phase==='court')!.xOffset>0)).toBe(true);
  });
  it('does not apply a partial plan when facts are missing',()=>{
    const schedule=resolveSchedule(parseSchedule('Shooting times vs Warriors\n11:25 Mystery\nGame 1pm')),before=structuredClone(schedule);
    expect(prepareTreatments(schedule).applied).toBe(false);
    expect(schedule).toEqual(before);
  });
  it('grows a dense 16:9 scene without deleting items or shrinking below 10pt print-equivalent',()=>{
    const schedule=resolveSchedule(parseSchedule(hawaiiGame.text));
    schedule.groups=[...schedule.groups,...structuredClone(schedule.groups).map(group=>({...group,id:`extra-${group.id}`}))];
    const scene=adaptiveDesign(schedule,'reference-1');
    expect(scene.width!/scene.height!).toBe(16/9);
    expect(scene.diagnostics).toEqual([]);
    expect(scene.elements.filter(element=>element.kind==='text').every(element=>element.size>=20)).toBe(true);
    const text=scene.elements.filter(element=>element.kind==='text').map(element=>element.text).join(' ');
    for(const group of schedule.groups)for(const player of group.athletes)expect(text).toContain(player.name.toUpperCase());
  });
});
