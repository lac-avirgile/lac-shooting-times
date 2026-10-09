import {field,type Schedule} from '../domain/models';

export interface DailyGameContext {
  date:string;venue:string;city:string;label?:string;
  tip?:number;homeAway?:'home'|'away';opponentId?:string;draft?:boolean;activeAthleteIds?:readonly string[];unavailableClinicians?:readonly string[];
  treatmentOverrides?:readonly {id:string;duration?:number;clinician?:string}[];
}
/** Daily operational approvals never change season defaults. */
export function applyGameContext(schedule:Schedule,context:DailyGameContext):void {
  schedule.game.date=context.date;
  schedule.game.label=context.label;
  if(context.tip!==undefined)schedule.game.tip=field(context.tip,'override','Confirmed game tip');
  if(context.homeAway)schedule.game.homeAway=field(context.homeAway,'override','Confirmed game designation');
  if(context.opponentId)schedule.game.opponentId=context.opponentId;
  if(context.draft!==undefined)schedule.game.draft=context.draft;
  if(context.activeAthleteIds)schedule.game.activeForGame=[...context.activeAthleteIds];
  if(context.unavailableClinicians)schedule.game.unavailableClinicians=[...context.unavailableClinicians];
  schedule.game.venue=field(context.venue,'override','User-provided neutral-site game context');
  schedule.game.city=field(context.city,'override','Confirmed game venue city');
  for(const override of context.treatmentOverrides??[])for(const group of schedule.groups)for(const athlete of group.athletes){
    if(athlete.id!==override.id)continue;
    if(override.duration!==undefined)athlete.treatmentDuration=field(override.duration,'override','User-approved daily treatment duration');
    if(override.clinician)athlete.clinician=field(override.clinician,'override','User-approved daily clinician assignment');
  }
}
