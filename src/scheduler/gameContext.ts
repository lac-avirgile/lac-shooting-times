import {field,type Schedule} from '../domain/models';

export interface DailyGameContext {
  date:string;venue:string;city:string;label?:string;
  treatmentOverrides?:readonly {id:string;duration?:number;clinician?:string}[];
}
/** Daily operational approvals never change season defaults. */
export function applyGameContext(schedule:Schedule,context:DailyGameContext):void {
  schedule.game.date=context.date;
  schedule.game.label=context.label;
  schedule.game.venue=field(context.venue,'override','User-provided neutral-site game context');
  schedule.game.city=field(context.city,'override','Verified University of Hawaii venue city');
  for(const override of context.treatmentOverrides??[])for(const group of schedule.groups)for(const athlete of group.athletes){
    if(athlete.id!==override.id)continue;
    if(override.duration!==undefined)athlete.treatmentDuration=field(override.duration,'override','User-approved daily treatment duration');
    if(override.clinician)athlete.clinician=field(override.clinician,'override','User-approved daily clinician assignment');
  }
}
