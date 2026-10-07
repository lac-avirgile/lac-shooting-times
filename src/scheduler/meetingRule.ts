import {field,type Schedule} from '../domain/models';
import {rules} from '../config/rules';

export const automaticMeetingSource='Meeting at final court end';
/** Never uses the meeting to invent a court end; explicit/manual meeting details win. */
export function syncMeeting(schedule:Schedule):void {
  const meeting=schedule.meeting;
  if(!rules.meetingAtFinalCourtEnd||meeting.clock.origin==='explicit'||meeting.clock.origin==='override'||meeting.time.origin==='override'||meeting.time.source==='User disabled meeting')return;
  if(!schedule.groups.length)return;
  meeting.enabled=true;
  const ends=schedule.groups.filter(group=>group.court.applicable).map(group=>group.court.end.value);
  const tip=schedule.game.tip.value;
  const end=ends.length&&ends.every((value):value is number=>value!==null)?Math.max(...ends):null;
  const valid=end!==null&&tip!==null&&end>=0&&end<tip&&tip-end<=180;
  meeting.time=field(valid?end:null,valid?'inferred':'unresolved',automaticMeetingSource);
  meeting.clock=field(valid?tip-end:null,valid?'inferred':'unresolved',automaticMeetingSource);
}
