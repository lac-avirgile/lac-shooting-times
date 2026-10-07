import { roster } from '../config/roster';
import { brand } from '../config/brand';
import type { Group } from '../domain/models';
import { rangeLabel } from './scene';

export function groupKind(group:Group):string {
  return group.kind==='pd'?'PD GROUP':group.kind==='stay-ready'?'STAY READY':group.kind==='custom'?'CUSTOM GROUP':'GROUP';
}
export function locationLabel(group:Group):string {
  return `${group.location==='main'?'MAIN COURT':group.location==='practice'?'PRACTICE COURT':group.location.toUpperCase()}${group.walkthroughState!=='none'?` · ${group.walkthroughState.toUpperCase()} WALKTHROUGH`:''}`;
}
export function treatmentLines(group:Group):{text:string;color:string}[] {
  // Exact appointments matching the displayed window inherit its visible range.
  // Only exceptions repeat a personal range; occupancy remains explicit in the model.
  const differs=(athlete:Group['athletes'][number]):boolean=>athlete.treatment.applicable &&
    (athlete.treatment.start.value!==group.table.start.value || athlete.treatment.end.value!==group.table.end.value);
  const hasExact=group.athletes.some(differs);
  if(!hasExact) return [{text:group.athletes.map(a=>`${roster.find(r=>r.id===a.id)?.short??a.name} · ${a.clinician.value??'CLINICIAN NEEDED'}${a.treatmentNote?` · ${a.treatmentNote}`:''}`).join(' / '),color:group.athletes.some(a=>!a.clinician.value)?brand.red:brand.navy}];
  return group.athletes.map(a=>({text:`${roster.find(r=>r.id===a.id)?.short??a.name} · ${a.clinician.value??'CLINICIAN NEEDED'}${differs(a)?` · *${rangeLabel(a.treatment)}`:''}${a.treatmentNote?` · ${a.treatmentNote}`:''}`,color:differs(a)||!a.clinician.value?brand.red:brand.navy}));
}
