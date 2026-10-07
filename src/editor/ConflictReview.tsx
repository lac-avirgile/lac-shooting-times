import { useState } from 'react';
import type { Group, Schedule, Diagnostic } from '../domain/models';
import { formatTime } from '../domain/time';
import { validateSchedule } from '../validation/validateSchedule';
import { treatmentOptions, applyTreatmentOption } from '../scheduler/conflictOptions';
import { treatmentMinutes } from '../scheduler/treatmentPlanner';
import type { EditSchedule } from './GroupEditor';
import { clinicians } from '../config/clinicians';
import { quickResolutions } from '../scheduler/quickResolutions';

const conflictCodes=new Set(['clinician-conflict','possible-clinician-overlap','player-conflict','treatment-during-court','treatment-during-performance','treatment-during-walkthrough','treatment-during-meeting','table-after-performance','performance-after-court','court-overlap','court-during-walkthrough','treatment-duration-mismatch','treatment-plan-required']);
function PlayerOptions({schedule,group,index,edit}:{schedule:Schedule;group:Group;index:number;edit:EditSchedule}) {
  const athlete=group.athletes[index],normal=treatmentMinutes(athlete);
  const [shorter,setShorter]=useState(15);
  const [preview,setPreview]=useState<number|null>(null);
  const [error,setError]=useState('');
  const [selectedClinician,setSelectedClinician]=useState('');
  const options=treatmentOptions(schedule,group.id,index,preview??normal,selectedClinician||undefined);
  const quick=quickResolutions(schedule,group.id,index);
  const accept=(option:typeof options[number])=>{try{edit(draft=>applyTreatmentOption(draft,group.id,index,option));setPreview(null);setError('');}catch(problem){setError(problem instanceof Error?problem.message:'Could not apply option.');}};
  return <div className="resolution-player"><strong>{athlete.name} · {athlete.clinician.value||'Clinician needed'} · {normal} min</strong>
    <p className="field-help">Choose a quick resolution. Nothing changes until you click; workout and court times stay fixed.</p>
    <div className="slot-options quick-resolutions">{quick.map(choice=><button key={choice.kind} onClick={()=>accept(choice.option)}><strong>{choice.label}</strong><span>{formatTime(choice.option.start)}–{formatTime(choice.option.end)}</span><small>{choice.option.distance===0?'Same start':`${choice.option.distance} min from current start`}{choice.option.estimated?' · other occupancy estimated':''}</small></button>)}</div>
    {!quick.length&&<p className="field-help">No safe quick treatment resolution found. Review the missing values or edit manually below.</p>}
    <details className="more-resolution-options"><summary>More available slots / custom duration</summary>
    <label>Resolve using clinician<select aria-label={`Resolution clinician for ${athlete.name}`} value={selectedClinician} onChange={e=>setSelectedClinician(e.target.value)}><option value="">Primary / backups</option>{clinicians.map(name=><option key={name} value={name}>{name}{name===athlete.clinician.value?' (current)':''}</option>)}</select></label>
    <div className="slot-options">{options.map(option=><button key={`${option.start}-${option.clinician}`} onClick={()=>{try{edit(draft=>applyTreatmentOption(draft,group.id,index,option));setPreview(null);setError('');}catch(problem){setError(problem instanceof Error?problem.message:'Could not apply option.');}}}><span>{formatTime(option.start)}–{formatTime(option.end)} · {option.clinician}</span><small>{option.duration} min · {option.distance===0?'same start':`${option.distance} min from current start`}{option.estimated?' · other occupancy estimated':''}</small></button>)}</div>
    {!options.length&&<p className="field-help">No safe option found within ±120 minutes. Resolve missing times, edit the assignment, or preview a shorter duration.</p>}
    <div className="two-fields"><label>Shorter duration (minutes)<input aria-label={`Shorter treatment for ${athlete.name}`} type="number" min="1" max={Math.max(1,normal-1)} value={shorter} onChange={e=>setShorter(Number(e.target.value))}/></label><button disabled={!Number.isInteger(shorter)||shorter<1||shorter>=normal} onClick={()=>setPreview(shorter)}>Preview shorter options</button></div>
    {preview!==null&&<p className="shortening-notice">Reviewing {preview}-minute options. Nothing changes until you choose a slot. <button onClick={()=>setPreview(null)}>Keep full duration</button></p>}
    </details>
    <button className="manual-resolution" onClick={()=>{const editor=document.getElementById(group.id);if(editor instanceof HTMLDetailsElement){editor.open=true;editor.scrollIntoView({behavior:'smooth',block:'start'});editor.querySelector('input')?.focus({preventScroll:true});}}}>Edit manually</button>
    {error&&<p role="alert">{error}</p>}
  </div>;
}
export function ConflictReview({schedule,edit}:{schedule:Schedule;edit:EditSchedule}) {
  const issues=validateSchedule(schedule).filter(issue=>conflictCodes.has(issue.code));
  if(!issues.length)return null;
  const groups=new Map<string,Diagnostic[]>();
  for(const issue of issues){const key=issue.groupId??'game';groups.set(key,[...(groups.get(key)??[]),issue]);}
  return <details className="metadata-editor conflict-review" open><summary>Timing & clinician conflicts <small>{issues.filter(issue=>issue.severity==='error').length} confirmed · {issues.filter(issue=>issue.severity==='warning').length} possible</small></summary><div className="group-content">
    <p className="field-help">Confirmed overlaps block export. Group TABLE windows are only possible overlaps until individual appointments are recorded. Options conservatively reserve other displayed windows when actual occupancy is unknown.</p>
    {[...groups].map(([id,messages])=>{const group=schedule.groups.find(item=>item.id===id);return <section className="conflict-card" key={id}><h3>{group?group.athletes.map(athlete=>athlete.name).join(' + '):'Game schedule'}</h3><ul>{messages.map((issue,index)=><li key={index} className={`issue-${issue.severity}`}><span className="severity">{issue.severity==='error'?'Confirmed':'Review'}</span> {issue.message}</li>)}</ul>{group&&group.athletes.map((athlete,index)=><PlayerOptions key={`${id}-${athlete.id}-${index}`} schedule={schedule} group={group} index={index} edit={edit}/>)}</section>;})}
  </div></details>;
}
