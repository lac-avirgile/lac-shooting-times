import {describe,it,expect} from 'vitest';
import {resolveSchedule} from '../src/scheduler/scheduleEngine';
import {parseSchedule} from '../src/parser/deterministicParser';
import {syncMeeting} from '../src/scheduler/meetingRule';
import {field} from '../src/domain/models';
const fixture=(text='')=>resolveSchedule(parseSchedule(`Shooting times vs Warriors\n12:10-12:25 Brook\nGame 1pm\n${text}`));
describe('meeting follows final shooting end when unstated',()=>{
  it('derives 35 on clock from 12:25 final court end and 1pm tip',()=>{
    expect(fixture().meeting).toMatchObject({enabled:true,time:{value:745,origin:'inferred'},clock:{value:35,origin:'inferred'}});
  });
  it('derives 40 and tracks edited final court ends and tip',()=>{
    const schedule=fixture();schedule.groups[0].court.end=field(740,'override','User time edit');syncMeeting(schedule);
    expect(schedule.meeting.clock.value).toBe(40);expect(schedule.meeting.time.value).toBe(740);
    schedule.game.tip=field(790,'override','User tip edit');syncMeeting(schedule);expect(schedule.meeting.clock.value).toBe(50);
  });
  it('preserves explicit meeting clock, manual time and disabled meeting',()=>{
    const explicit=fixture('Meeting at 40 on the clock');expect(explicit.meeting.clock.value).toBe(40);expect(explicit.meeting.time.value).toBe(740);
    const manual=fixture();manual.meeting.time=field(750,'override','User meeting time');syncMeeting(manual);expect(manual.meeting.time.value).toBe(750);
    const disabled=fixture();disabled.meeting.enabled=false;disabled.meeting.time.source='User disabled meeting';syncMeeting(disabled);expect(disabled.meeting.enabled).toBe(false);
  });
  it('keeps missing terminal court timing unresolved instead of using meeting to infer it',()=>{
    const schedule=resolveSchedule(parseSchedule('Shooting times vs Warriors\n12:10 Brook\nGame 1pm'));
    expect(schedule.groups[0].court.end.value).toBeNull();expect(schedule.meeting.time.value).toBeNull();expect(schedule.meeting.time.origin).toBe('unresolved');
  });
});
