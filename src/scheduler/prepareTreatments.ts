import type { Schedule } from '../domain/models';
import { planTreatments } from './treatmentPlanner';
import { formatTime } from '../domain/time';
import {syncIndividualTreatments} from './individualTreatments';

export interface PreparationResult { applied:boolean; changes:string[]; issues:string[] }
/** Workflow step after parsing/rules. Never shortens duration or changes court/workout. */
export function prepareTreatments(schedule:Schedule):PreparationResult {
  syncIndividualTreatments(schedule);
  const plan=planTreatments(schedule);
  if(plan.issues.length)return {applied:false,changes:[],issues:plan.issues};
  const changes=plan.slots.filter(slot=>!slot.locked && (slot.clinician!==slot.originalClinician||slot.start!==slot.preferred)).map(slot=>
    `${slot.name}: ${slot.clinician!==slot.originalClinician?`${slot.originalClinician} → ${slot.clinician}; `:''}${formatTime(slot.start)}–${formatTime(slot.end)}${slot.start!==slot.preferred?` (${Math.abs(slot.start-slot.preferred)} min ${slot.start<slot.preferred?'earlier':'later'})`:''}`);
  // A feasible alternative is not authorization to switch clinician or move time.
  if(changes.length)return {applied:false,changes,issues:[]};
  return {applied:true,changes,issues:[]};
}
