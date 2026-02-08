/**
 * Excel Export Barrel Export
 * Re-exports all export functions and utilities
 */

// Import functions first
import { exportScreeningToExcel } from './exportScreening'
import { exportAssessmentToExcel } from './exportAssessment'
import { exportManagementActivitiesToExcel } from './exportManagementActivities'
import { exportMitigationPlanToExcel } from './exportMitigationPlan'
import { exportMonitoringToExcel } from './exportMonitoring'

// Re-export all functions
export {
  exportScreeningToExcel,
  exportAssessmentToExcel,
  exportManagementActivitiesToExcel,
  exportMitigationPlanToExcel,
  exportMonitoringToExcel,
}

// Export common utilities from excelBase
export {
  createWorkbook,
  addAkfHeader,
  applyBorders,
  mergeCells,
  saveWorkbook,
  generateFileName,
  extractId,
  extractUserName,
  extractUserJobTitle,
  formatRecommendedActions,
  formatDate,
  safeString,
  EXCEL_STYLES,
} from './excelBase'
