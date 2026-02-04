/**
 * Mock Management Activities Data
 * متوافق مع backend/src/models/managementActivity.model.js
 */

export const mockManagementActivities = [
  // Project: Water Sanitation Phase II (507f1f77bcf86cd799439011)
  {
    _id: 'ma_001',
    project: '507f1f77bcf86cd799439011',
    serial_number: 1,
    activity_description: 'Construction site clearing near wetlands',
    potential_impact: 'Wetlands Disturbance (High)',
    recommended_actions: 'Install silt fences and sedimentation ponds immediately.',
    monitoring_requirements: 'Daily visual inspection',
    responsible: '507f1f77bcf86cd799439001', // Sarah Jenkins
    notes: 'Pending permit',
    createdAt: '2024-01-25T10:00:00.000Z',
    updatedAt: '2024-01-25T10:00:00.000Z',
  },
  {
    _id: 'ma_002',
    project: '507f1f77bcf86cd799439011',
    serial_number: 2,
    activity_description: 'Excavation for water pipeline installation',
    potential_impact: 'Soil Erosion (Medium)',
    recommended_actions: '1. Use erosion control blankets\n2. Restore topsoil after installation',
    monitoring_requirements: 'Weekly site inspection',
    responsible: '507f1f77bcf86cd799439003', // Maria Santos
    notes: '',
    createdAt: '2024-01-26T10:00:00.000Z',
    updatedAt: '2024-01-26T10:00:00.000Z',
  },
  // Project: Reforestation Initiative (507f1f77bcf86cd799439013)
  {
    _id: 'ma_003',
    project: '507f1f77bcf86cd799439013',
    serial_number: 1,
    activity_description: 'Site preparation and vegetation clearing',
    potential_impact: 'Temporary habitat disruption (High)',
    recommended_actions:
      '1. Mark boundaries clearly\n2. Schedule clearing during dry season\n3. Preserve mature trees where possible',
    monitoring_requirements: 'Daily supervision by environmental officer',
    responsible: '507f1f77bcf86cd799439001',
    notes: 'Phase 1 area only',
    createdAt: '2023-02-01T10:00:00.000Z',
    updatedAt: '2023-02-01T10:00:00.000Z',
  },
  {
    _id: 'ma_004',
    project: '507f1f77bcf86cd799439013',
    serial_number: 2,
    activity_description: 'Seedling transport and planting operations',
    potential_impact: 'Soil compaction from vehicles (Medium)',
    recommended_actions: 'Use designated access routes only. Limit vehicle weight.',
    monitoring_requirements: 'Track vehicle movements. Soil condition checks.',
    responsible: '507f1f77bcf86cd799439002',
    notes: '',
    createdAt: '2023-02-05T10:00:00.000Z',
    updatedAt: '2023-02-05T10:00:00.000Z',
  },
  {
    _id: 'ma_005',
    project: '507f1f77bcf86cd799439013',
    serial_number: 3,
    activity_description: 'Fire break establishment',
    potential_impact: 'Vegetation removal (Low)',
    recommended_actions:
      'Maintain minimum width standards. Re-vegetate with fire-resistant species.',
    monitoring_requirements: 'Quarterly inspection of fire break condition',
    responsible: '507f1f77bcf86cd799439001',
    notes: 'Critical for dry season',
    createdAt: '2023-02-10T10:00:00.000Z',
    updatedAt: '2023-02-10T10:00:00.000Z',
  },
]

/**
 * الحصول على أنشطة الإدارة لمشروع معين
 * @param {string} projectId - معرف المشروع
 * @returns {Array}
 */
export function getManagementActivitiesByProjectId(projectId) {
  return mockManagementActivities
    .filter((a) => a.project === projectId)
    .sort((a, b) => a.serial_number - b.serial_number)
}

/**
 * الحصول على آخر رقم تسلسلي لمشروع
 * @param {string} projectId - معرف المشروع
 * @returns {number}
 */
export function getNextSerialNumber(projectId) {
  const activities = getManagementActivitiesByProjectId(projectId)
  if (activities.length === 0) return 1
  return Math.max(...activities.map((a) => a.serial_number)) + 1
}

/**
 * إنشاء صف جديد فارغ
 * @param {string} projectId - معرف المشروع
 * @returns {Object}
 */
export function createEmptyManagementActivity(projectId) {
  return {
    _id: `ma_temp_${Date.now()}`,
    project: projectId,
    serial_number: getNextSerialNumber(projectId),
    activity_description: '',
    potential_impact: '',
    recommended_actions: '',
    monitoring_requirements: '',
    responsible: null,
    notes: '',
    isNew: true, // علامة للصفوف الجديدة
  }
}
