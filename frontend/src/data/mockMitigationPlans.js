/**
 * Mock Mitigation Plans Data
 * متوافق مع backend/src/models/mitigationPlan.model.js
 */

export const mockMitigationPlans = [
  // Project: Reforestation Initiative (507f1f77bcf86cd799439013)
  {
    _id: 'mp_001',
    project: '507f1f77bcf86cd799439013',
    serial_number: 1,
    output_description: 'Site preparation and vegetation clearing for new community center.',
    potential_impact_and_significance: 'Loss of habitat (Medium). Soil erosion risk (High).',
    mitigation_and_enhancement_measures: '1. Mark boundaries clearly.\n2. Schedule clearing during dry season.',
    monitoring: 'Weekly site inspection photos.',
    schedule: 'Q1 2024 (Jan-Mar)',
    responsible: '507f1f77bcf86cd799439001',
    notes: 'Contractor briefed.',
    createdAt: '2023-02-15T10:00:00.000Z',
    updatedAt: '2023-02-15T10:00:00.000Z'
  },
  {
    _id: 'mp_002',
    project: '507f1f77bcf86cd799439013',
    serial_number: 2,
    output_description: 'Water sourcing for concrete mixing.',
    potential_impact_and_significance: 'Depletion of local well water (High climate risk).',
    mitigation_and_enhancement_measures: 'Source water from municipal supply truck.',
    monitoring: 'Water purchase receipts log.',
    schedule: 'Continuous',
    responsible: '507f1f77bcf86cd799439002',
    notes: 'Budget approved.',
    createdAt: '2023-02-16T10:00:00.000Z',
    updatedAt: '2023-02-16T10:00:00.000Z'
  },
  // Project: Water Sanitation Phase II (507f1f77bcf86cd799439011)
  {
    _id: 'mp_003',
    project: '507f1f77bcf86cd799439011',
    serial_number: 1,
    output_description: 'Borehole drilling operations',
    potential_impact_and_significance: 'Groundwater contamination risk (Medium). Noise pollution (Low).',
    mitigation_and_enhancement_measures: '1. Use sealed drilling fluids\n2. Install proper casing\n3. Limit drilling hours',
    monitoring: 'Water quality testing before and after',
    schedule: 'Q2 2024',
    responsible: '507f1f77bcf86cd799439001',
    notes: 'Permits obtained',
    createdAt: '2024-02-01T10:00:00.000Z',
    updatedAt: '2024-02-01T10:00:00.000Z'
  }
]

/**
 * الحصول على خطط التخفيف لمشروع معين
 * @param {string} projectId - معرف المشروع
 * @returns {Array}
 */
export function getMitigationPlansByProjectId(projectId) {
  return mockMitigationPlans
    .filter(p => p.project === projectId)
    .sort((a, b) => a.serial_number - b.serial_number)
}

/**
 * الحصول على آخر رقم تسلسلي لمشروع
 * @param {string} projectId - معرف المشروع
 * @returns {number}
 */
export function getNextMitigationSerialNumber(projectId) {
  const plans = getMitigationPlansByProjectId(projectId)
  if (plans.length === 0) return 1
  return Math.max(...plans.map(p => p.serial_number)) + 1
}

/**
 * إنشاء صف جديد فارغ
 * @param {string} projectId - معرف المشروع
 * @returns {Object}
 */
export function createEmptyMitigationPlan(projectId) {
  return {
    _id: `mp_temp_${Date.now()}`,
    project: projectId,
    serial_number: getNextMitigationSerialNumber(projectId),
    output_description: '',
    potential_impact_and_significance: '',
    mitigation_and_enhancement_measures: '',
    monitoring: '',
    schedule: '',
    responsible: null,
    notes: '',
    isNew: true
  }
}
