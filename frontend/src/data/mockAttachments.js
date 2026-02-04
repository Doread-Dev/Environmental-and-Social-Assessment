/**
 * Mock Attachments Data
 * متوافق مع backend/src/models/attachment.model.js
 */

/**
 * Mock Attachments
 */
export const mockAttachments = [
  // Project Files
  {
    _id: 'att_001',
    entity_type: 'project',
    entity_id: '507f1f77bcf86cd799439011',
    file_name: 'Project Charter.pdf',
    file_path: '/uploads/project/charter.pdf',
    file_type: 'pdf',
    file_size: 234000,
    uploaded_by: '507f1f77bcf86cd799439001',
    createdAt: '2024-01-10T10:00:00.000Z',
  },
  {
    _id: 'att_002',
    entity_type: 'project',
    entity_id: '507f1f77bcf86cd799439011',
    file_name: 'Site Location Map.jpg',
    file_path: '/uploads/project/location-map.jpg',
    file_type: 'jpg',
    file_size: 456000,
    uploaded_by: '507f1f77bcf86cd799439001',
    createdAt: '2024-01-12T14:30:00.000Z',
  },

  // Screening Files
  {
    _id: 'att_003',
    entity_type: 'screening',
    entity_id: '507f1f77bcf86cd799439011',
    file_name: 'Screening Checklist.xlsx',
    file_path: '/uploads/screening/checklist.xlsx',
    file_type: 'xlsx',
    file_size: 89000,
    uploaded_by: '507f1f77bcf86cd799439002',
    createdAt: '2024-02-05T09:15:00.000Z',
  },
  {
    _id: 'att_004',
    entity_type: 'screening',
    entity_id: '507f1f77bcf86cd799439011',
    file_name: 'Risk Assessment Report.pdf',
    file_path: '/uploads/screening/risk-report.pdf',
    file_type: 'pdf',
    file_size: 567000,
    uploaded_by: '507f1f77bcf86cd799439002',
    createdAt: '2024-02-06T11:20:00.000Z',
  },

  // Assessment Files
  {
    _id: 'att_005',
    entity_type: 'assessment',
    entity_id: '507f1f77bcf86cd799439011',
    file_name: 'Environmental Impact Assessment.pdf',
    file_path: '/uploads/assessment/eia-report.pdf',
    file_type: 'pdf',
    file_size: 1234000,
    uploaded_by: '507f1f77bcf86cd799439003',
    createdAt: '2024-03-15T13:45:00.000Z',
  },
  {
    _id: 'att_006',
    entity_type: 'assessment',
    entity_id: '507f1f77bcf86cd799439011',
    file_name: 'Community Consultation Photos.zip',
    file_path: '/uploads/assessment/consultation-photos.zip',
    file_type: 'zip',
    file_size: 2345000,
    uploaded_by: '507f1f77bcf86cd799439003',
    createdAt: '2024-03-18T16:00:00.000Z',
  },
  {
    _id: 'att_007',
    entity_type: 'assessment',
    entity_id: '507f1f77bcf86cd799439011',
    file_name: 'Baseline Study.docx',
    file_path: '/uploads/assessment/baseline.docx',
    file_type: 'docx',
    file_size: 345000,
    uploaded_by: '507f1f77bcf86cd799439003',
    createdAt: '2024-03-20T10:30:00.000Z',
  },

  // Monitoring Files
  {
    _id: 'att_008',
    entity_type: 'monitoring',
    entity_id: '507f1f77bcf86cd799439011',
    file_name: 'Q1 Monitoring Report.pdf',
    file_path: '/uploads/monitoring/q1-report.pdf',
    file_type: 'pdf',
    file_size: 678000,
    uploaded_by: '507f1f77bcf86cd799439004',
    createdAt: '2024-06-01T08:00:00.000Z',
  },
  {
    _id: 'att_009',
    entity_type: 'monitoring',
    entity_id: '507f1f77bcf86cd799439011',
    file_name: 'Q2 Monitoring Report.pdf',
    file_path: '/uploads/monitoring/q2-report.pdf',
    file_type: 'pdf',
    file_size: 712000,
    uploaded_by: '507f1f77bcf86cd799439004',
    createdAt: '2024-09-01T08:00:00.000Z',
  },

  // Project 2 Files
  {
    _id: 'att_010',
    entity_type: 'project',
    entity_id: '507f1f77bcf86cd799439012',
    file_name: 'Project Proposal.pdf',
    file_path: '/uploads/project/proposal.pdf',
    file_type: 'pdf',
    file_size: 890000,
    uploaded_by: '507f1f77bcf86cd799439002',
    createdAt: '2024-02-01T09:00:00.000Z',
  },
]

/**
 * الحصول على المرفقات حسب الكيان
 */
export function getAttachmentsByEntity(projectId, entityType) {
  return mockAttachments.filter((a) => a.entity_id === projectId && a.entity_type === entityType)
}

/**
 * الحصول على جميع ملفات المشروع (جميع الأنواع)
 */
export function getAllProjectAttachments(projectId) {
  return mockAttachments.filter((a) => a.entity_id === projectId)
}

/**
 * تصنيف الملفات حسب النوع
 */
export function groupAttachmentsByType(projectId) {
  const allFiles = getAllProjectAttachments(projectId)

  return {
    project: allFiles.filter((a) => a.entity_type === 'project'),
    screening: allFiles.filter((a) => a.entity_type === 'screening'),
    assessment: allFiles.filter((a) => a.entity_type === 'assessment'),
    monitoring: allFiles.filter((a) => a.entity_type === 'monitoring'),
  }
}

/**
 * تنسيق حجم الملف
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
