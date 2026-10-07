import { useState } from 'react';
import { roster, saveRoster, validateRoster, type RosterEntry } from '../config/roster';
import { clinicians } from '../config/clinicians';

export function RosterSettings({onSave}:{onSave:()=>void}) {
  const [players,setPlayers]=useState(()=>structuredClone(roster.filter(player=>player.active)));
  const [message,setMessage]=useState('');
  const [failed,setFailed]=useState(false);
  const update=(id:string,change:(player:RosterEntry)=>void):void=>{
    setPlayers(current=>current.map(player=>{if(player.id!==id)return player;const copy=structuredClone(player);change(copy);return copy;}));
    setMessage('');
  };
  const save=():void=>{
    const removed=roster.filter(player=>!players.some(row=>row.id===player.id)).map(player=>({...player,active:false}));
    const combined=[...removed,...players.map(player=>({...player,name:player.name.trim(),short:player.short.trim()||player.name.trim().split(' ')[0]}))];
    const issues=validateRoster(combined);
    if(issues.length){setFailed(true);setMessage(issues.join(' '));return;}
    try {saveRoster(combined);setPlayers(structuredClone(roster.filter(player=>player.active)));onSave();setFailed(false);setMessage('Saved in this browser. Parse your message again to apply settings to a schedule.');}
    catch(error){setFailed(true);setMessage(error instanceof Error?error.message:'Settings could not be saved.');}
  };
  return <details className="metadata-editor roster-settings"><summary>Roster & treatment defaults <small>Add players · primary / secondary · minutes</small></summary><div className="group-content">
    <p className="field-help">Season settings, saved on this browser. Remove takes a player off the active roster; it does not delete them from an existing schedule. Reparse after saving. Normal default: 15 minutes; Rui, Darius and Brandon Ingram: 30.</p>
    {players.map(player=><fieldset key={player.id} className="roster-player"><legend>{player.name||'New player'}</legend>
      <label>Player name<input aria-label={`Roster name ${player.id}`} value={player.name} onChange={e=>update(player.id,row=>{row.name=e.target.value;})}/></label>
      <div className="two-fields"><label>Graphic short name<input value={player.short} onChange={e=>update(player.id,row=>{row.short=e.target.value;})}/></label><label>Default minutes<input aria-label={`Default minutes ${player.id}`} type="number" min="1" max="120" step="1" value={player.treatmentMinutes} onChange={e=>update(player.id,row=>{row.treatmentMinutes=Number(e.target.value);})}/></label></div>
      <div className="two-fields"><label>Primary clinician<select aria-label={`Primary clinician ${player.id}`} value={player.clinician} onChange={e=>update(player.id,row=>{row.clinician=e.target.value;})}><option value="">Select clinician</option>{clinicians.map(name=><option key={name}>{name}</option>)}</select></label>
      <label>Secondary clinician<select aria-label={`Secondary clinician ${player.id}`} value={player.secondary} onChange={e=>update(player.id,row=>{row.secondary=e.target.value;})}><option value="">Shared backups</option>{clinicians.map(name=><option key={name} disabled={name===player.clinician}>{name}</option>)}</select></label></div>
      <label>Aliases (comma separated)<input defaultValue={player.aliases.join(', ')} onBlur={e=>update(player.id,row=>{row.aliases=e.target.value.split(',').map(alias=>alias.trim()).filter(Boolean);})}/></label>
      <button className="danger" aria-label={`Remove roster player ${player.name}`} onClick={()=>{setPlayers(current=>current.filter(row=>row.id!==player.id));setMessage('');}}>Remove player</button>
    </fieldset>)}
    <button className="wide-button" onClick={()=>{setPlayers(current=>[...current,{id:crypto.randomUUID(),name:'',short:'',aliases:[],clinician:'',secondary:'',treatmentMinutes:15,active:true}]);setMessage('');}}>+ Add roster player</button>
    <label>Restore removed / historical player<select aria-label="Restore roster player" value="" onChange={e=>{const player=roster.find(row=>row.id===e.target.value);if(player)setPlayers(current=>[...current,{...structuredClone(player),active:true}]);setMessage('');}}><option value="">Choose player</option>{roster.filter(player=>!players.some(row=>row.id===player.id)).map(player=><option key={player.id} value={player.id}>{player.name}</option>)}</select></label>
    <button className="primary wide-button" onClick={save}>Save roster settings</button>
    {message&&<p role="status" className={failed?'export-error':'field-help'}>{message}</p>}
    <p className="field-help">Chosen secondary is tried before shared backups: Colby → Dan → Jasen. Full treatment duration is preserved. Clinicians are assigned only through a reviewed plan.</p>
  </div></details>;
}
