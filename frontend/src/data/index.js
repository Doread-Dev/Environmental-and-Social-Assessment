/**
 * Mock Data Barrel Export
 * متوافق مع Backend Models
 */

// Projects
export {
  mockProjects,
  calculateProjectStatus,
  calculateSempStatus, // ← جديد: حساب حالة SEMP
  calculateMonitoringStatus, // ← جديد: حساب حالة Monitoring
} from './mockProjects'

// Users
export {
  mockUsers,
  currentUser,
  mockJobTitles,
  USER_ROLES,
  ROLE_LABELS,
  getRoleDisplayName,
} from './mockUsers'

// Screening (Tool 1)
export { screeningCategories, screeningStatuses, getScreeningCategory } from './screeningCategories'

// Workflow
export {
  WORKFLOW_TOOLS,
  workflowStepStatuses,
  projectStatuses,
  mapBackendStatusToDisplay, // ← جديد: تحويل حالة Backend للعرض
} from './workflowStatuses'

// Impact Categories (Tool 2)
export { impactCategories, impactLevels } from './impactCategories'

// Assessment Data
export * from './assessmentMethods'
export * from './impactQuestions'
export * from './impactIndicators'  // للاستخدام في Phase 7
export * from './jobTitles'
export {
  mockAssessments,
  mockAssessmentMethods,
  mockConsultations,
  mockImpactScores,
  getAssessmentByProjectId,
  getMethodsByAssessmentId,
  getConsultationsByAssessmentId,
  getImpactScoresByAssessmentId,
  createEmptyAssessment
} from './mockAssessment'

// Screening Data
export {
  mockScreenings,
  getScreeningByProjectId,
  getScreeningWithDetails,
  createEmptyScreening
} from './mockScreening'

// SEMP Data (Tools 3 & 4)
export {
  mockManagementActivities,
  getManagementActivitiesByProjectId,
  getNextSerialNumber,
  createEmptyManagementActivity
} from './mockManagementActivities'

export {
  mockMitigationPlans,
  getMitigationPlansByProjectId,
  getNextMitigationSerialNumber,
  createEmptyMitigationPlan
} from './mockMitigationPlans'
