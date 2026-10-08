import {describe,expect,it} from 'vitest';
import {defaultRoster,movePlayerToTeam} from '../src/config/roster';
import {loadRosterAudit,rosterChanges,saveRosterAudit} from '../src/config/rosterAudit';

describe('local roster change history',()=>{
  it('records field-level changes with a timestamp and entered editor name',()=>{
    const prior=defaultRoster.find(player=>player.id==='loyer')!;
    const next=movePlayerToTeam(prior,'g-league');next.clinician='Gordon';next.treatmentMinutes=30;
    const changes=rosterChanges([prior],[next],'Adam','2026-10-08T18:30:00.000Z');
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({playerId:'loyer',by:'Adam',at:'2026-10-08T18:30:00.000Z'});
    expect(changes[0].details.join(' ')).toContain('Primary clinician: Lorin → Gordon');
    expect(changes[0].details.join(' ')).toContain('Treatment: 15 min → 30 min');
    const data=new Map<string,string>();
    const storage={getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};
    saveRosterAudit(changes,storage);
    expect(loadRosterAudit(storage)).toEqual(changes);
  });
  it('does not report unchanged players',()=>expect(rosterChanges(defaultRoster,defaultRoster,'','2026-10-08T18:30:00.000Z')).toEqual([]));
});
