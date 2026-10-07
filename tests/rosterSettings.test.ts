import { beforeEach, describe, expect, it } from 'vitest';
import { activeRoster, defaultRoster, defaultTreatmentMinutes, findAthlete, loadRoster, roster, rosterStorageKey, saveRoster, setRoster, validateRoster } from '../src/config/roster';
import { clinicians } from '../src/config/clinicians';
import { parseSchedule } from '../src/parser/deterministicParser';
import { resolveSchedule } from '../src/scheduler/scheduleEngine';
import { planTreatments } from '../src/scheduler/treatmentPlanner';

beforeEach(()=>setRoster(defaultRoster));
describe('editable season settings',()=>{
  it('defaults everyone active to 15 except Rui, Darius and Brandon at 30',()=>{
    expect(clinicians).toEqual(['Jasen','Colby','Dan','Maggie','Jesse','Eric','Lorin']);
    for(const player of activeRoster)expect(defaultTreatmentMinutes(player.id)).toBe(['hachimura','garland','ingram'].includes(player.id)?30:15);
  });
  it('persists typed players, aliases, assignments and minutes across reload',()=>{
    const data=new Map<string,string>();
    const storage={setItem:(key:string,value:string)=>{data.set(key,value);},getItem:(key:string)=>data.get(key)??null};
    saveRoster([...roster,{id:'test',name:'Test Player',short:'Test',aliases:['TP'],active:true,clinician:'Eric',secondary:'Jesse',treatmentMinutes:25}],storage);
    setRoster(defaultRoster);expect(findAthlete('TP')).toBeUndefined();
    expect(loadRoster(storage)).toBeNull();
    expect(findAthlete('TP')).toMatchObject({clinician:'Eric',secondary:'Jesse',treatmentMinutes:25});
    const schedule=resolveSchedule(parseSchedule('Shooting times vs Warriors\n11:25 (95 on clock) TP\nGame 1pm'));
    expect(schedule.groups[0].table.start.value).toBe(645);
    expect(schedule.groups[0].athletes[0].clinician.value).toBe('Eric');
  });
  it('removes a player from active choices without losing historical parsing',()=>{
    setRoster(roster.map(player=>player.id==='loyer'?{...player,team:'unassigned',active:false}:player));
    expect(activeRoster.some(player=>player.id==='loyer')).toBe(false);
    expect(findAthlete('Fletcher')?.active).toBe(false);
    expect(resolveSchedule(parseSchedule('Shooting Times vs Warriors\n11:25 (95 on clock) Fletcher\nGame 1pm')).groups[0].athletes[0].clinician.value).toBeNull();
  });
  it('rejects ambiguous aliases, invalid minutes and duplicate primary/secondary',()=>{
    const players=structuredClone(defaultRoster);
    players[0].secondary=players[0].clinician;players[0].treatmentMinutes=0;players[0].aliases.push('Yuki');
    expect(validateRoster(players).join(' ')).toContain('secondary must differ');
    expect(validateRoster(players).join(' ')).toContain('1–120');
    expect(validateRoster(players).join(' ')).toContain('more than one player');
  });
  it('reports corrupt storage and does not install invalid settings',()=>{
    expect(loadRoster({getItem:()=>JSON.stringify({version:1,players:[{id:'bad'}]})})).toContain('could not be loaded');
    expect(activeRoster).toHaveLength(21);
    expect(()=>saveRoster(defaultRoster,{setItem:()=>{throw new Error('Storage full');}})).toThrow('Storage full');
    expect(rosterStorageKey).toContain('v1');
  });
  it('tries an athlete-specific secondary before the shared backups',()=>{
    setRoster(roster.map(player=>({...player,secondary:player.id==='kawamura'?'Eric':player.secondary})));
    const schedule=resolveSchedule(parseSchedule('Shooting Times vs Warriors\n11:25 (95 on clock) Fletcher + Yuki\nGame 1pm'));
    expect(planTreatments(schedule).slots.find(slot=>slot.name==='Yuki Kawamura')).toMatchObject({clinician:'Eric',start:655});
  });
});
