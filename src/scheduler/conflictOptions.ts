import { backupClinicians, clinicianKey } from '../config/clinicians';
import { roster } from '../config/roster';
import { rules } from '../config/rules';
import { field, type Range, type Schedule } from '../domain/models';
import { treatmentMinutes } from './treatmentPlanner';

export interface TreatmentOption { start:number; end:number; clinician:string; duration:number; distance:number; estimated:boolean }
const overlaps=(start:number,end:number,range:Range):boolean=>range.applicable && range.start.value!==null && range.end.value!==null && start<range.end.value && range.start.value<end;
export function treatmentOptions(schedule:Schedule,groupId:string,athleteIndex:number,duration?:number,onlyClinician?:string):TreatmentOption[] {
  const group=schedule.groups.find(item=>item.id===groupId),athlete=group?.athletes[athleteIndex];
  if(!group||!athlete)return [];
  const minutes=duration??treatmentMinutes(athlete);
  const preferred=athlete.treatment.applicable?athlete.treatment.start.value:group.table.start.value;
  const deadline=group.performance.applicable?group.performance.start.value:group.court.start.value;
  if(preferred===null||deadline===null||group.court.end.value===null||!athlete.clinician.value||!Number.isInteger(minutes)||minutes<1||minutes>120)return [];
  const secondary=roster.find(player=>player.id===athlete.id)?.secondary;
  const choices=(onlyClinician?[onlyClinician]:[athlete.clinician.value,...(secondary?[secondary]:[]),...backupClinicians]).filter((name,index,all)=>all.findIndex(other=>clinicianKey(other)===clinicianKey(name))===index);
  const options:TreatmentOption[]=[];
  for(let distance=0;distance<=rules.treatmentSearchMinutes && options.length<6;distance++)for(const start of distance?[preferred-distance,preferred+distance]:[preferred]) {
    const end=start+minutes;
    if(start<0||end>deadline||end>(schedule.game.tip.value??1439))continue;
    if(schedule.walkthroughs.some(walk=>overlaps(start,end,walk.range))||schedule.walkthroughs.some(walk=>walk.range.start.value===null||walk.range.end.value===null))continue;
    if(schedule.meeting.enabled && (schedule.meeting.time.value===null||end>schedule.meeting.time.value))continue;
    if(schedule.groups.some(other=>other.athletes.some(player=>player.id===athlete.id) && (overlaps(start,end,other.performance)||overlaps(start,end,other.court))))continue;
    for(const clinician of choices) {
      let blocked=false,estimated=false;
      for(const other of schedule.groups)for(const [index,player] of other.athletes.entries()) {
        if(other.id===groupId&&index===athleteIndex)continue;
        if(player.id!==athlete.id && (!player.clinician.value || clinicianKey(player.clinician.value)!==clinicianKey(clinician)))continue;
        const occupied=player.treatment.applicable?player.treatment:other.table;
        if(occupied.start.value===null||occupied.end.value===null){blocked=true;continue;}
        if(!player.treatment.applicable)estimated=true;
        if(overlaps(start,end,occupied))blocked=true;
      }
      if(blocked)continue;
      options.push({start,end,clinician,duration:minutes,distance,estimated});
      if(options.length===6)break;
    }
    if(options.length===6)break;
  }
  return options;
}
export function applyTreatmentOption(schedule:Schedule,groupId:string,athleteIndex:number,option:TreatmentOption):void {
  if(!treatmentOptions(schedule,groupId,athleteIndex,option.duration,option.clinician).some(candidate=>candidate.start===option.start&&candidate.end===option.end&&clinicianKey(candidate.clinician)===clinicianKey(option.clinician)))throw new Error('This option is no longer available. Review the current conflicts.');
  const athlete=schedule.groups.find(group=>group.id===groupId)!.athletes[athleteIndex];
  athlete.clinician=field(option.clinician,'override','User accepted conflict resolution');
  athlete.treatmentDuration=field(option.duration,'override','User accepted treatment duration');
  athlete.treatment={applicable:true,start:field(option.start,'override','User accepted conflict resolution'),end:field(option.end,'override','User accepted conflict resolution')};
  delete athlete.clinicianBeforePlan;
}
