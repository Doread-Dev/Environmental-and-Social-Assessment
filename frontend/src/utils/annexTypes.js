/**
 * Standard annex item types for project annex overview
 * Moved from data/mockAnnexItems for production use (static reference list)
 */

export const annexItems = [
  { _id: 'annex_001', title: 'Annex A — Environmental Policy', description: 'Official environmental policy document for the project.' },
  { _id: 'annex_002', title: 'Annex B — Stakeholder Engagement Logs', description: 'Meeting notes and consultation logs with community stakeholders.' },
  { _id: 'annex_003', title: 'Annex C — Environmental Baseline Data', description: 'Baseline environmental conditions before project commencement.' },
  { _id: 'annex_004', title: 'Annex D — Impact Mitigation Measures', description: 'Detailed mitigation strategies for identified environmental impacts.' },
  { _id: 'annex_005', title: 'Annex E — Monitoring Plan', description: 'Comprehensive monitoring plan with schedules and responsibilities.' },
  { _id: 'annex_006', title: 'Annex F — Legal & Regulatory Framework', description: 'Applicable environmental laws, regulations, and compliance requirements.' },
  { _id: 'annex_007', title: 'Annex G — Emergency Response Procedures', description: 'Emergency response protocols and contingency plans.' },
  { _id: 'annex_008', title: 'Annex H — Training Materials', description: 'Environmental awareness and capacity building materials for project staff.' },
]

/**
 * Get annex item by ID
 * @param {string} id - Annex item ID
 * @returns {Object|undefined}
 */
export function getAnnexItemById(id) {
  return annexItems.find((item) => item._id === id)
}
