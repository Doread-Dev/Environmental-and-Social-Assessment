/**
 * Project Status Utilities
 * Shared functions for calculating project and workflow status
 */

/**
 * Default workflow structure
 * Used when project doesn't have workflow data
 */
export const DEFAULT_WORKFLOW = {
  screening: { status: 'pending', tool: 1 },
  assessment: { status: 'pending', tool: 2 },
  semp: { status: 'pending', tools: [3, 4] },
  monitoring: { status: 'pending', tool: 5 },
}

/**
 * Create a fresh default workflow object
 * @returns {Object} Default workflow structure
 */
export function createDefaultWorkflow() {
  return {
    screening: { ...DEFAULT_WORKFLOW.screening },
    assessment: { ...DEFAULT_WORKFLOW.assessment },
    semp: { ...DEFAULT_WORKFLOW.semp },
    monitoring: { ...DEFAULT_WORKFLOW.monitoring },
  }
}

/**
 * Calculate overall project status from workflow
 * @param {Object} workflow - Workflow object from project
 * @returns {string} Project status: 'draft' | 'in_progress' | 'monitoring' | 'needs_action' | 'completed'
 */
export function calculateProjectStatus(workflow) {
  if (!workflow) return 'draft'

  // If any tool needs action
  const hasNeedsAction = Object.values(workflow).some((w) => w.status === 'needs_action')
  if (hasNeedsAction) return 'needs_action'

  // If all tools are completed
  const allCompleted = Object.values(workflow).every(
    (w) => w.status === 'approved' || w.status === 'completed'
  )
  if (allCompleted) return 'completed'

  // If monitoring is in progress
  if (workflow.monitoring?.status === 'in_progress') return 'monitoring'

  // If screening hasn't started yet
  if (workflow.screening?.status === 'draft' || workflow.screening?.status === 'pending') {
    return 'draft'
  }

  // Any other state = in progress
  return 'in_progress'
}

/**
 * Calculate SEMP status from management activities and mitigation plans
 * @param {boolean} hasManagementActivities - Whether project has management activities
 * @param {boolean} hasMitigationPlans - Whether project has mitigation plans
 * @returns {string} SEMP status
 */
export function calculateSempStatus(hasManagementActivities, hasMitigationPlans) {
  if (hasManagementActivities && hasMitigationPlans) return 'completed'
  if (hasManagementActivities || hasMitigationPlans) return 'in_progress'
  return 'pending'
}

/**
 * Calculate monitoring status from quarterly records
 * @param {Object} quarters - Object with Q1, Q2, Q3, Q4 boolean values
 * @returns {string} Monitoring status
 */
export function calculateMonitoringStatus(quarters) {
  if (!quarters) return 'pending'
  
  const completedQuarters = Object.values(quarters).filter(Boolean).length
  if (completedQuarters === 4) return 'completed'
  if (completedQuarters > 0) return 'in_progress'
  return 'pending'
}
