/** Approved, season-editable patterns. Never infer compressed ten-minute splits. */
export const rules = {
  tableMinutes: 15,
  performanceMinutes: 15,
  clockCourtMinutes: 15,
  pdCourtMinutes: 45,
  kawhi: { athleteId: 'leonard', tableMinutes: 30, performanceApplicable: false },
  longTableAthletes: ['garland', 'collins'],
  longTableMinutes: 30,
  maxPreparationLeadMinutes: 360,
  treatmentSearchMinutes: 120,
  meetingAtFinalCourtEnd: true,
};
