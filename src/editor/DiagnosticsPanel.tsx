import type { Diagnostic } from '../domain/models';
export function DiagnosticsPanel({ diagnostics }: { diagnostics: Diagnostic[] }) {
  const errors = diagnostics.filter(d => d.severity === 'error');
  const warnings = diagnostics.filter(d => d.severity === 'warning');
  return <details className={`diagnostics ${errors.length ? 'has-errors' : ''}`} open={errors.length > 0}>
    <summary>{errors.length ? `${errors.length} required corrections` : 'Ready for export'} · {warnings.length} review notes</summary>
    {(['error','warning','info'] as const).map(severity=>{const items=diagnostics.filter(issue=>issue.severity===severity);return items.length?<section key={severity}><h3>{severity==='error'?'Required corrections':severity==='warning'?'Review notes':'Inferred values & information'}</h3><ul>{items.map((d, i) => <li key={`${d.code}-${i}`} className={`issue-${d.severity}`}>
      <span className="severity">{d.severity}</span>{d.groupId || d.target ? <a href={`#${d.groupId ?? d.target}`} onClick={() => { const element = document.getElementById(d.groupId ?? d.target ?? ''); if (element instanceof HTMLDetailsElement) element.open = true; }}>{d.message}</a> : d.message}
    </li>)}</ul></section>:null;})}
  </details>;
}
