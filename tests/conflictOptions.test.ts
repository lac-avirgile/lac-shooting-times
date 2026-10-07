import { describe, expect, it } from 'vitest';
import { field } from '../src/domain/models';
import { parseSchedule } from '../src/parser/deterministicParser';
import { resolveSchedule } from '../src/scheduler/scheduleEngine';
import { treatmentOptions, applyTreatmentOption } from '../src/scheduler/conflictOptions';
import { validateSchedule } from '../src/validation/validateSchedule';
import { hawaiiGame } from '../src/fixtures/hawaii';
import { quickResolutions } from '../src/scheduler/quickResolutions';
import { prepareTreatments } from '../src/scheduler/prepareTreatments';

const fixture=()=>resolveSchedule(parseSchedule('Shooting times vs Warriors\n11:25 (95 on clock) Fletcher + Yuki\nGame 1pm'));
describe('reviewable conflict resolution',()=>{
  it('rechecks Brandon at the revised 10:40 court slot without automatically changing Maggie',()=>{
    const schedule=resolveSchedule(parseSchedule(hawaiiGame.text)),group=schedule.groups[3];
    const choices=quickResolutions(schedule,group.id,1);
    expect(choices.find(choice=>choice.kind==='backup')?.option).toMatchObject({clinician:'Dan',duration:30,start:595,end:625});
    expect(choices.find(choice=>choice.kind==='shorten')?.option).toMatchObject({clinician:'Maggie',duration:15,start:580,end:595});
    expect(choices.find(choice=>choice.kind==='move')?.option).toMatchObject({clinician:'Maggie',duration:30,start:565,end:595});
    expect(group.athletes[1].clinician.value).toBe('Maggie');
    expect(schedule.groups.flatMap(item=>item.athletes).some(athlete=>athlete.id==='sanders')).toBe(false);
  });
  it('offers Brandon backup, 15-minute Maggie, and full-duration Maggie choices without applying any',()=>{
    const originalText=hawaiiGame.text.replace('Gradey (Spencer) + BI (Cookie)','Gradey (Spencer)').replace('10:55 - KD (Shaun)','10:55 - KD (Shaun) + Kobe (Tim)').replace('Brook (JVG)','Brook (JVG) + BI (Cookie)');
    const schedule=resolveSchedule(parseSchedule(originalText));
    prepareTreatments(schedule);
    const before=structuredClone(schedule),group=schedule.groups[9];
    const choices=quickResolutions(schedule,group.id,1);
    expect(choices.find(choice=>choice.kind==='backup')?.option).toMatchObject({clinician:'Colby',duration:30,start:685,end:715});
    expect(choices.find(choice=>choice.kind==='shorten')?.option).toMatchObject({clinician:'Maggie',duration:15,start:700,end:715});
    expect(choices.find(choice=>choice.kind==='move')?.option).toMatchObject({clinician:'Maggie',duration:30,start:625,end:655});
    expect(schedule).toEqual(before);
    for(const choice of choices){
      const draft=structuredClone(schedule);
      applyTreatmentOption(draft,group.id,1,choice.option);
      expect(draft.groups[9].athletes[1].clinician.value).toBe(choice.option.clinician);
      expect(draft.groups[9].athletes[1].treatmentDuration?.value).toBe(choice.option.duration);
    }
  });
  it('flags exact double-bookings and lists nearest available options without mutation',()=>{
    const schedule=fixture();
    for(const athlete of schedule.groups[0].athletes)athlete.treatment={applicable:true,start:field(655,'override','User edit'),end:field(670,'override','User edit')};
    expect(validateSchedule(schedule).some(issue=>issue.code==='clinician-conflict'&&issue.severity==='error')).toBe(true);
    const before=structuredClone(schedule),options=treatmentOptions(schedule,schedule.groups[0].id,1);
    expect(options.length).toBe(6);
    expect(options.map(option=>option.distance)).toEqual([...options.map(option=>option.distance)].sort((a,b)=>a-b));
    expect(options[0]).toMatchObject({start:655,end:670,clinician:'Colby'});
    expect(options.every(option=>option.end<=670)).toBe(true);
    expect(schedule).toEqual(before);
    applyTreatmentOption(schedule,schedule.groups[0].id,1,options[0]);
    expect(validateSchedule(schedule).some(issue=>issue.code==='clinician-conflict')).toBe(false);
  });
  it('only shortens treatment when the user accepts a shorter option',()=>{
    const schedule=fixture(),athlete=schedule.groups[0].athletes[1];
    athlete.treatmentDuration=field(30,'override','User edit');
    const options=treatmentOptions(schedule,schedule.groups[0].id,1,10);
    expect(athlete.treatmentDuration.value).toBe(30);
    expect(options.every(option=>option.end-option.start===10)).toBe(true);
    applyTreatmentOption(schedule,schedule.groups[0].id,1,options[0]);
    expect(athlete.treatmentDuration.value).toBe(10);
  });
  it('does not offer options through walkthroughs or unresolved workout times',()=>{
    const schedule=fixture();schedule.groups[0].performance.start.value=null;
    expect(treatmentOptions(schedule,schedule.groups[0].id,1)).toEqual([]);
    schedule.groups[0].performance.start.value=670;
    schedule.walkthroughs=[{id:'wt',label:'WT',range:{applicable:true,start:field(0,'explicit','raw'),end:field(670,'explicit','raw')}}];
    expect(treatmentOptions(schedule,schedule.groups[0].id,1)).toEqual([]);
  });
  it('flags the same player overlapping across groups',()=>{
    const schedule=fixture();schedule.groups.push({...structuredClone(schedule.groups[0]),id:'duplicate'});
    expect(validateSchedule(schedule).some(issue=>issue.code==='player-conflict'&&issue.severity==='error')).toBe(true);
  });
  it('rejects a stale option that now conflicts with a locked appointment',()=>{
    const schedule=fixture(),option=treatmentOptions(schedule,schedule.groups[0].id,1)[0];
    schedule.groups[0].athletes[0].clinician=field(option.clinician,'override','User edit');
    schedule.groups[0].athletes[0].treatment={applicable:true,start:field(option.start,'override','User edit'),end:field(option.end,'override','User edit')};
    expect(()=>applyTreatmentOption(schedule,schedule.groups[0].id,1,option)).toThrow('no longer available');
  });
});
