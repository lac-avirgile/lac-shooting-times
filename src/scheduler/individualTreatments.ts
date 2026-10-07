import {field,type Schedule,type Athlete} from '../domain/models';
import {defaultTreatmentMinutes} from '../config/roster';
import {rules} from '../config/rules';

export const defaultIndividualSource='Configured individual treatment before workout';
/** Populate each player's own normal interval; do not resolve conflicts or change clinicians. */
export function syncIndividualTreatments(schedule:Schedule):void {
  for(const group of schedule.groups){
    // Only the rule-derived display window tracks durations. Explicit group edits stay fixed.
    if(['configured-player-treatment-duration','default-table-15'].includes(group.table.start.source)&&group.table.end.value!==null&&group.athletes.length){
      const durations=group.athletes.map(athlete=>athlete.treatmentDuration?athlete.treatmentDuration.value:defaultTreatmentMinutes(athlete.id));
      if(durations.every((duration):duration is number=>duration!==null&&Number.isInteger(duration)&&duration>=1&&duration<=120)){
        const longest=Math.max(...durations),source=longest===rules.tableMinutes?'default-table-15':'configured-player-treatment-duration';
        group.table.start=field(group.table.end.value-longest,'inferred',source);
      }
    }
    for(const athlete of group.athletes){
    if(athlete.treatment.applicable && athlete.treatment.start.source!==defaultIndividualSource)continue;
    if(!athlete.clinician.value||!group.table.applicable)continue;
    const end=group.table.end.value,duration=athlete.treatmentDuration?athlete.treatmentDuration.value:defaultTreatmentMinutes(athlete.id);
    if(end===null||group.table.start.value===null||duration===null||!Number.isInteger(duration)||duration<1||duration>120){
      if(athlete.treatment.start.source===defaultIndividualSource)athlete.treatment={applicable:true,start:field<number>(null,'unresolved',defaultIndividualSource),end:field(end,'inferred',defaultIndividualSource)};
      continue;
    }
    athlete.treatment={applicable:true,start:field(end-duration,'inferred',defaultIndividualSource),end:field(end,'inferred',defaultIndividualSource)};
    }
  }
}

export function editTreatmentDuration(athlete:Athlete,value:string):void {
  const duration=value===''?null:Number(value);
  athlete.treatmentDuration=field(duration,'override','User treatment duration');
  if(!athlete.treatment.applicable)return;
  const end=athlete.treatment.end.value,valid=duration!==null&&Number.isInteger(duration)&&duration>=1&&duration<=120&&end!==null;
  athlete.treatment.start=field(valid?end-duration:null,valid?'override':'unresolved','User treatment duration');
  athlete.treatment.end=field(end,'override','User treatment duration');
}
