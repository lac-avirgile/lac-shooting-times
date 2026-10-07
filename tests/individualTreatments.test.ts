import {describe,it,expect} from 'vitest';
import {hawaiiGame} from '../src/fixtures/hawaii';
import {resolveSchedule} from '../src/scheduler/scheduleEngine';
import {parseSchedule} from '../src/parser/deterministicParser';
import {prepareTreatments} from '../src/scheduler/prepareTreatments';
import {editTreatmentDuration,syncIndividualTreatments} from '../src/scheduler/individualTreatments';
import {planTreatments,applyTreatmentPlan} from '../src/scheduler/treatmentPlanner';
import {validateSchedule} from '../src/validation/validateSchedule';
import {treatmentLines} from '../src/graphic/designContent';
import {gameMeta} from '../src/graphic/scene';
import {field} from '../src/domain/models';
import {applyGameContext} from '../src/scheduler/gameContext';

function fixture(){const schedule=resolveSchedule(parseSchedule(hawaiiGame.text));prepareTreatments(schedule);return schedule;}
describe('independent treatment durations and live edits',()=>{
  it('loads the approved daily schedule with no overlaps, without changing season defaults',()=>{
    const schedule=resolveSchedule(parseSchedule(hawaiiGame.text));applyGameContext(schedule,hawaiiGame);
    const result=prepareTreatments(schedule);
    expect(result.changes).toEqual([]);expect(result.issues).toEqual([]);
    expect(validateSchedule(schedule).filter(issue=>issue.severity==='error'||issue.code==='possible-clinician-overlap')).toEqual([]);
    const [gradey,brandon]=schedule.groups[3].athletes;
    for(const athlete of [gradey,brandon])expect([athlete.treatment.start.value,athlete.treatment.end.value]).toEqual([610,625]);
    expect(schedule.groups[0].athletes[1].clinician.value).toBe('Colby');
    expect(schedule.groups[1].athletes[1].clinician.value).toBe('Lorin');
    const nextDay=fixture();expect(nextDay.groups[3].athletes[1].treatment.end.value!-nextDay.groups[3].athletes[1].treatment.start.value!).toBe(30);
  });
  it('gives Gradey 15 minutes, Brandon 30, before accepting any conflict proposal',()=>{
    const schedule=fixture(),[gradey,brandon]=schedule.groups[3].athletes;
    expect([gradey.treatment.start.value,gradey.treatment.end.value]).toEqual([610,625]);
    expect([brandon.treatment.start.value,brandon.treatment.end.value]).toEqual([595,625]);
    expect(brandon.clinician.value).toBe('Maggie');
    expect(treatmentLines(schedule.groups[3])[0].text).toContain('*10:10AM–10:25AM');
    expect(validateSchedule(schedule).some(issue=>issue.code==='clinician-conflict'&&issue.message.includes('Brandon'))).toBe(true);
  });
  it('allows blank → 15 and updates the individual and displayed ranges without changing Gradey',()=>{
    const schedule=fixture(),group=schedule.groups[3],[gradey,brandon]=group.athletes,before=structuredClone(gradey);
    editTreatmentDuration(brandon,'');syncIndividualTreatments(schedule);
    expect(brandon.treatmentDuration?.value).toBeNull();expect(brandon.treatment.start.value).toBeNull();
    expect(validateSchedule(schedule).some(issue=>issue.code==='invalid-treatment-duration')).toBe(true);
    editTreatmentDuration(brandon,'15');syncIndividualTreatments(schedule);
    expect([brandon.treatment.start.value,brandon.treatment.end.value]).toEqual([610,625]);
    expect([group.table.start.value,group.table.end.value]).toEqual([610,625]);
    expect(gradey).toEqual(before);
    expect(validateSchedule(schedule).some(issue=>issue.code==='clinician-conflict'&&issue.message.includes('Brandon'))).toBe(false);
  });
  it('updates a previously accepted appointment immediately and preserves explicit individual time edits',()=>{
    const schedule=fixture();applyTreatmentPlan(schedule,planTreatments(schedule));
    const brandon=schedule.groups[3].athletes[1],clinician=brandon.clinician.value;
    editTreatmentDuration(brandon,'15');syncIndividualTreatments(schedule);
    expect([brandon.treatment.start.value,brandon.treatment.end.value]).toEqual([610,625]);
    expect(brandon.clinician.value).toBe(clinician);
    brandon.treatment.start=field(590,'override','User individual treatment');brandon.treatment.end=field(605,'override','User individual treatment');
    syncIndividualTreatments(schedule);expect(brandon.treatment.start.value).toBe(590);
  });
  it('audits every player duration without lengthening group partners',()=>{
    const schedule=fixture();
    for(const group of schedule.groups)for(const athlete of group.athletes){
      const expected=['ingram','garland','hachimura'].includes(athlete.id)?30:15;
      expect(athlete.treatment.end.value!-athlete.treatment.start.value!,athlete.name).toBe(expected);
    }
    schedule.game.label=hawaiiGame.label;expect(gameMeta(schedule).date).toContain('PRESEASON GAME 1');
  });
  it('flags unknown clinicians and treatment overlapping blocked events',()=>{
    const schedule=fixture(),athlete=schedule.groups[3].athletes[1];
    athlete.clinician=field('Workout coach','override','manual');
    expect(validateSchedule(schedule).some(issue=>issue.code==='unknown-clinician')).toBe(true);
    schedule.walkthroughs=[{id:'walk',label:'WT',range:{applicable:true,start:field(600,'override','manual'),end:field(615,'override','manual')}}];
    expect(validateSchedule(schedule).some(issue=>issue.code==='treatment-during-walkthrough')).toBe(true);
    schedule.meeting={enabled:true,time:field(600,'override','manual'),clock:field(180,'override','manual')};
    expect(validateSchedule(schedule).some(issue=>issue.code==='treatment-during-meeting')).toBe(true);
  });
});
