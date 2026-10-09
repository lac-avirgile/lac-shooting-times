/** Season partnership table. User-supplied assignments take priority over references. */
export const clinicians = ['Jasen', 'Colby', 'Dan', 'Maggie', 'Jesse', 'Eric', 'Lorin', 'Joann'];
export const clinicianKey = (name: string): string => ['jp','jasen powell'].includes(name.trim().toLowerCase()) ? 'jasen' : name.trim().toLowerCase();
/** User-approved fallback order; proposals still require review/apply. */
export const backupClinicians = ['Colby', 'Dan', 'Jasen'];
export const clinicianAssignments: Record<string, { name: string; source: 'user' | 'reference' }> = {
  loyer: { name: 'Lorin', source: 'user' },
  beal: { name: 'Jesse', source: 'user' },
  jackson: { name: 'Jesse', source: 'user' },
  hachimura: { name: 'Jesse', source: 'user' },
  miller: { name: 'Jesse', source: 'user' },
  garland: { name: 'Maggie', source: 'user' },
  ingram: { name: 'Maggie', source: 'user' },
  jones: { name: 'Maggie', source: 'user' },
  wagler: { name: 'Maggie', source: 'user' },
  pickett: { name: 'Jasen', source: 'user' },
  dick: { name: 'Jasen', source: 'user' },
  strus: { name: 'Dan', source: 'user' },
  lopez: { name: 'Dan', source: 'user' },
  christie: { name: 'Dan', source: 'user' },
  sanders: { name: 'Dan', source: 'user' },
  martinelli: { name: 'Dan', source: 'user' },
  niederhauser: { name: 'Colby', source: 'user' },
  baba: { name: 'Colby', source: 'user' },
  dunn: { name: 'Colby', source: 'user' },
  wesley: { name: 'Lorin', source: 'user' },
  kawamura: { name: 'Lorin', source: 'user' },
};
export function partnership(id: string): { name: string; source: 'user' | 'reference' } | undefined {
  return clinicianAssignments[id];
}
