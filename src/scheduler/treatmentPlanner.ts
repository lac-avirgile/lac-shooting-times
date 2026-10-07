import { rules } from '../config/rules';
import { backupClinicians, clinicianKey } from '../config/clinicians';
import { roster, defaultTreatmentMinutes } from '../config/roster';
import { field, type Athlete, type Group, type Range, type Schedule } from '../domain/models';
import {defaultIndividualSource} from './individualTreatments';

interface Interval { start: number; end: number }
export interface TreatmentSlot extends Interval {
  groupId: string; athleteIndex: number; name: string; clinician: string; originalClinician: string;
  preferred: number; locked: boolean;
}
export interface TreatmentPlan { slots: TreatmentSlot[]; issues: string[] }
const intersects = (a: Interval, b: Interval): boolean => a.start < b.end && b.start < a.end;
function interval(range: Range): Interval | null {
  return range.applicable && range.start.value !== null && range.end.value !== null && range.end.value > range.start.value
    ? {start: range.start.value, end: range.end.value} : null;
}
export function treatmentMinutes(athlete: Athlete): number {
  return athlete.treatmentDuration?.value ?? defaultTreatmentMinutes(athlete.id);
}
// Bounded, deterministic nearest-slot proposals. Never changes the input schedule.
// Explicit individual appointments reserve clinician time first. Remaining players
// retain chronological priority; ties prefer earlier treatment, not later preparation.
export function planTreatments(schedule: Schedule, options: { backupClinicians?: readonly string[] } = {}): TreatmentPlan {
  const slots: TreatmentSlot[] = [], issues: string[] = [];
  const pending: {group: Group; athlete: Athlete; athleteIndex: number; preferred: number; duration: number}[] = [];
  const walks = schedule.walkthroughs.map(w => interval(w.range));
  if (walks.some(w => !w)) issues.push('Complete walkthrough ranges before planning treatment.');
  const blocked = (group: Group): Interval[] => [interval(group.performance), interval(group.court), ...walks,
    ...(schedule.meeting.enabled && schedule.meeting.time.value !== null ? [{start:schedule.meeting.time.value,end:1440}] : [])
  ].filter((r): r is Interval => r !== null);
  for (const group of schedule.groups) for (const [athleteIndex, athlete] of group.athletes.entries()) {
    if (!group.table.applicable && !athlete.treatment.applicable) continue;
    const clinician = athlete.clinician.value?.trim();
    if (!clinician) { issues.push(`${athlete.name}: clinician is required.`); continue; }
    if (!interval(group.court) || (group.performance.applicable && !interval(group.performance))) {
      issues.push(`${athlete.name}: resolve workout and court ranges before planning.`); continue;
    }
    const exact = interval(athlete.treatment);
    if (athlete.treatment.applicable && athlete.treatment.start.source!==defaultIndividualSource) {
      if (!exact) { issues.push(`${athlete.name}: complete or disable individual treatment times.`); continue; }
      if (athlete.treatmentDuration?.value !== undefined && athlete.treatmentDuration.value !== null && exact.end-exact.start !== athlete.treatmentDuration.value) issues.push(`${athlete.name}: locked appointment does not match requested duration.`);
      if (blocked(group).some(b => intersects(exact,b))) issues.push(`${athlete.name}: locked treatment overlaps workout, court, walkthrough, or meeting.`);
      slots.push({...exact,groupId:group.id,athleteIndex,name:athlete.name,clinician,originalClinician:clinician,preferred:exact.start,locked:true});
      continue;
    }
    const duration = treatmentMinutes(athlete);
    if (athlete.treatmentDuration && athlete.treatmentDuration.value === null) { issues.push(`${athlete.name}: enter the requested treatment duration.`); continue; }
    if (!Number.isInteger(duration) || duration < 1 || duration > 120) { issues.push(`${athlete.name}: treatment duration must be 1–120 whole minutes.`); continue; }
    // A shorter-duration player in a long group window retains normal preparation
    // immediately before PERFORMANCE; don't lengthen or advance everyone equally.
    const preferred = group.table.start.value!==null && group.table.start.source==='configured-player-treatment-duration' && group.table.end.value!==null
      ? group.table.end.value-duration : group.table.start.value;
    if (preferred === null) { issues.push(`${athlete.name}: resolve the preferred TABLE start; the planner will not invent it.`); continue; }
    pending.push({group,athlete,athleteIndex,preferred,duration});
  }
  for (let i=0;i<slots.length;i++) for(let j=i+1;j<slots.length;j++) {
    if (clinicianKey(slots[i].clinician) === clinicianKey(slots[j].clinician) && intersects(slots[i],slots[j])) issues.push(`${slots[i].clinician}: locked appointments for ${slots[i].name} and ${slots[j].name} overlap.`);
  }
  pending.sort((a,b) => (a.group.court.start.value ?? 1440)-(b.group.court.start.value ?? 1440) || a.preferred-b.preferred || a.duration-b.duration);
  for (const entry of pending) {
    const {group,athlete,athleteIndex,preferred,duration}=entry;
    const originalClinician=athlete.clinician.value!;
    // A manual clinician assignment is an explicit lock, not a season default.
    const secondary=roster.find(player=>player.id===athlete.id)?.secondary;
    const choices=[originalClinician,...(athlete.clinician.source.startsWith('season-clinician-partnership') ? options.backupClinicians ?? [...(secondary?[secondary]:[]),...backupClinicians] : [])]
      .filter((name,index,names)=>names.findIndex(other=>clinicianKey(other)===clinicianKey(name))===index);
    let clinician=originalClinician;
    const blocks=blocked(group);
    const deadline=Math.min(group.performance.applicable ? group.performance.start.value! : group.court.start.value!, schedule.game.tip.value ?? 1440);
    let found: Interval | null=null;
    for(let distance=0;distance<=rules.treatmentSearchMinutes && !found;distance++) {
      for(const start of distance===0 ? [preferred] : [preferred-distance,preferred+distance]) {
        const candidate={start,end:start+duration};
        if(start<0 || candidate.end>deadline || candidate.end>1439) continue;
        if(blocks.some(b=>intersects(candidate,b))) continue;
        const available=choices.find(name=>!slots.some(slot=>clinicianKey(slot.clinician)===clinicianKey(name) && intersects(candidate,slot)));
        if(!available) continue;
        clinician=available; found=candidate; break;
      }
    }
    if(!found) { issues.push(`${athlete.name}: no ${duration}-minute slot within ${rules.treatmentSearchMinutes} minutes of the preferred start. Adjust timing or clinician manually.`); continue; }
    slots.push({...found,groupId:group.id,athleteIndex,name:athlete.name,clinician,originalClinician,preferred,locked:false});
  }
  return {slots,issues};
}
export function applyTreatmentPlan(schedule: Schedule, plan: TreatmentPlan): void {
  if(plan.issues.length) throw new Error('Resolve planner issues before applying appointments.');
  for(const slot of plan.slots) {
    const athlete=schedule.groups.find(g=>g.id===slot.groupId)?.athletes[slot.athleteIndex];
    if(!athlete || athlete.name!==slot.name || athlete.clinician.value!==slot.originalClinician) throw new Error('Treatment plan is stale. Review a new plan.');
  }
  for(const slot of plan.slots) {
    if(slot.locked) continue;
    const athlete=schedule.groups.find(g=>g.id===slot.groupId)?.athletes[slot.athleteIndex];
    if(!athlete) continue;
    if(slot.clinician!==slot.originalClinician) {
      athlete.clinicianBeforePlan=structuredClone(athlete.clinician);
      athlete.clinician=field(slot.clinician,'override','Accepted backup clinician proposal');
    }
    athlete.treatment={applicable:true,start:field(slot.start,'override','Accepted treatment planner proposal'),end:field(slot.end,'override','Accepted treatment planner proposal')};
  }
}
export function releaseTreatmentPlan(schedule: Schedule): void {
  for(const group of schedule.groups) for(const athlete of group.athletes) {
    if(!['Accepted treatment planner proposal','Automatic configured treatment plan'].includes(athlete.treatment.start.source)) continue;
    athlete.treatment.applicable=false;
    if(athlete.clinicianBeforePlan && ['Accepted backup clinician proposal','Automatic backup clinician assignment'].includes(athlete.clinician.source)) athlete.clinician=athlete.clinicianBeforePlan;
    delete athlete.clinicianBeforePlan;
  }
}
