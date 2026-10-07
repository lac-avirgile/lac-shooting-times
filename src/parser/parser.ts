import type { ParsedDraft } from '../domain/models';
export interface ScheduleParser { parse(input: string): ParsedDraft }
