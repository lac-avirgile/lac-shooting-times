import { activeRoster, clinicians, findAthlete } from '../config/roster';
import { emptyRange, field } from '../domain/models';
import type { Group, Schedule } from '../domain/models';
import { formatTime } from '../domain/time';
import { FieldControl, fromInputTime } from './FieldControl';
import { treatmentMinutes } from '../scheduler/treatmentPlanner';
import {editTreatmentDuration} from '../scheduler/individualTreatments';

export type EditSchedule = (mutate: (draft: Schedule) => void) => void;
export function GroupEditor({ group, index, total, edit }: { group: Group; index: number; total: number; edit: EditSchedule }) {
  const update = (change: (group: Group) => void): void => edit(draft => { const found = draft.groups.find(g => g.id === group.id); if (found) change(found); });
  const needsReview = [group.table, group.performance, group.court].some(range => range.applicable && (range.start.value === null || range.end.value === null));
  return <details className={`group-editor ${needsReview ? 'review-group' : ''}`} id={group.id} open={needsReview}>
    <summary><span className="group-number">#{index + 1}</span><span>{group.athletes.map(a => a.name).join(' + ') || 'New group'}<small>COURT {formatTime(group.court.start.value)} – {formatTime(group.court.end.value)}{needsReview ? ' · REVIEW' : ''}</small></span></summary>
    <div className="group-content">
      <div className="group-actions">
        <button disabled={index === 0} onClick={() => edit(draft => { [draft.groups[index - 1], draft.groups[index]] = [draft.groups[index], draft.groups[index - 1]]; })} aria-label={`Move group ${index + 1} up`}>↑</button>
        <button disabled={index === total - 1} onClick={() => edit(draft => { [draft.groups[index + 1], draft.groups[index]] = [draft.groups[index], draft.groups[index + 1]]; })} aria-label={`Move group ${index + 1} down`}>↓</button>
        <button className="danger" onClick={() => edit(draft => { draft.groups = draft.groups.filter(g => g.id !== group.id); })}>Delete group</button>
      </div>
      <label>Group type<select value={group.kind} onChange={e => update(g => { g.kind = e.target.value as Group['kind']; })}>
        <option value="normal">Normal players</option><option value="pd">PD group</option><option value="stay-ready">Stay Ready</option><option value="custom">Custom</option>
      </select></label>
      {group.athletes.map((athlete, athleteIndex) => <div className="athlete-editor" key={athleteIndex}>
        <div className="athlete-top"><label>Player<input aria-label={`Group ${index + 1} player ${athleteIndex + 1}`} list={`players-${group.id}`} value={athlete.name} onChange={e => update(g => {
          const player=findAthlete(e.target.value);
          g.athletes[athleteIndex]={...g.athletes[athleteIndex],id:player?.id??`unknown:${e.target.value}`,name:e.target.value,clinician:field(player?.active?player.clinician:null,player?.active?'override':'unresolved','season-clinician-partnership'),treatment:emptyRange('Player changed: review treatment',false),treatmentDuration:undefined,clinicianBeforePlan:undefined};
        })} onBlur={()=>{const player=findAthlete(athlete.name);if(player&&athlete.name!==player.name)update(g=>{g.athletes[athleteIndex].name=player.name;});}}/></label><button className="quiet" disabled={athleteIndex === 0} aria-label={`Move ${athlete.name} earlier`} onClick={() => update(g => { [g.athletes[athleteIndex - 1],g.athletes[athleteIndex]] = [g.athletes[athleteIndex],g.athletes[athleteIndex - 1]]; })}>↑</button><button className="quiet" aria-label={`Remove ${athlete.name}`} onClick={() => update(g => { g.athletes.splice(athleteIndex, 1); })}>×</button></div>
        <div className="two-fields">
          <label>Workout staff<input value={athlete.workoutStaff} onChange={e => update(g => { g.athletes[athleteIndex].workoutStaff = e.target.value; })} /></label>
          <label title={athlete.clinician.source}>TABLE clinician<input aria-label={`TABLE clinician for ${athlete.name}`} list={`clinicians-${group.id}`} value={athlete.clinician.value ?? ''} className={athlete.clinician.value ? '' : 'missing-input'} onChange={e => update(g => { g.athletes[athleteIndex].clinician = field(e.target.value || null, 'override', 'User clinician edit'); })} /></label>
        </div>
        <label>Treatment duration (minutes)<input aria-label={`Treatment duration for ${athlete.name}`} type="number" min="1" max="120" step="1" value={athlete.treatmentDuration ? athlete.treatmentDuration.value ?? '' : treatmentMinutes(athlete)} onChange={e => update(g => {
          editTreatmentDuration(g.athletes[athleteIndex],e.target.value);
        })} /></label>
        <p className="field-help">Duration edits keep this player's treatment end and update their start immediately. Other players are unchanged; any overlap is flagged.</p>
        {(group.table.applicable||athlete.treatment.applicable) && <div className="two-fields">
          <FieldControl label="Treatment start" type="time" value={athlete.treatment.start} onChange={v => update(g => { const range=g.athletes[athleteIndex].treatment;range.applicable=true;range.start=field(fromInputTime(v),'override','User individual treatment');range.end=field(range.end.value,'override','User individual treatment'); })} />
          <FieldControl label="Treatment end" type="time" value={athlete.treatment.end} onChange={v => update(g => { const range=g.athletes[athleteIndex].treatment;range.applicable=true;range.end=field(fromInputTime(v),'override','User individual treatment');range.start=field(range.start.value,'override','User individual treatment'); })} />
        </div>}
        <label>Treatment exception note<input placeholder="e.g. post-walkthrough, at 5PM" value={athlete.treatmentNote} onChange={e => update(g => { g.athletes[athleteIndex].treatmentNote = e.target.value; })} /></label>
      </div>)}
      <datalist id={`clinicians-${group.id}`}>{clinicians.map(name => <option key={name} value={name} />)}</datalist>
      <datalist id={`players-${group.id}`}>{activeRoster.map(player=><option key={player.id} value={player.name}/>)}</datalist>
      <button onClick={() => update(g => { g.athletes.push({ id: `unknown:${crypto.randomUUID()}`, name: '', workoutStaff: '', clinician: field<string>(null, 'unresolved', 'Choose or add a roster player'), treatment: emptyRange('No exact treatment interval', false), treatmentNote: '' }); })}>+ Player</button>
      {(['table', 'performance', 'court'] as const).map(phase => <fieldset key={phase} className="phase-editor">
        <legend>{phase.toUpperCase()}</legend>
        <label className="check-label"><input type="checkbox" checked={group[phase].applicable} disabled={phase === 'court'} onChange={e => update(g => { g[phase].applicable = e.target.checked; })} />{group[phase].applicable ? 'Scheduled' : 'Not applicable'}</label>
        {group[phase].applicable && <div className="two-fields">
          <FieldControl label={`${phase.toUpperCase()} start`} type="time" value={group[phase].start} onChange={v => update(g => { g[phase].start = field(fromInputTime(v), 'override', 'User time edit'); })} />
          <FieldControl label={`${phase.toUpperCase()} end`} type="time" value={group[phase].end} onChange={v => update(g => { g[phase].end = field(fromInputTime(v), 'override', 'User time edit'); })} />
        </div>}
        {group[phase].applicable && (group[phase].start.value === null || group[phase].end.value === null) && <p className="field-help">{group[phase].start.source}</p>}
      </fieldset>)}
      <div className="two-fields">
        <FieldControl label="Clock label (minutes)" type="number" value={group.clock} onChange={v => update(g => { g.clock = field(v ? Number(v) : null, 'override', 'User clock edit'); })} />
        <label>Court location<input list={`court-locations-${group.id}`} value={group.location} onChange={e => update(g => { g.location = e.target.value; })} /></label>
      </div>
      <datalist id={`court-locations-${group.id}`}><option value="main" /><option value="practice" /></datalist>
      <label>Walkthrough state<select value={group.walkthroughState} onChange={e => update(g => { g.walkthroughState = e.target.value as Group['walkthroughState']; })}><option value="none">None</option><option value="pre">Pre-walkthrough</option><option value="post">Post-walkthrough</option></select></label>
      <label>Graphic note<input value={group.notes} onChange={e => update(g => { g.notes = e.target.value; })} /></label>
    </div>
  </details>;
}
