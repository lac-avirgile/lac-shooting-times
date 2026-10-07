import { brand } from './brand';

export const templates = [
  { id: 'reference', name: 'Original · Operations', description: 'The established reference graphic.', background: '#FFFFFF', ink: brand.ink },
  { id: 'reference-1', name: '1 · Clean', description: 'Athletic masthead, white two-column schedule and red operational callouts.', background: '#FFFFFF', ink: brand.navy },
  { id: 'reference-2', name: '2 · Sidebar', description: 'Clippers identity and arena photography beside a clean operations sheet.', background: '#FFFFFF', ink: brand.navy },
  { id: 'reference-4', name: '4 · Arena', description: 'Dark arena poster with angular panels and three clearly separated workout phases.', background: '#071A34', ink: '#FFFFFF' },
] as const;
export type TemplateId = typeof templates[number]['id'];
export function templateFor(id: TemplateId) { return templates.find(template => template.id === id) ?? templates[0]; }

export const exportPresets = [
  { id: 'standard', label: 'High quality · 4000 × 2250 minimum', width: 4000, height: 2250 },
  { id: 'ultra', label: 'Ultra quality · 8000 × 4500 minimum', width: 8000, height: 4500 },
  { id: 'preview', label: 'Compact · 1920 × 1080', width: 1920, height: 1080 },
] as const;
export type ExportPresetId = typeof exportPresets[number]['id'];
