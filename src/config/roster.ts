import { partnership } from './clinicians';
import { clinicianKey, clinicians, backupClinicians } from './clinicians';
import { rules } from './rules';
export { clinicians } from './clinicians';
export interface RosterEntry { id: string; name: string; short: string; aliases: string[]; clinician: string; secondary: string; treatmentMinutes: number; active: boolean }
const rosterNames: Omit<RosterEntry, 'clinician' | 'active' | 'secondary' | 'treatmentMinutes'>[] = [
  { id: 'loyer', name: 'Fletcher Loyer', short: 'Fletcher', aliases: ['Fletcher', 'Loyer'] },
  { id: 'omier', name: 'Norchad Omier', short: 'Norchad', aliases: ['Norchad', 'Omier'] },
  { id: 'pedulla', name: 'Sean Pedulla', short: 'Sean', aliases: ['Sean', 'Pedulla'] },
  { id: 'christie', name: 'Cam Christie', short: 'Cam', aliases: ['Cam', 'Christie', 'Cameron Christie'] },
  { id: 'washington', name: 'TyTy Washington', short: 'TyTy', aliases: ['TyTy', 'Tyty Washington Jr', 'TyTy Washington Jr.'] },
  { id: 'dunn', name: 'Kris Dunn', short: 'Kris', aliases: ['Kris', 'Dunn', 'KD'] },
  { id: 'sanders', name: 'Kobe Sanders', short: 'Kobe S', aliases: ['Kobe S', 'Sanders', 'Kobe'] },
  { id: 'leonard', name: 'Kawhi Leonard', short: 'Kawhi', aliases: ['Kawhi', 'Leonard'] },
  { id: 'batum', name: 'Nicolas Batum', short: 'Nico', aliases: ['Nico Batum', 'Nico', 'Batum', 'Nicolas'] },
  { id: 'jones', name: 'Derrick Jones Jr.', short: 'Derrick', aliases: ['Derrick Jones Jr', 'Derrick Jones', 'DJJ', 'DJ', 'Derrick'] },
  { id: 'miller', name: 'Jordan Miller', short: 'Jordan', aliases: ['Jordan', 'Jordan Mller'] },
  { id: 'mathurin', name: 'Bennedict Mathurin', short: 'Bennedict', aliases: ['Benedict Mathurin', 'Bennedict', 'Benedict', 'Mathurin'] },
  { id: 'garland', name: 'Darius Garland', short: 'Darius', aliases: ['Darius', 'Garland', 'DG'] },
  { id: 'collins', name: 'John Collins', short: 'John', aliases: ['John', 'Collins'] },
  { id: 'lopez', name: 'Brook Lopez', short: 'Brook', aliases: ['Brook', 'Lopez'] },
  { id: 'bogdanovic', name: 'Bogdan Bogdanovic', short: 'Bogdan', aliases: ['Bogdan', 'Bogdanović', 'Bogdan Bogdanović'] },
  { id: 'jackson', name: 'Isaiah Jackson', short: 'Isaiah', aliases: ['Isaiah', 'Jackson'] },
  { id: 'beal', name: 'Bradley Beal', short: 'Brad', aliases: ['Brad', 'Bradley', 'Brad Beal', 'Beal'] },
  { id: 'hachimura', name: 'Rui Hachimura', short: 'Rui', aliases: ['Rui', 'Hachimura'] },
  { id: 'ingram', name: 'Brandon Ingram', short: 'Brandon', aliases: ['Brandon', 'Ingram', 'BI'] },
  { id: 'wagler', name: 'Keaton Wagler', short: 'Keaton', aliases: ['Keaton', 'Wagler'] },
  { id: 'pickett', name: 'Jalen Pickett', short: 'Jalen', aliases: ['Jalen', 'Pickett', 'Pick'] },
  { id: 'dick', name: 'Gradey Dick', short: 'Gradey', aliases: ['Gradey', 'Dick'] },
  { id: 'strus', name: 'Max Strus', short: 'Max', aliases: ['Max', 'Strus', 'Max Straus'] },
  { id: 'martinelli', name: 'Nick Martinelli', short: 'Nick', aliases: ['Nick', 'Martinelli', 'Nicholas Martinelli'] },
  { id: 'niederhauser', name: 'Yanic Konan Niederhäuser', short: 'Yanic', aliases: ['Yanic', 'Yanic Niederhauser', 'Niederhauser'] },
  { id: 'baba', name: 'Baba Miller', short: 'Baba', aliases: ['Baba'] },
  { id: 'wesley', name: 'Blake Wesley', short: 'Blake', aliases: ['Blake', 'Wesley'] },
  { id: 'kawamura', name: 'Yuki Kawamura', short: 'Yuki', aliases: ['Yuki', 'Kawamura'] },
];
export const historicalAthleteIds = ['omier','pedulla','washington','leonard','batum','mathurin','collins','bogdanovic'];
export const defaultRoster: RosterEntry[] = rosterNames.map(player => ({...player, clinician: partnership(player.id)?.name ?? '', secondary:historicalAthleteIds.includes(player.id)?'':backupClinicians.find(name=>name!==partnership(player.id)?.name)??'', treatmentMinutes: ['hachimura','garland','ingram'].includes(player.id)?30:15, active: !historicalAthleteIds.includes(player.id)}));
export let roster = structuredClone(defaultRoster);
export let activeRoster = roster.filter(player => player.active);
export const rosterStorageKey = 'clippers-roster-settings-v1';
export const normalize = (name: string): string => name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[.']/g, '').replace(/\s+/g, ' ').trim();
export function findAthlete(name: string): RosterEntry | undefined {
  const key = normalize(name);
  return roster.find(player => [player.name, ...player.aliases].some(alias => normalize(alias) === key));
}
export function defaultTreatmentMinutes(id:string):number {
  const player=roster.find(entry=>entry.id===id);
  if(player?.active)return player.treatmentMinutes;
  return id===rules.kawhi.athleteId?rules.kawhi.tableMinutes:rules.longTableAthletes.includes(id)?rules.longTableMinutes:rules.tableMinutes;
}
export function validateRoster(players:readonly RosterEntry[]):string[] {
  const issues:string[]=[], ids=new Set<string>(), names=new Map<string,string>();
  for(const player of players) {
    if(!player.id || ids.has(player.id))issues.push('Player IDs must be unique.');
    ids.add(player.id);
    if(!player.name.trim())issues.push('Every player needs a name.');
    if(!Number.isInteger(player.treatmentMinutes)||player.treatmentMinutes<1||player.treatmentMinutes>120)issues.push(`${player.name}: treatment must be 1–120 whole minutes.`);
    for(const assignment of [player.clinician,player.secondary])if(assignment && !clinicians.some(name=>clinicianKey(name)===clinicianKey(assignment)))issues.push(`${player.name}: select a configured clinician.`);
    if(player.secondary && clinicianKey(player.secondary)===clinicianKey(player.clinician))issues.push(`${player.name}: secondary must differ from primary.`);
    for(const name of [player.name,...player.aliases]) {
      const key=normalize(name);
      if(!key)continue;
      if(names.has(key) && names.get(key)!==player.id)issues.push(`Name/alias "${name}" matches more than one player.`);
      names.set(key,player.id);
    }
  }
  return [...new Set(issues)];
}
export function setRoster(players:readonly RosterEntry[]):void {
  const issues=validateRoster(players);
  if(issues.length)throw new Error(issues.join(' '));
  roster=structuredClone([...players]);activeRoster=roster.filter(player=>player.active);
}
export function saveRoster(players:readonly RosterEntry[],storage:Pick<Storage,'setItem'>=localStorage):void {
  const issues=validateRoster(players);if(issues.length)throw new Error(issues.join(' '));
  storage.setItem(rosterStorageKey,JSON.stringify({version:1,players}));
  setRoster(players);
}
export function loadRoster(storage?:Pick<Storage,'getItem'>):string|null {
  try {
    const raw=(storage??localStorage).getItem(rosterStorageKey);if(!raw)return null;
    const value:unknown=JSON.parse(raw);
    if(typeof value!=='object'||value===null||!('version' in value)||value.version!==1||!('players' in value)||!Array.isArray(value.players))throw new Error('Invalid settings format.');
    const players:RosterEntry[]=value.players.map((item:unknown)=>{
      if(typeof item!=='object'||item===null||!('id' in item)||typeof item.id!=='string'||!('name' in item)||typeof item.name!=='string'||!('short' in item)||typeof item.short!=='string'||!('aliases' in item)||!Array.isArray(item.aliases)||!item.aliases.every((alias:unknown)=>typeof alias==='string')||!('clinician' in item)||typeof item.clinician!=='string'||!('secondary' in item)||typeof item.secondary!=='string'||!('treatmentMinutes' in item)||typeof item.treatmentMinutes!=='number'||!('active' in item)||typeof item.active!=='boolean')throw new Error('Invalid player settings.');
      return {id:item.id,name:item.name,short:item.short,aliases:item.aliases,clinician:item.clinician,secondary:item.secondary,treatmentMinutes:item.treatmentMinutes,active:item.active};
    });
    setRoster(players);return null;
  }catch{return 'Saved roster settings could not be loaded. Built-in settings are being used; review before parsing.';}
}
