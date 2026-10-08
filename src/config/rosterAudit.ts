import { teamOf, type RosterEntry } from './roster';

export interface RosterChange { playerId:string; playerName:string; at:string; by:string; details:string[] }
export const rosterAuditKey='clippers-roster-audit-v1';
export const rosterEditorKey='clippers-roster-editor-v1';

export function rosterChanges(before:readonly RosterEntry[],after:readonly RosterEntry[],by:string,at:string):RosterChange[] {
  const prior=new Map(before.map(player=>[player.id,player]));
  const changes:RosterChange[]=[];
  const fields:[string,(player:RosterEntry)=>string][]=[
    ['Team',player=>teamOf(player)==='other'?`Other: ${player.otherTeam??''}`:teamOf(player)],
    ['Primary clinician',player=>player.clinician],['Secondary clinician',player=>player.secondary],
    ['Treatment',player=>`${player.treatmentMinutes} min`],['Name',player=>player.name],
    ['Graphic name',player=>player.short],['Aliases',player=>player.aliases.join(', ')],
  ];
  for(const player of after){
    const old=prior.get(player.id);
    const details=old?fields.flatMap(([label,value])=>value(old)===value(player)?[]:[`${label}: ${value(old)||'none'} → ${value(player)||'none'}`]):['Added to roster'];
    if(details.length)changes.push({playerId:player.id,playerName:player.name,at,by,details});
  }
  for(const player of before)if(!after.some(next=>next.id===player.id))changes.push({playerId:player.id,playerName:player.name,at,by,details:['Removed from roster']});
  return changes;
}

export function loadRosterAudit(storage:Pick<Storage,'getItem'>=localStorage):RosterChange[] {
  try {const value:unknown=JSON.parse(storage.getItem(rosterAuditKey)??'[]');return Array.isArray(value)?value.filter((item):item is RosterChange=>typeof item==='object'&&item!==null&&typeof item.playerId==='string'&&typeof item.playerName==='string'&&typeof item.at==='string'&&typeof item.by==='string'&&Array.isArray(item.details)&&item.details.every((detail:unknown)=>typeof detail==='string')):[];}catch{return [];}
}
export function saveRosterAudit(changes:readonly RosterChange[],storage:Pick<Storage,'setItem'|'getItem'>=localStorage):RosterChange[] {
  const next=[...changes,...loadRosterAudit(storage)].slice(0,500);
  storage.setItem(rosterAuditKey,JSON.stringify(next));return next;
}
