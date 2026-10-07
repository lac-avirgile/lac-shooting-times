import type { TimeToken } from './models';

export function parseTimeToken(input: string): TimeToken | null {
  const match = input.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  return { hour, minute, meridiem: (match[3]?.toLowerCase() as 'am' | 'pm' | undefined) ?? null, raw: input.trim() };
}
export function candidates(token: TimeToken): number[] {
  const base = (token.hour % 12) * 60 + token.minute;
  return token.meridiem === 'am' ? [base] : token.meridiem === 'pm' ? [base + 720] : [base, base + 720];
}
export function formatTime(value: number | null): string {
  if (value === null) return 'Time needed';
  const minute = ((value % 1440) + 1440) % 1440;
  const hour = Math.floor(minute / 60);
  return `${hour % 12 || 12}${minute % 60 ? `:${String(minute % 60).padStart(2, '0')}` : ''}${hour >= 12 ? 'PM' : 'AM'}`;
}
export function toInputTime(value: number | null): string {
  return value === null ? '' : `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
export function fromInputTime(input: string): number | null {
  const match = input.match(/^(\d{2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
export function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
