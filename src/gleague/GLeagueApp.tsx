import { useMemo, useRef, useState } from 'react';
import { playersOnTeam, type RosterEntry } from '../config/roster';
import { RosterSettings } from '../editor/RosterSettings';
import { formatTime, today } from '../domain/time';
import { renderPng } from '../graphic/exportPng';
import { buildGLeaguePlan, parseClock } from './schedule';

const emptyPair=():[string,string]=>['',''];
const clock=(value:string):number=>value?parseClock(value):NaN;
const label=(start:number,end:number):string=>Number.isFinite(start)&&Number.isFinite(end)?`${formatTime(start)} – ${formatTime(end)}`:'Time needed';

function GLeagueGraphic({plan,date,tip,roster}:{plan:ReturnType<typeof buildGLeaguePlan>;date:string;tip:number;roster:RosterEntry[]}) {
  const top=220,rowHeight=108;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" className="pregame-graphic" role="img" aria-label="G League shooting and treatment schedule">
    <rect width="1920" height="1080" fill="#f7f9fc"/>
    <rect width="1920" height="174" fill="#071a34"/><rect y="174" width="1920" height="10" fill="#c8102e"/>
    <text x="70" y="83" fill="white" fontFamily="Roboto Condensed,Arial,sans-serif" fontWeight="700" fontSize="58">G LEAGUE SHOOTING TIMES</text>
    <text x="72" y="140" fill="#cbd8e7" fontFamily="Roboto,Arial,sans-serif" fontSize="27">{date}  ·  TIP {Number.isFinite(tip)?formatTime(tip):'TIME NEEDED'}  ·  COURT {label(plan.slots[0]?.start??0,plan.end)}</text>
    <text x="72" y={top} fill="#344b69" fontFamily="Roboto Condensed,Arial,sans-serif" fontWeight="700" fontSize="24">SLOT / SHOOTING</text>
    <text x="550" y={top} fill="#344b69" fontFamily="Roboto Condensed,Arial,sans-serif" fontWeight="700" fontSize="24">PLAYERS</text>
    <text x="1035" y={top} fill="#344b69" fontFamily="Roboto Condensed,Arial,sans-serif" fontWeight="700" fontSize="24">TREATMENT</text>
    <text x="1530" y={top} fill="#344b69" fontFamily="Roboto Condensed,Arial,sans-serif" fontWeight="700" fontSize="24">OFF-COURT WARMUP</text>
    {plan.slots.map((slot,index)=>{
      const y=270+index*rowHeight;
      return <g key={slot.index}>
        <rect x="55" y={y-24} width="1810" height="100" rx="12" fill={index%2?'#edf2f8':'#ffffff'} stroke="#d6dfe9"/>
        <rect x="55" y={y-24} width="10" height="100" fill="#c8102e"/>
        <text x="83" y={y+13} fill="#071a34" fontFamily="Roboto Condensed,Arial,sans-serif" fontSize="28" fontWeight="700">{slot.index}. {label(slot.start,slot.end)}</text>
        {([0,1] as const).map(side=>{
          const player=slot.players.find(row=>row.id===slot.ids[side]);
          const id=roster.find(row=>row.id===slot.ids[side])?.short??player?.name??'Player needed';
          return <g key={side}>
            <text x="550" y={y+8+side*36} fill="#122b4b" fontFamily="Roboto,Arial,sans-serif" fontSize="25" fontWeight="700">{id}</text>
            <text x="1035" y={y+8+side*36} fill="#a20d25" fontFamily="Roboto,Arial,sans-serif" fontSize="23">{player?`${label(player.treatmentStart,player.treatmentEnd)} · ${player.clinician||'Clinician needed'}`:'—'}</text>
            <text x="1530" y={y+8+side*36} fill="#122b4b" fontFamily="Roboto,Arial,sans-serif" fontSize="23">{player?label(player.warmupStart,player.warmupEnd):'—'}</text>
          </g>;
        })}
      </g>;
    })}
    <text x="70" y="1050" fill="#5c6e84" fontFamily="Roboto,Arial,sans-serif" fontSize="21">Review clinician availability and all times before sharing.</text>
  </svg>;
}

