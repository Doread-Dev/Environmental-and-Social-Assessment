/**
 * @deprecated For production UI, use utils/ (formatFileSize, workflowStatuses, screeningDisplay,
 * annexTypes, rankingHelp, assessmentMethods, attachmentsHelpers) and LookupContext (users,
 * impact categories, IMPACT_LEVEL_CONFIG). This barrel re-exports from utils for backward
 * compatibility only (e.g. documents or legacy scripts). Do not use in new code.
 */

// Re-export from utils for backward compatibility
export { formatFileSize } from '../utils/formatFileSize'
export {
  WORKFLOW_TOOLS,
  workflowStepStatuses,
  projectStatuses,
  mapBackendStatusToDisplay,
} from '../utils/workflowStatuses'
export {
  screeningCategories,
  screeningStatuses,
  getScreeningCategory,
} from '../utils/screeningDisplay'
export { getRankingDisplayLabel, RANKING_HELP } from '../utils/rankingHelp'
export { assessmentMethods, consultationMethods } from '../utils/assessmentMethods'
export { annexItems, getAnnexItemById } from '../utils/annexTypes'
export { groupAttachmentsByType } from '../utils/attachmentsHelpers'
