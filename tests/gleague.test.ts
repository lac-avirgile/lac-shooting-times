import { beforeEach, describe, expect, it } from 'vitest';
import { defaultRoster, loadRoster, playersOnTeam, roster, saveRoster, setRoster } from '../src/config/roster';
import { buildGLeaguePlan } from '../src/gleague/schedule';

const players=['loyer','beal','jackson','hachimura','miller','garland','ingram','jones'];
beforeEach(()=>setRoster(defaultRoster));

function assignGLeague(): void {
  setRoster(roster.map(player=>players.includes(player.id)?{...player,team:'g-league',active:false,treatmentMinutes:15,clinician:player.id==='beal'?'A':'B'}:player));
}

describe('G League scheduling',()=>{
  it('splits 60 minutes into four paired slots and counts treatment and warmup back from each slot',()=>{
    assignGLeague();
    const plan=buildGLeaguePlan({start:900,tip:990,totalMinutes:60,pairs:[['loyer','beal'],['jackson','hachimura'],['miller','garland'],['ingram','jones']],treatmentMinutes:{beal:30}},roster);
    expect(plan.slots.map(slot=>[slot.start,slot.end])).toEqual([[900,915],[915,930],[930,945],[945,960]]);
    expect(plan.slots[0].players.find(player=>player.id==='beal')).toMatchObject({treatmentStart:855,treatmentEnd:885,warmupStart:885,warmupEnd:900,courtStart:900,courtEnd:915});
    expect(plan.issues).toEqual([]);
  });
  it('distributes an uneven 55-minute window without losing minutes and avoids clinician overlap',()=>{
    assignGLeague();
    const plan=buildGLeaguePlan({start:900,tip:990,totalMinutes:55,pairs:[['loyer','beal'],['jackson','hachimura'],['miller','garland'],['ingram','jones']],treatmentMinutes:{}},roster);
    expect(plan.slots.map(slot=>slot.end-slot.start)).toEqual([14,14,14,13]);
    const treatments=plan.slots.flatMap(slot=>slot.players).filter(player=>player.clinician==='B').map(player=>[player.treatmentStart,player.treatmentEnd]);
    for(let i=0;i<treatments.length;i++)for(let j=i+1;j<treatments.length;j++)expect(treatments[i][0]>=treatments[j][1]||treatments[j][0]>=treatments[i][1]).toBe(true);
    expect(plan.issues).toEqual([]);
  });
  it('blocks incomplete pairs, duplicate players, and shooting past tip',()=>{
    assignGLeague();
    const plan=buildGLeaguePlan({start:900,tip:930,totalMinutes:60,pairs:[['loyer','loyer'],['',''],['',''],['','']],treatmentMinutes:{}},roster);
    expect(plan.issues.join(' ')).toContain('appears in more than one slot');
    expect(plan.issues.join(' ')).toContain('choose player');
    expect(plan.issues.join(' ')).toContain('runs past game tip');
  });
});

describe('team roster persistence',()=>{
  it('moves players between teams and preserves the assignment after reload',()=>{
    const data=new Map<string,string>();
    const storage={setItem:(key:string,value:string)=>{data.set(key,value);},getItem:(key:string)=>data.get(key)??null};
    saveRoster(roster.map(player=>player.id==='loyer'?{...player,team:'g-league',active:false,treatmentMinutes:15}:player),storage);
    expect(playersOnTeam('g-league').map(player=>player.id)).toEqual(['loyer']);
    expect(playersOnTeam('clippers').some(player=>player.id==='loyer')).toBe(false);
    setRoster(defaultRoster);
    expect(loadRoster(storage)).toBeNull();
    expect(playersOnTeam('g-league').map(player=>player.id)).toEqual(['loyer']);
  });
  it('migrates a legacy browser roster into Clippers and Unassigned teams',()=>{
    const data=JSON.stringify({version:1,players:defaultRoster});
    expect(loadRoster({getItem:()=>data})).toBeNull();
    expect(playersOnTeam('clippers').length).toBe(21);
    expect(playersOnTeam('unassigned').length).toBe(8);
  });
  it('records a named external team without putting that player in either scheduling roster',()=>{
    const data=new Map<string,string>();
    const storage={setItem:(key:string,value:string)=>{data.set(key,value);},getItem:(key:string)=>data.get(key)??null};
    const moved=roster.map(player=>player.id==='loyer'?{...player,team:'other' as const,otherTeam:'Example Club',active:false}:player);
    saveRoster(moved,storage);
    expect(playersOnTeam('other').find(player=>player.id==='loyer')?.otherTeam).toBe('Example Club');
    expect(playersOnTeam('clippers').some(player=>player.id==='loyer')).toBe(false);
    setRoster(defaultRoster);expect(loadRoster(storage)).toBeNull();
    expect(playersOnTeam('other').find(player=>player.id==='loyer')?.otherTeam).toBe('Example Club');
  });
});