export function GLeagueApp({settingsWarning}:{settingsWarning:string|null}) {
  const [rosterVersion,setRosterVersion]=useState(0);
  const [date,setDate]=useState(today());
  const [start,setStart]=useState('');
  const [tip,setTip]=useState('');
  const [totalMinutes,setTotalMinutes]=useState(60);
  const [pairs,setPairs]=useState<[string,string][]>(()=>Array.from({length:4},emptyPair));
  const [treatmentMinutes,setTreatmentMinutes]=useState<Record<string,number>>({});
  const [exportError,setExportError]=useState('');
  const [exporting,setExporting]=useState(false);
  const svgRef=useRef<SVGSVGElement>(null);
  const available=useMemo(()=>playersOnTeam('g-league'),[rosterVersion]);
  const plan=useMemo(()=>buildGLeaguePlan({start:clock(start),tip:clock(tip),totalMinutes,pairs,treatmentMinutes},available),[start,tip,totalMinutes,pairs,treatmentMinutes,available]);
  const updatePair=(index:number,side:0|1,id:string):void=>setPairs(current=>current.map((pair,i)=>i===index?pair.map((entry,j)=>j===side?id:entry) as [string,string]:pair));
  const download=async():Promise<void>=>{
    if(!svgRef.current||plan.issues.length)return;
    setExporting(true);setExportError('');
    try {
      const blob=await renderPng(svgRef.current);
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=`${date}_g-league_shooting-times.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
    } catch(error){setExportError(error instanceof Error?error.message:'PNG export failed.');}
    finally{setExporting(false);}
  };
  return <div className="app-shell">
    <header className="app-header"><div><h1>G League shooting times</h1><p>Pair players · set the court window · review treatment and warmup</p></div><span className="local-label">Roster saved in this browser</span></header>
    <main><aside className="input-panel">
      <h2>Game setup</h2><p className="field-help">Enter the first shooting time, game tip, and total minutes available for shooting. The app divides that window across 4–7 consecutive two-player slots.</p>
      <label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <div className="two-fields"><label>First shooting time<input aria-label="First shooting time" type="time" value={start} onChange={e=>setStart(e.target.value)}/></label><label>Game tip<input aria-label="Game tip" type="time" value={tip} onChange={e=>setTip(e.target.value)}/></label></div>
      <label>Total court minutes<input aria-label="Total court minutes" type="number" min="4" max="180" step="1" value={totalMinutes} onChange={e=>setTotalMinutes(Number(e.target.value))}/></label>
      <RosterSettings initialTeam="g-league" onSave={()=>setRosterVersion(value=>value+1)}/>
      {settingsWarning&&<p role="alert" className="export-error">{settingsWarning}</p>}
      <div className="editor-heading"><h2>Shooting pairs</h2><span>{pairs.length} slots</span></div>
      {pairs.map((pair,index)=><fieldset key={index} className="gleague-pair"><legend>Slot {index+1} · {Number.isFinite(plan.slots[index]?.start)?label(plan.slots[index].start,plan.slots[index].end):'Set game times'}</legend>
        {([0,1] as const).map(side=>{
          const player=available.find(row=>row.id===pair[side]);
          return <div className="two-fields" key={side}><label>Player {side+1}<select aria-label={`Slot ${index+1} player ${side+1}`} value={pair[side]} onChange={e=>updatePair(index,side,e.target.value)}><option value="">Choose G League player</option>{available.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label>Treatment minutes<input aria-label={`Slot ${index+1} player ${side+1} treatment minutes`} type="number" min="1" max="120" step="1" disabled={!player} value={player?(treatmentMinutes[player.id]??player.treatmentMinutes):15} onChange={e=>player&&setTreatmentMinutes(current=>({...current,[player.id]:Number(e.target.value)}))}/></label></div>;
        })}
        <button className="danger" disabled={pairs.length<=4} onClick={()=>setPairs(current=>current.filter((_,i)=>i!==index))}>Remove slot</button>
      </fieldset>)}
      <button className="wide-button" disabled={pairs.length>=7} onClick={()=>setPairs(current=>[...current,emptyPair()])}>+ Add shooting slot</button>
    </aside><section className="preview-panel">
      <div className="preview-toolbar"><div><h2>G League schedule preview</h2><p>Each player gets treatment, then a 15-minute off-court warmup immediately before shooting.</p></div><button className="primary" disabled={plan.issues.length>0||exporting} onClick={()=>void download()}>{exporting?'Rendering PNG…':'Download PNG'}</button></div>
      <div className="graphic-frame"><div ref={node=>{svgRef.current=node?.querySelector('svg')??null;}}><GLeagueGraphic plan={plan} date={date} tip={clock(tip)} roster={available}/></div></div>
      {plan.issues.length>0&&<div className="diagnostics has-errors"><div className="group-content"><strong>Complete before download</strong><ul>{plan.issues.map(issue=><li key={issue}>{issue}</li>)}</ul></div></div>}
      {exportError&&<p role="alert" className="export-error">{exportError}</p>}
    </section></main>
    <footer>G League schedule · Review all player and clinician assignments before sharing.</footer>
  </div>;
}
