import {describe,expect,it} from 'vitest';
import {vancouverGame} from '../src/fixtures/vancouver';
import {parseSchedule} from '../src/parser/deterministicParser';
import {resolveSchedule} from '../src/scheduler/scheduleEngine';
import {applyGameContext} from '../src/scheduler/gameContext';
import {prepareTreatments} from '../src/scheduler/prepareTreatments';
import {validateSchedule} from '../src/validation/validateSchedule';
import {formatTime,parseTimeToken} from '../src/domain/time';
import {referenceDesign} from '../src/graphic/referenceDesign';
import {field} from '../src/domain/models';

describe('Oct 10 Vancouver shooting times',()=>{
  it('preserves the user-supplied order, clinicians and clock times with the confirmed away venue',()=>{
    const parsed=parseSchedule(vancouverGame.text);
    parsed.tip=parseTimeToken(formatTime(vancouverGame.tip))!;
    const schedule=resolveSchedule(parsed,vancouverGame.date);
    applyGameContext(schedule,vancouverGame);
    expect(schedule.game).toMatchObject({date:'2026-10-10',label:'DRAFT · PRESEASON · VANCOUVER',opponentId:'raptors',homeAway:{value:'away'},tip:{value:930},venue:{value:'Rogers Arena'},city:{value:'Vancouver, BC'},draft:true});
    expect(schedule.groups.map(group=>group.court.start.value)).toEqual([745,775,790,805,820,835,850,865,880]);
    expect(schedule.groups.slice(5).map(group=>group.clock.value)).toEqual([95,80,65,50]);
    const athletes=schedule.groups.flatMap(group=>group.athletes);
    expect(athletes.find(player=>player.id==='garland')?.clinician.value).toBe('Joann');
    expect(athletes.find(player=>player.id==='telfort')?.clinician.value).toBe('Jesse');
    expect(athletes.find(player=>player.id==='kawamura')?.clinician.value).toBe('Dan');
    expect(athletes.find(player=>player.id==='jones')?.clinician.value).toBe('Jasen');
    expect(athletes.find(player=>player.id==='wagler')?.clinician.value).toBe('Jasen');
    expect(athletes.some(player=>player.clinician.value==='Maggie')).toBe(false);
    expect(schedule.meeting.time.value).toBe(895);
    expect(referenceDesign(schedule,'reference-4').elements.some(element=>element.kind==='crop-image'&&element.href==='/assets/reference-art-4.png')).toBe(false);
    const preparation=prepareTreatments(schedule);
    const errors=validateSchedule(schedule).filter(issue=>issue.severity==='error');
    expect({preparation,errors}).toEqual({preparation:{applied:true,changes:[],issues:[]},errors:[]});
    const changed=structuredClone(schedule);
    changed.groups[0].athletes[0].clinician=field('Maggie','override','Test change');
    expect(validateSchedule(changed).some(issue=>issue.code==='clinician-unavailable')).toBe(true);
  });
});
