import { useEffect, useMemo, useRef, useState } from 'react';
import { parseSchedule } from './parser/deterministicParser';
import { resolveSchedule } from './scheduler/scheduleEngine';
import { validateSchedule } from './validation/validateSchedule';
import { adaptiveOriginalLayout } from './graphic/layout';
import { adaptiveDesign } from './graphic/adaptiveDesign';
import { PregameGraphic } from './graphic/PregameGraphic';
import { downloadPng } from './graphic/exportPng';
import { ScheduleEditor } from './editor/ScheduleEditor';
import { RosterSettings } from './editor/RosterSettings';
import { loadRoster } from './config/roster';
import { prepareTreatments, type PreparationResult } from './scheduler/prepareTreatments';
import {syncIndividualTreatments} from './scheduler/individualTreatments';
import {syncMeeting} from './scheduler/meetingRule';
import { DiagnosticsPanel } from './editor/DiagnosticsPanel';
import { currentRosterExample, samples } from './fixtures/samples';
import { hawaiiGame } from './fixtures/hawaii';
import {applyGameContext,type DailyGameContext} from './scheduler/gameContext';
import type { Schedule } from './domain/models';
import { templates, exportPresets, templateFor, type TemplateId, type ExportPresetId } from './config/templates';

export default function App() {
  const [settingsWarning]=useState(()=>loadRoster());
  const [settingsChanged,setSettingsChanged]=useState(false);
  const [preparation,setPreparation]=useState<PreparationResult|null>(null);
  const [raw, setRaw] = useState('');
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [template, setTemplate] = useState<TemplateId>('reference-4');
  const [exportPreset, setExportPreset] = useState<ExportPresetId>('standard');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [previous, setPrevious] = useState<Schedule | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    void Promise.all([... [400,700,900].map(weight => document.fonts.load(`${weight} 20px Roboto`)),document.fonts.load('400 20px "Bebas Neue"'), ...[400,700].map(weight=>document.fonts.load(`${weight} 20px "Roboto Condensed"`))])
      .then(() => document.fonts.ready).then(() => setFontReady(true));
  }, []);
  const layout = useMemo(() => schedule ? adaptiveOriginalLayout(schedule) : null, [schedule, fontReady]);
  const scene = useMemo(() => schedule && template!=='reference'?adaptiveDesign(schedule,template):null, [schedule, template, fontReady]);
  const diagnostics = useMemo(() => schedule && layout ? [...validateSchedule(schedule), ...(scene?.diagnostics??layout.diagnostics)] : [], [schedule, layout, scene]);
  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const edit = (mutate: (draft: Schedule) => void): void => {
    if (!schedule) return;
    const copy = structuredClone(schedule); mutate(copy); syncMeeting(copy); syncIndividualTreatments(copy); setPrevious(schedule); setSchedule(copy); setDirty(true); setPreparation(null); setExportError('');
  };
  const parse = (text = raw, gameContext?: DailyGameContext): void => {
    if (dirty && !window.confirm('Parsing again replaces your structured edits. Continue?')) return;
    const normalize=(value:string)=>value.trim().replace(/\s+/g,' ').toLowerCase();
    const context=gameContext??(normalize(text)===normalize(hawaiiGame.text)?hawaiiGame:undefined);
    const resolved = resolveSchedule(parseSchedule(text), context?.date);
    if(context)applyGameContext(resolved,context);
    setPreparation(prepareTreatments(resolved));
    setPrevious(schedule); setSchedule(resolved); setRaw(text); setDirty(false); setSettingsChanged(false); setExportError('');
  };
  const download = async (): Promise<void> => {
    if (!svgRef.current || !schedule || errorCount || settingsChanged) return;
    setExporting(true); setExportError('');
    try { await downloadPng(svgRef.current, schedule, exportPreset); }
    catch (error) { setExportError(error instanceof Error ? error.message : 'Export failed. Please try again.'); }
    finally { setExporting(false); }
  };
  return <div className="app-shell">
    <header className="app-header"><img src="/assets/clippers.png" width="40" height="40" alt="Clippers" /><div><h1>Pregame workout times</h1><p>Basketball operations · Local graphic studio</p></div><span className="local-label">Your text stays in this browser</span></header>
    <main>
      <aside className="input-panel" inert={exporting}>
        <label className="raw-label" htmlFor="raw-text">Daily shooting-times message</label>
        <textarea id="raw-text" value={raw} onChange={e => setRaw(e.target.value)} placeholder="Paste the daily shooting-times text here…" spellCheck={false} />
        <button className="primary wide-button" onClick={() => parse()} disabled={!raw.trim()}>Parse Schedule</button>
        <button className="wide-button" onClick={() => parse(hawaiiGame.text, hawaiiGame)}>Load Oct 4 Hawaii game</button>
        <RosterSettings onSave={()=>{setSettingsChanged(Boolean(schedule));setDirty(Boolean(schedule));}} />
        {settingsWarning&&<p role="alert" className="export-error">{settingsWarning}</p>}
        {settingsChanged&&<p role="alert" className="export-error">Roster settings changed. Click Parse Schedule again to apply them before export. Existing edits have not been replaced.</p>}
        <div className="sample-picker"><label>Examples<select aria-label="Load sample" value="" onChange={e => { const sample = e.target.value === 'current' ? currentRosterExample : samples[Number(e.target.value)]; if (sample) parse(sample.text); }}><option value="">Choose example…</option><option value="current">Current roster · illustrative times</option>{samples.map((s, i) => <option key={s.name} value={i}>Historical {i + 1}. {s.name}</option>)}</select></label><p className="field-help">Example times are for demonstration. Historical off-roster names have no current clinician assignment.</p></div>
        {schedule && <><div className="editor-heading"><h2>Review & edit</h2><button disabled={!previous} onClick={() => { if (previous) { setSchedule(previous); setPrevious(null); setDirty(true); } }}>Undo</button></div><ScheduleEditor schedule={schedule} edit={edit} /></>}
      </aside>
      <section className="preview-panel">
        <div className="preview-toolbar"><div><h2>Graphic preview</h2><p>{schedule ? 'Changes appear immediately.' : 'Paste a message or load a sample to begin.'}</p></div><div className="export-controls"><label>PNG quality<select aria-label="PNG quality" disabled={exporting} value={exportPreset} onChange={e => setExportPreset(e.target.value as ExportPresetId)}>{exportPresets.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label><button className="primary" disabled={!schedule || errorCount > 0 || exporting || !fontReady || settingsChanged} onClick={() => void download()}>{exporting ? 'Rendering PNG…' : 'Download PNG'}</button></div></div>
        <div className="template-picker" role="group" aria-label="Graphic design">{templates.map(option => <button key={option.id} className={`template-choice ${template === option.id ? 'selected' : ''}`} disabled={exporting} aria-pressed={template === option.id} onClick={() => setTemplate(option.id)}><span className={`template-swatch swatch-${option.id}`} aria-hidden="true" /><span>{option.name}</span></button>)}</div>
        <p className="design-caption">{templateFor(template).description} All PNGs are lossless, with 300-DPI print metadata.</p>
        {scene&&(scene.width??1920)>1920&&<p className="field-help">Automatically sized to fit all content: {scene.width} × {scene.height}, still 16:9. No players, times or notes were removed.</p>}
        {preparation&&<div className="treatment-preparation" role="status"><strong>{preparation.applied?'Normal treatment appointments prepared without clinician overlaps.':'Treatment choices need your approval; no clinician or time changes were applied.'}</strong>{preparation.changes.length>0&&<><p>Available proposals—not applied:</p><ul>{preparation.changes.map(change=><li key={change}>{change}</li>)}</ul><p>Use Timing & clinician conflicts to choose a backup, keep your clinician and move the slot, or preview a shorter duration.</p></>}{preparation.issues.length>0&&<ul>{preparation.issues.map(issue=><li key={issue}>{issue}</li>)}</ul>}<p className="field-help">Full treatment durations are preserved unless you explicitly accept a shorter option.</p></div>}
        {schedule && layout ? <><div className="graphic-frame"><PregameGraphic ref={svgRef} schedule={schedule} layout={layout} scene={scene} /></div><DiagnosticsPanel diagnostics={diagnostics} />{errorCount > 0 && <p className="export-hint">Complete the highlighted fields before downloading. Red “NEEDED” labels appear only in this review preview.</p>}{schedule.game.draft && <p className="draft-note">Input is marked Draft. Review before sharing.</p>}</> : <div className="empty-preview"><img src="/assets/clippers.png" width="110" height="110" alt="" /><p>Your finished workout graphic will appear here.</p><button onClick={() => parse(currentRosterExample.text)}>Preview current roster example</button></div>}
        {exportError && <p role="alert" className="export-error">{exportError}</p>}
      </section>
    </main>
    <footer>Internal use · TABLE clinicians come from season configuration, independently of workout staff.</footer>
  </div>;
}
