import { useMemo } from 'react';
import type { Schedule } from '../domain/models';
import { formatTime } from '../domain/time';
import { applyTreatmentPlan, planTreatments, releaseTreatmentPlan } from '../scheduler/treatmentPlanner';
import type { EditSchedule } from './GroupEditor';

export function TreatmentPlanner({schedule,edit}: {schedule: Schedule;edit: EditSchedule}) {
  const plan=useMemo(()=>planTreatments(schedule),[schedule]);
  const proposed=plan.slots.filter(s=>!s.locked);
  return <details className="metadata-editor treatment-planner"><summary>Treatment planner <small>Nearest available slots · no clinician double-booking</small></summary><div className="group-content">
    <p className="field-help">Set each player's treatment minutes inside their group. Review these proposed individual appointments before applying. Manually entered appointments stay locked. Earlier shooting groups take priority; equal-distance choices prefer earlier treatment. The search is limited to ±120 minutes and never moves workout or shooting times.</p>
    <p className="field-help">Normal time first: primary clinician, chosen secondary, then Colby → Dan → Jasen if available. Only move treatment when none can fit at the normal time. Manually edited clinicians stay fixed.</p>
    {plan.issues.length>0 && <ul className="planner-issues">{plan.issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul>}
    <div className="treatment-slots">{plan.slots.map(slot=><div key={`${slot.groupId}-${slot.athleteIndex}`} className={slot.start!==slot.preferred || slot.clinician!==slot.originalClinician ? 'shifted-slot' : ''}><strong>{slot.name} · {slot.clinician}</strong><span>{formatTime(slot.start)}–{formatTime(slot.end)} · {slot.locked ? 'locked' : slot.start===slot.preferred ? 'normal time' : `${Math.abs(slot.start-slot.preferred)} min ${slot.start<slot.preferred?'earlier':'later'}`}{slot.clinician!==slot.originalClinician && ` · backup for ${slot.originalClinician}`}</span></div>)}</div>
    <button className="primary wide-button" disabled={plan.issues.length>0 || proposed.length===0} onClick={()=>edit(d=>applyTreatmentPlan(d,plan))}>Apply reviewed treatment plan</button>
    <button className="wide-button" disabled={!plan.slots.some(s=>s.locked && ['Accepted treatment planner proposal','Automatic configured treatment plan'].includes(schedule.groups.find(g=>g.id===s.groupId)?.athletes[s.athleteIndex].treatment.start.source??''))} onClick={()=>edit(releaseTreatmentPlan)}>Release planned appointments</button>
    <p className="field-help">Group TABLE windows stay unchanged. Different individual times appear on the graphic. Undo can restore the previous plan. Manual individual times can be edited or unlocked in the group.</p>
  </div></details>;
}
