import { opponents, homeVenue } from '../config/opponents';
import { opponentLogo } from '../config/graphicAssets';
import { emptyRange, field } from '../domain/models';
import type { Schedule } from '../domain/models';
import { GroupEditor } from './GroupEditor';
import type { EditSchedule } from './GroupEditor';
import { FieldControl, fromInputTime } from './FieldControl';
import { TreatmentPlanner } from './TreatmentPlanner';
import { ConflictReview } from './ConflictReview';

export function ScheduleEditor({ schedule, edit }: { schedule: Schedule; edit: EditSchedule }) {
  const setVenue = (draft: Schedule,force=false): void => {
    const venue = draft.game.homeAway.value === 'home' ? homeVenue : opponents.find(o => o.id === draft.game.opponentId);
    if (force||draft.game.venue.origin !== 'override') draft.game.venue = field(venue?.venue ?? null, 'inferred', 'opponent-venue-config');
    if (force||draft.game.city.origin !== 'override') draft.game.city = field(venue?.city ?? null, 'inferred', 'opponent-city-config');
  };
  return <div className="schedule-editor">
    <details className="metadata-editor" id="game" open><summary>Game setup <small>{schedule.game.date} · {schedule.game.homeAway.value === 'away' ? 'Away' : schedule.game.homeAway.value === 'home' ? 'Home' : 'Choose home / away'}</small></summary><div className="group-content">
      <div className="two-fields"><label>Date<input type="date" value={schedule.game.date} onChange={e => edit(d => { d.game.date = e.target.value; })} /></label><label>Game number (optional)<input value={schedule.game.number} onChange={e => edit(d => { d.game.number = e.target.value; })} /></label></div>
      <label>Game header label<input value={schedule.game.label??''} placeholder="e.g. PRESEASON GAME 1" onChange={e=>edit(d=>{d.game.label=e.target.value;})}/></label>
      <div className="two-fields"><label>Opponent<select value={schedule.game.opponentId ?? ''} onChange={e => edit(d => { const opponent = opponents.find(o => o.id === e.target.value); d.game.opponentId = opponent?.id ?? null; d.game.opponent = field(opponent?.name ?? null, 'override', 'User opponent edit'); setVenue(d); })}><option value="">Select opponent</option>{opponents.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
      <label>Home / away<select value={schedule.game.homeAway.value ?? ''} onChange={e => edit(d => { d.game.homeAway = field(e.target.value as 'home' | 'away', 'override', 'User home/away edit'); setVenue(d); })}><option value="">Select</option><option value="home">Home (vs)</option><option value="away">Away (at)</option></select></label></div>
      {schedule.game.opponentId&&<div className="opponent-card"><img src={opponentLogo(schedule.game.opponentId)} width="54" height="54" alt=""/><span>{schedule.game.homeAway.value==='away'?'At':'Vs.'} {schedule.game.opponent.value}</span></div>}
      <p className="field-help">Suggested arena for the selected home or away team. Special-event games may use another location.</p>
      {Boolean(schedule.game.unavailableClinicians?.length)&&<p className="field-help">Unavailable clinician{schedule.game.unavailableClinicians!.length===1?'':'s'} for this game: {schedule.game.unavailableClinicians!.join(', ')}.</p>}
      <FieldControl label="Tip" type="time" value={schedule.game.tip} onChange={v => edit(d => { d.game.tip = field(fromInputTime(v), 'override', 'User tip edit'); if (d.game.tip.value !== null && d.meeting.clock.value !== null && d.meeting.time.origin !== 'override') d.meeting.time = field(d.game.tip.value - d.meeting.clock.value, 'inferred', 'meeting-relative-to-tip'); })} />
      <FieldControl label="Opponent display name" value={schedule.game.opponent} onChange={v => edit(d => { d.game.opponent = field(v || null, 'override', 'User opponent display'); })} />
      <FieldControl label="Venue" value={schedule.game.venue} onChange={v => edit(d => { d.game.venue = field(v || null, 'override', 'User venue'); })} />
      <FieldControl label="City / state" value={schedule.game.city} onChange={v => edit(d => { d.game.city = field(v || null, 'override', 'User city'); })} />
      <button type="button" onClick={()=>edit(d=>setVenue(d,true))} disabled={!schedule.game.homeAway.value}>Use suggested location</button>
      <label className="check-label"><input type="checkbox" checked={schedule.game.draft} onChange={e => edit(d => { d.game.draft = e.target.checked; })} />Draft message (editor only)</label>
    </div></details>
    <p className="editor-legend">◌ Inferred · amber fields need review · edits take priority</p>
    <ConflictReview schedule={schedule} edit={edit}/>
    <TreatmentPlanner schedule={schedule} edit={edit} />
    {schedule.groups.map((group, index) => <GroupEditor key={group.id} group={group} index={index} total={schedule.groups.length} edit={edit} />)}
    <button className="wide-button" onClick={() => edit(d => { d.groups.push({ id: crypto.randomUUID(), kind: 'normal', athletes: [], table: emptyRange('Enter TABLE times'), performance: emptyRange('Enter PERFORMANCE times'), court: emptyRange('Enter COURT times'), clock: field<number>(null, 'override', 'User group'), location: 'main', walkthroughState: 'none', notes: '' }); })}>+ Add group</button>
    <details className="metadata-editor"><summary>Walkthrough & meeting</summary><div className="group-content">
      {schedule.walkthroughs.map(walk => <fieldset key={walk.id}><legend>Walkthrough</legend><label>Label<input value={walk.label} onChange={e => edit(d => { const w = d.walkthroughs.find(w => w.id === walk.id); if (w) w.label = e.target.value; })} /></label><div className="two-fields">
        <FieldControl label="Walkthrough start" type="time" value={walk.range.start} onChange={v => edit(d => { const w = d.walkthroughs.find(w => w.id === walk.id); if (w) w.range.start = field(fromInputTime(v), 'override', 'User walkthrough'); })} />
        <FieldControl label="Walkthrough end" type="time" value={walk.range.end} onChange={v => edit(d => { const w = d.walkthroughs.find(w => w.id === walk.id); if (w) w.range.end = field(fromInputTime(v), 'override', 'User walkthrough'); })} />
      </div><button className="danger" onClick={() => edit(d => { d.walkthroughs = d.walkthroughs.filter(w => w.id !== walk.id); })}>Delete walkthrough</button></fieldset>)}
      <button onClick={() => edit(d => { d.walkthroughs.push({ id: crypto.randomUUID(), label: 'TEAM WALKTHROUGH', range: emptyRange('Enter walkthrough times') }); })}>+ Add walkthrough</button>
      <label className="check-label"><input type="checkbox" checked={schedule.meeting.enabled} onChange={e => edit(d => { d.meeting.enabled = e.target.checked;if(!e.target.checked)d.meeting.time.source='User disabled meeting';else if(d.meeting.time.source==='User disabled meeting')d.meeting.time.source='User enabled meeting'; })} />Team meeting</label>
      {schedule.meeting.enabled && <div className="two-fields">
        <FieldControl label="Meeting clock" type="number" value={schedule.meeting.clock} onChange={v => edit(d => { const clock = v ? Number(v) : null; d.meeting.clock = field(clock, 'override', 'User meeting clock'); d.meeting.time = field(clock !== null && d.game.tip.value !== null ? d.game.tip.value - clock : null, 'inferred', 'meeting-relative-to-tip'); })} />
        <FieldControl label="Meeting time" type="time" value={schedule.meeting.time} onChange={v => edit(d => { d.meeting.time = field(fromInputTime(v), 'override', 'User meeting time'); })} />
      </div>}
    </div></details>
  </div>;
}
