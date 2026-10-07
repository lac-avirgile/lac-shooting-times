import type { Field } from '../domain/models';
import { fromInputTime, toInputTime } from '../domain/time';

export function FieldControl({ label, value, onChange, type = 'text' }: { label: string; value: Field<string> | Field<number>; onChange: (value: string) => void; type?: 'text' | 'time' | 'number' }) {
  const unresolved = value.origin === 'unresolved' || (value.value === null && type === 'time');
  return <label className={`field-control origin-${value.origin}`} title={value.source}>
    <span>{label} {unresolved ? <em className="needs-review">Needs value</em> : value.origin === 'inferred' ? <span className="inferred-dot" aria-label="Inferred">◌</span> : value.origin === 'override' ? <span className="origin-tag">edited / config</span> : null}</span>
    <input aria-label={label} type={type} value={type === 'time' ? toInputTime(value.value as number | null) : value.value ?? ''} onChange={event => onChange(event.target.value)} aria-invalid={unresolved} />
  </label>;
}
export { fromInputTime };
