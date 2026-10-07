import type { Schedule } from '../domain/models';
import { clinicianKey } from '../config/clinicians';
import { treatmentMinutes } from './treatmentPlanner';
import { treatmentOptions, type TreatmentOption } from './conflictOptions';

export interface QuickResolution { kind:'backup'|'shorten'|'move'; label:string; option:TreatmentOption }
/** Suggestions only: every action is revalidated and applied by an explicit user click. */
export function quickResolutions(schedule:Schedule,groupId:string,index:number):QuickResolution[] {
  const group=schedule.groups.find(item=>item.id===groupId),athlete=group?.athletes[index];
  if(!athlete?.clinician.value)return [];
  const normal=treatmentMinutes(athlete),primary=athlete.clinician.value;
  const result:QuickResolution[]=[];
  const backup=treatmentOptions(schedule,groupId,index).find(option=>clinicianKey(option.clinician)!==clinicianKey(primary));
  if(backup)result.push({kind:'backup',label:`Use ${backup.clinician} · keep ${normal} minutes`,option:backup});
  if(normal>15){
    const shorter=treatmentOptions(schedule,groupId,index,15,primary)[0];
    if(shorter)result.push({kind:'shorten',label:`Shorten to 15 minutes · keep ${primary}`,option:shorter});
  }
  const moved=treatmentOptions(schedule,groupId,index,normal,primary).find(option=>option.distance>0);
  if(moved)result.push({kind:'move',label:`Move treatment · keep ${primary} / ${normal} minutes`,option:moved});
  return result;
}
