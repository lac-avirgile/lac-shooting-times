import type { RosterEntry } from '../config/roster';
import { teamOf } from '../config/roster';

export interface GLeagueInput {
  start: number;
  tip: number;
  totalMinutes: number;
  pairs: [string, string][];
  treatmentMinutes: Record<string, number>;
}
export interface GLeaguePlayerTime {
  id: string;
  name: string;
  clinician: string;
  treatmentStart: number;
  treatmentEnd: number;
  warmupStart: number;
  warmupEnd: number;
  courtStart: number;
  courtEnd: number;
}
export interface GLeagueSlot { index: number; start: number; end: number; ids: [string,string]; players: GLeaguePlayerTime[] }
export interface GLeaguePlan { slots: GLeagueSlot[]; issues: string[]; end: number }

/** Split the entered court window into whole-minute, back-to-back pair slots. */
export function buildGLeaguePlan(input: GLeagueInput, roster: readonly RosterEntry[]): GLeaguePlan {
  const issues: string[] = [];
  const count = input.pairs.length;
  if(count < 4 || count > 7)issues.push('Choose 4 to 7 shooting slots.');
  if(!Number.isInteger(input.start) || input.start < 0 || input.start >= 1440)issues.push('Enter a valid first shooting time.');
  if(!Number.isInteger(input.tip) || input.tip < 0 || input.tip >= 1440)issues.push('Enter a valid game tip time.');
  if(!Number.isInteger(input.totalMinutes) || input.totalMinutes < count || input.totalMinutes > 180)issues.push('Court time must provide at least one minute per slot and be no more than 180 minutes.');
  const end=input.start+input.totalMinutes;
  if(Number.isFinite(end) && end > input.tip)issues.push('The final shooting slot runs past game tip. Adjust the start, court time, or tip.');
  const selected=new Set<string>();
  const bookings=new Map<string,{start:number;end:number}[]>();
  const slots:GLeagueSlot[]=[];
  let cursor=input.start;
  input.pairs.forEach((pair,index)=>{
    const duration=Math.floor(input.totalMinutes/count)+(index < input.totalMinutes%count ? 1 : 0);
    const courtStart=cursor,courtEnd=cursor+duration;
    cursor=courtEnd;
    const warmupStart=courtStart-15;
    const players:GLeaguePlayerTime[]=[];
    pair.forEach((id,side)=>{
      if(!id){issues.push(`Slot ${index+1}: choose player ${side+1}.`);return;}
      const player=roster.find(row=>row.id===id);
      if(!player || teamOf(player)!=='g-league'){issues.push(`Slot ${index+1}: choose a current G League player.`);return;}
      if(selected.has(id)){issues.push(`${player.name} appears in more than one slot.`);return;}
      selected.add(id);
      const treatmentMinutes=input.treatmentMinutes[id]??player.treatmentMinutes;
      if(!Number.isInteger(treatmentMinutes)||treatmentMinutes<1||treatmentMinutes>120){issues.push(`${player.name}: treatment must be 1–120 minutes.`);return;}
      if(!player.clinician.trim())issues.push(`${player.name}: choose a treatment clinician in Roster & teams.`);
      const clinician=player.clinician.trim();
      const occupied=bookings.get(clinician.toLowerCase())??[];
      let treatmentStart=warmupStart-treatmentMinutes;
      while(clinician && occupied.some(slot=>treatmentStart<slot.end && treatmentStart+treatmentMinutes>slot.start) && treatmentStart>=warmupStart-treatmentMinutes-180)treatmentStart--;
      if(treatmentStart<0 || treatmentStart<warmupStart-treatmentMinutes-180)issues.push(`${player.name}: no non-overlapping treatment time is available before warmup.`);
      if(clinician){occupied.push({start:treatmentStart,end:treatmentStart+treatmentMinutes});bookings.set(clinician.toLowerCase(),occupied);}
      players.push({id,name:player.name,clinician,treatmentStart,treatmentEnd:treatmentStart+treatmentMinutes,warmupStart,warmupEnd:courtStart,courtStart,courtEnd});
    });
    slots.push({index:index+1,start:courtStart,end:courtEnd,ids:pair,players});
  });
  return {slots,issues:[...new Set(issues)],end};
}

export function parseClock(value:string):number {
  const [hours,minutes]=value.split(':').map(Number);
  return hours*60+minutes;
}
