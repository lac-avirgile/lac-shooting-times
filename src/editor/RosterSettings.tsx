import { useState } from 'react';
import { movePlayerToTeam, roster, saveRoster, teamOf, validateRoster, type RosterEntry, type Team } from '../config/roster';
import { clinicians } from '../config/clinicians';

const teamLabels: Record<Team,string> = { clippers:'LA Clippers', 'g-league':'San Diego Clippers', other:'Other team', unassigned:'Unassigned' };
const teams: Team[] = ['clippers','g-league','other','unassigned'];

export function RosterSettings({onSave=()=>{}, initialTeam='clippers'}:{onSave?:()=>void;initialTeam?:Team}) {
  const [players,setPlayers]=useState(()=>structuredClone(roster));
  const [selectedTeam,setSelectedTeam]=useState<Team>(initialTeam);
  const [message,setMessage]=useState('');
  const [failed,setFailed]=useState(false);
  const [expandedIds,setExpandedIds]=useState<string[]>([]);
  const update=(id:string,change:(player:RosterEntry)=>void):void=>{
    setPlayers(current=>current.map(player=>{if(player.id!==id)return player;const copy=structuredClone(player);change(copy);return copy;}));
    setMessage('');
  };
  const save=():void=>{
    const normalized=players.map(player=>({...player,name:player.name.trim(),short:player.short.trim()||player.name.trim().split(' ')[0],active:teamOf(player)==='clippers'}));
    const issues=validateRoster(normalized);
    if(issues.length){setFailed(true);setMessage(issues.join(' '));return;}
    try {saveRoster(normalized);setPlayers(structuredClone(roster));onSave();setFailed(false);setMessage('Saved in this browser. Both schedule creators will use these assignments.');}
    catch(error){setFailed(true);setMessage(error instanceof Error?error.message:'Settings could not be saved.');}
  };
  const visible=players.filter(player=>teamOf(player)===selectedTeam);
  return <section className="roster-management"><header className="roster-management-header"><h1>Roster Management</h1><p>Set team rosters, clinician assignments, and default treatment times.</p></header><div className="roster-settings">
    <p className="field-help">Saved in this browser. Assign each player to LA, San Diego, another named team, or Unassigned. Each team's clinician and treatment defaults are kept when a player moves between LA and San Diego.</p>
    <div className="team-tabs" role="group" aria-label="Roster team">{teams.map(team=><button key={team} aria-pressed={selectedTeam===team} className={selectedTeam===team?'selected':''} onClick={()=>setSelectedTeam(team)}>{teamLabels[team]} ({players.filter(player=>teamOf(player)===team).length})</button>)}</div>
    {selectedTeam==='g-league'&&<p className="field-help">Starting list: San Diego’s 2025–26 season roster. Lorin and Gordon are assigned as editable defaults. Confirm today’s players before scheduling.</p>}
    {visible.length===0&&<p className="field-help">No players assigned here. Add one below or move a player from another team.</p>}
    {visible.map(player=><div key={player.id} className="roster-row"><strong>{player.name||'New player'}{teamOf(player)==='other'&&player.otherTeam?` · ${player.otherTeam}`:''}</strong><label>Team<select aria-label={`Team for ${player.name||'new player'}`} value={teamOf(player)} onChange={e=>{const team=e.target.value as Team;update(player.id,row=>Object.assign(row,movePlayerToTeam(row,team)));if(team==='other')setExpandedIds(current=>current.includes(player.id)?current:[...current,player.id]);}}>{teams.map(team=><option key={team} value={team}>{teamLabels[team]}</option>)}</select></label>
      {teamOf(player)==='other'&&<label className="other-team-name">Other team name<input aria-label={`Other team for ${player.name||'new player'}`} value={player.otherTeam??''} onChange={e=>update(player.id,row=>{row.otherTeam=e.target.value;})}/></label>}
      <details className="roster-player" open={expandedIds.includes(player.id)}><summary onClick={event=>{event.preventDefault();setExpandedIds(current=>current.includes(player.id)?current.filter(id=>id!==player.id):[...current,player.id]);}}>Edit player details</summary><div className="group-content">
      <label>Player name<input aria-label={`Roster name ${player.id}`} value={player.name} onChange={e=>update(player.id,row=>{row.name=e.target.value;})}/></label>
      <div className="two-fields"><label>Graphic short name<input value={player.short} onChange={e=>update(player.id,row=>{row.short=e.target.value;})}/></label><label>Default treatment minutes<input aria-label={`Default minutes ${player.id}`} type="number" min="1" max="120" step="1" value={player.treatmentMinutes} onChange={e=>update(player.id,row=>{row.treatmentMinutes=Number(e.target.value);})}/></label></div>
      <div className="two-fields"><label>Primary clinician<input aria-label={`Primary clinician ${player.id}`} list="roster-clinicians" value={player.clinician} onChange={e=>update(player.id,row=>{row.clinician=e.target.value;})}/></label><label>Secondary clinician<input aria-label={`Secondary clinician ${player.id}`} list="roster-clinicians" value={player.secondary} onChange={e=>update(player.id,row=>{row.secondary=e.target.value;})}/></label></div>
      <label>Aliases (comma separated)<input defaultValue={player.aliases.join(', ')} onBlur={e=>update(player.id,row=>{row.aliases=e.target.value.split(',').map(alias=>alias.trim()).filter(Boolean);})}/></label>
      <button className="danger" aria-label={`Unassign ${player.name}`} onClick={()=>update(player.id,row=>Object.assign(row,movePlayerToTeam(row,'unassigned')))}>Move to Unassigned</button>
      </div></details>
    </div>)}
    <datalist id="roster-clinicians">{[...clinicians,'Gordon'].map(name=><option key={name} value={name}/>)}</datalist>
    <button className="wide-button" onClick={()=>{const id=crypto.randomUUID();setPlayers(current=>[...current,{id,name:'',short:'',aliases:[],clinician:'',secondary:'',treatmentMinutes:15,active:selectedTeam==='clippers',team:selectedTeam}]);setExpandedIds(current=>[...current,id]);setMessage('');}}>+ Add player to {teamLabels[selectedTeam]}</button>
    <button className="primary wide-button" onClick={save}>Save roster & teams</button>
    {message&&<p role="status" className={failed?'export-error':'field-help'}>{message}</p>}
  </div></section>;
}
