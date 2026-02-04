/**
 * Mock Monitoring Records Data
 * متوافق مع backend/src/models/monitoringRecord.model.js
 */

import { impactIndicators } from './impactIndicators'

/**
 * تحويل impactIndicators إلى monitoring indicators مع IDs
 */
export const monitoringIndicators = impactIndicators.map((indicator, index) => ({
  _id: `indicator_${indicator.code}_${index + 1}`,
  categoryCode: indicator.code,
  name: indicator.name,
  definition: indicator.definition,
  measurement: indicator.measurement,
}))

/**
 * الحصول على مؤشرات فئة معينة
 */
export function getMonitoringIndicatorsByCategory(code) {
  return monitoringIndicators.filter((i) => i.categoryCode === code)
}

/**
 * Mock Monitoring Records
 * سجلات المراقبة الوهمية
 */
export const mockMonitoringRecords = [
  // Project 1 - Sample monitoring records
  {
    _id: 'mr_001',
    project: '507f1f77bcf86cd799439011',
    indicator: 'indicator_A_1',
    scores: { baseline: '2', Q1: '1', Q2: '1', Q3: '1', Q4: '1' },
    total: '4',
    final_assessment: '-2',
    ranking: 'low',
    responsible: '507f1f77bcf86cd799439001',
    note: '',
  },
  {
    _id: 'mr_002',
    project: '507f1f77bcf86cd799439011',
    indicator: 'indicator_A_2',
    scores: { baseline: '2', Q1: '1', Q2: '1', Q3: '1', Q4: '1' },
    total: '4',
    final_assessment: '-2',
    ranking: 'medium',
    responsible: '507f1f77bcf86cd799439001',
    note: '',
  },
  {
    _id: 'mr_003',
    project: '507f1f77bcf86cd799439011',
    indicator: 'indicator_B_4',
    scores: { baseline: '2', Q1: '1', Q2: '1', Q3: '1', Q4: '0' },
    total: '3',
    final_assessment: '-1',
    ranking: 'low',
    responsible: '507f1f77bcf86cd799439002',
    note: 'Regular water testing conducted',
  },

  // Project 2 - Sample monitoring records
  {
    _id: 'mr_004',
    project: '507f1f77bcf86cd799439012',
    indicator: 'indicator_C_7',
    scores: { baseline: '2', Q1: '1', Q2: '2', Q3: '1' },
    total: '4',
    final_assessment: '-2',
    ranking: 'high',
    responsible: '507f1f77bcf86cd799439002',
    note: 'Mitigation measures implemented in Q3',
  },
]

/**
 * الحصول على سجلات المراقبة حسب المشروع
 */
export function getMonitoringRecordsByProjectId(projectId) {
  return mockMonitoringRecords.filter((r) => r.project === projectId)
}

/**
 * إنشاء سجل مراقبة فارغ
 */
export function createEmptyMonitoringRecord(projectId, indicatorId) {
  return {
    _id: `mr_${projectId || 'project'}_${indicatorId}`,
    project: projectId,
    indicator: indicatorId,
    scores: { baseline: '', Q1: '', Q2: '', Q3: '', Q4: '' },
    total: '',
    final_assessment: '',
    ranking: 'not_applicable',
    responsible: null,
    note: '',
    isNew: true,
  }
}
