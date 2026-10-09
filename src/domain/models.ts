export type Origin = 'explicit' | 'inferred' | 'override' | 'unresolved';
export interface Field<T> {
  value: T | null;
  origin: Origin;
  source: string;
}
export const field = <T>(value: T | null, origin: Origin, source: string): Field<T> => ({ value, origin, source });
export const unresolved = <T>(source: string): Field<T> => field<T>(null, 'unresolved', source);
export interface Diagnostic {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  groupId?: string;
  target?: string;
}
export interface TimeToken { hour: number; minute: number; meridiem: 'am' | 'pm' | null; raw: string }
export interface ParsedAthlete { id: string; name: string; workoutStaff: string; sourceLine: number }
export interface ParsedGroup {
  id: string;
  athletes: ParsedAthlete[];
  start: TimeToken | null;
  end: TimeToken | null;
  clock: number | null;
  kind: 'normal' | 'pd' | 'stay-ready' | 'custom';
  location: 'main' | 'practice';
  walkthroughState: 'none' | 'pre' | 'post';
  notes: string[];
  sourceLine: number;
}
export interface ParsedWalkthrough { id: string; start: TimeToken | null; end: TimeToken | null; sourceLine: number }
export interface ParsedDraft {
  raw: string;
  opponentId: string | null;
  opponentText: string;
  homeAway: 'home' | 'away' | null;
  tip: TimeToken | null;
  draft: boolean;
  groups: ParsedGroup[];
  walkthroughs: ParsedWalkthrough[];
  meetingClock: number | null;
  diagnostics: Diagnostic[];
}
export interface Range { start: Field<number>; end: Field<number>; applicable: boolean }
export interface Athlete {
  id: string;
  name: string;
  workoutStaff: string;
  clinician: Field<string>;
  treatment: Range;
  treatmentDuration?: Field<number>;
  clinicianBeforePlan?: Field<string>;
  treatmentNote: string;
}
export interface Group {
  id: string;
  kind: ParsedGroup['kind'];
  athletes: Athlete[];
  table: Range;
  performance: Range;
  court: Range;
  clock: Field<number>;
  location: string;
  walkthroughState: ParsedGroup['walkthroughState'];
  notes: string;
}
export interface Walkthrough { id: string; range: Range; label: string }
export interface Schedule {
  raw: string;
  game: {
    date: string;
    number: string;
    label?: string;
    opponentId: string | null;
    opponent: Field<string>;
    homeAway: Field<'home' | 'away'>;
    tip: Field<number>;
    venue: Field<string>;
    city: Field<string>;
    draft: boolean;
    activeForGame?: string[];
  };
  groups: Group[];
  walkthroughs: Walkthrough[];
  meeting: { enabled: boolean; clock: Field<number>; time: Field<number> };
  parserDiagnostics: Diagnostic[];
}
export const emptyRange = (source: string, applicable = true): Range => ({
  start: unresolved<number>(source), end: unresolved<number>(source), applicable,
});
