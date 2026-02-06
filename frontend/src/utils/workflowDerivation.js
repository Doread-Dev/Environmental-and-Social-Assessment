/**
 * Workflow Derivation Utility
 * Computes workflow status from actual entity data
 *
 * Since the backend doesn't store workflow status on projects,
 * we derive it from the actual status of each tool's entities.
 */

/**
 * Valid workflow statuses for each step
 */
export const WORKFLOW_STATUS = {
  PENDING: 'pending',
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  NEEDS_ACTION: 'needs_action',
}

/**
 * Derive screening workflow status from screening entity
 * @param {Object|null} screening - Screening entity
 * @returns {Object} Workflow step status
 */
export function deriveScreeningStatus(screening) {
  if (!screening || !screening._id) {
    return { status: WORKFLOW_STATUS.PENDING, tool: 1 }
  }

  // Map screening.status to workflow status
  const status = screening.status || WORKFLOW_STATUS.DRAFT
  return { status, tool: 1 }
}

/**
 * Derive assessment workflow status from assessment entity
 * @param {Object|null} assessment - Assessment entity
 * @param {Object|null} screening - Screening entity (for dependency check)
 * @returns {Object} Workflow step status
 */
export function deriveAssessmentStatus(assessment, screening) {
  // Assessment is locked until screening is approved
  if (!screening || screening.status !== WORKFLOW_STATUS.APPROVED) {
    return { status: WORKFLOW_STATUS.PENDING, tool: 2, locked: true }
  }

  if (!assessment || !assessment._id) {
    return { status: WORKFLOW_STATUS.PENDING, tool: 2 }
  }

  const status = assessment.status || WORKFLOW_STATUS.DRAFT
  return { status, tool: 2 }
}

/**
 * Derive SEMP workflow status from management activities and mitigation plans
 * @param {Array} managementActivities - Management activities array
 * @param {Array} mitigationPlans - Mitigation plans array
 * @param {Object|null} assessment - Assessment entity (for dependency check)
 * @returns {Object} Workflow step status
 */
export function deriveSempStatus(managementActivities, mitigationPlans, assessment) {
  // SEMP is locked until assessment is approved
  if (!assessment || assessment.status !== WORKFLOW_STATUS.APPROVED) {
    return { status: WORKFLOW_STATUS.PENDING, tools: [3, 4], locked: true }
  }

  const hasActivities = Array.isArray(managementActivities) && managementActivities.length > 0
  const hasPlans = Array.isArray(mitigationPlans) && mitigationPlans.length > 0

  // Check if activities are completed (all have activity_description)
  const activitiesCompleted =
    hasActivities &&
    managementActivities.every((activity) => activity.activity_description?.trim())

  // Check if plans are completed (all have output_description)
  const plansCompleted =
    hasPlans && mitigationPlans.every((plan) => plan.output_description?.trim())

  // Both tools completed
  if (activitiesCompleted && plansCompleted) {
    return { status: WORKFLOW_STATUS.COMPLETED, tools: [3, 4] }
  }

  // At least one tool has data (in progress)
  if (hasActivities || hasPlans) {
    return { status: WORKFLOW_STATUS.IN_PROGRESS, tools: [3, 4] }
  }

  // No data yet
  return { status: WORKFLOW_STATUS.PENDING, tools: [3, 4] }
}

/**
 * Derive monitoring workflow status from monitoring records
 * @param {Array} monitoringRecords - Monitoring records array
 * @param {Object} sempStatus - SEMP status (for dependency check)
 * @returns {Object} Workflow step status
 */
export function deriveMonitoringStatus(monitoringRecords, sempStatus) {
  // Monitoring is locked until SEMP is completed
  if (!sempStatus || sempStatus.status !== WORKFLOW_STATUS.COMPLETED) {
    return { status: WORKFLOW_STATUS.PENDING, tool: 5, locked: true }
  }

  if (!Array.isArray(monitoringRecords) || monitoringRecords.length === 0) {
    return { status: WORKFLOW_STATUS.PENDING, tool: 5 }
  }

  // Check if any record has quarterly data
  const hasQuarterlyData = monitoringRecords.some((record) => {
    const scores = record.scores || {}
    return scores.Q1 || scores.Q2 || scores.Q3 || scores.Q4
  })

  // Check if at least one record has all quarters complete
  // Monitoring is considered completed if even one record has all quarters filled
  const atLeastOneRecordComplete = monitoringRecords.some((record) => {
    const scores = record.scores || {}
    return scores.Q1 && scores.Q2 && scores.Q3 && scores.Q4
  })

  if (atLeastOneRecordComplete) {
    return { status: WORKFLOW_STATUS.COMPLETED, tool: 5 }
  }

  if (hasQuarterlyData) {
    return { status: WORKFLOW_STATUS.IN_PROGRESS, tool: 5 }
  }

  return { status: WORKFLOW_STATUS.PENDING, tool: 5 }
}

/**
 * Derive complete workflow status from all entities
 * @param {Object} entities - All project entities
 * @param {Object|null} entities.screening - Screening entity
 * @param {Object|null} entities.assessment - Assessment entity
 * @param {Array} entities.managementActivities - Management activities
 * @param {Array} entities.mitigationPlans - Mitigation plans
 * @param {Array} entities.monitoringRecords - Monitoring records
 * @returns {Object} Complete workflow object
 */
export function deriveWorkflowStatus({
  screening = null,
  assessment = null,
  managementActivities = [],
  mitigationPlans = [],
  monitoringRecords = [],
} = {}) {
  const screeningStatus = deriveScreeningStatus(screening)
  const assessmentStatus = deriveAssessmentStatus(assessment, screening)
  const sempStatus = deriveSempStatus(managementActivities, mitigationPlans, assessment)
  const monitoringStatus = deriveMonitoringStatus(monitoringRecords, sempStatus)

  return {
    screening: screeningStatus,
    assessment: assessmentStatus,
    semp: sempStatus,
    monitoring: monitoringStatus,
  }
}

/**
 * Check if a workflow step is accessible (not locked)
 * @param {string} stepId - Step ID (screening, assessment, semp, monitoring)
 * @param {Object} workflow - Derived workflow object
 * @returns {boolean} True if step is accessible
 */
export function isStepAccessible(stepId, workflow) {
  if (!workflow) return stepId === 'screening'

  const step = workflow[stepId]
  if (!step) return false

  return !step.locked
}

/**
 * Check if a workflow step is completed
 * @param {string} stepId - Step ID
 * @param {Object} workflow - Derived workflow object
 * @returns {boolean} True if step is completed
 */
export function isStepCompleted(stepId, workflow) {
  if (!workflow) return false

  const step = workflow[stepId]
  if (!step) return false

  return step.status === WORKFLOW_STATUS.APPROVED || step.status === WORKFLOW_STATUS.COMPLETED
}

/**
 * Get the next action for a project based on workflow
 * @param {Object} workflow - Derived workflow object
 * @returns {Object} Next action details
 */
export function getNextAction(workflow) {
  if (!workflow) {
    return {
      tool: 1,
      path: 'screening',
      title: 'Start Screening',
      description: 'Begin the environmental screening process for this project.',
    }
  }

  // --- Screening Logic ---
  const screeningStatus = workflow.screening?.status

  if (screeningStatus === WORKFLOW_STATUS.PENDING || screeningStatus === WORKFLOW_STATUS.DRAFT) {
    return {
      tool: 1,
      path: 'screening',
      title: screeningStatus === WORKFLOW_STATUS.PENDING ? 'Start Screening' : 'Complete Screening',
      description: 'Complete the environmental screening form to categorize project risk.',
    }
  }

  if (screeningStatus === WORKFLOW_STATUS.REJECTED) {
    return {
      tool: 1,
      path: 'screening',
      title: 'Revise Screening',
      description: 'Your screening was rejected. Please review feedback and resubmit.',
    }
  }

  if (screeningStatus === WORKFLOW_STATUS.SUBMITTED) {
    return {
      tool: 1,
      path: 'screening',
      title: 'Pending Approval',
      description: 'The screening is pending approval from a reviewer.',
    }
  }

  // --- Assessment Logic (after screening is approved) ---
  const assessmentStatus = workflow.assessment?.status

  if (assessmentStatus === WORKFLOW_STATUS.PENDING) {
    return {
      tool: 2,
      path: 'assessment',
      title: 'Start Assessment',
      description: 'Begin the environmental impact assessment process.',
    }
  }

  if (assessmentStatus === WORKFLOW_STATUS.DRAFT || assessmentStatus === WORKFLOW_STATUS.IN_PROGRESS) {
    return {
      tool: 2,
      path: 'assessment',
      title: 'Continue Assessment',
      description: 'Continue working on the environmental impact assessment.',
    }
  }

  if (assessmentStatus === WORKFLOW_STATUS.REJECTED) {
    return {
      tool: 2,
      path: 'assessment',
      title: 'Revise Assessment',
      description: 'Your assessment was rejected. Please review feedback and resubmit.',
    }
  }

  if (assessmentStatus === WORKFLOW_STATUS.SUBMITTED) {
    return {
      tool: 2,
      path: 'assessment',
      title: 'Pending Approval',
      description: 'The assessment is pending approval from a reviewer.',
    }
  }

  // --- SEMP Logic (after assessment is approved) ---
  const sempStatus = workflow.semp?.status

  if (sempStatus !== WORKFLOW_STATUS.COMPLETED) {
    return {
      tool: 3,
      path: 'semp',
      title: 'Complete Management Plan (SEMP)',
      description:
        'The environmental assessment has been approved. Please proceed with defining mitigation strategies.',
    }
  }

  // --- Monitoring Logic ---
  const monitoringStatus = workflow.monitoring?.status

  if (monitoringStatus === WORKFLOW_STATUS.COMPLETED) {
    return {
      tool: 5,
      path: 'monitoring',
      title: 'Monitoring Complete',
      description: 'All monitoring activities have been completed.',
    }
  }

  return {
    tool: 5,
    path: 'monitoring',
    title: 'Start Monitoring',
    description: 'Begin monitoring and reporting environmental indicators.',
  }
}

/**
 * Calculate overall project status from workflow
 * @param {Object} workflow - Derived workflow object
 * @returns {string} Project status
 */
export function calculateProjectStatusFromWorkflow(workflow) {
  if (!workflow) return 'draft'

  // Check for any rejected status (needs action)
  const hasRejected = Object.values(workflow).some((step) => step.status === WORKFLOW_STATUS.REJECTED)
  if (hasRejected) return 'needs_action'

  // Check if all steps are completed
  const allCompleted = Object.values(workflow).every(
    (step) => step.status === WORKFLOW_STATUS.APPROVED || step.status === WORKFLOW_STATUS.COMPLETED
  )
  if (allCompleted) return 'completed'

  // Check if monitoring is in progress
  if (workflow.monitoring?.status === WORKFLOW_STATUS.IN_PROGRESS) {
    return 'monitoring'
  }

  // Check if screening hasn't started
  if (
    workflow.screening?.status === WORKFLOW_STATUS.PENDING ||
    workflow.screening?.status === WORKFLOW_STATUS.DRAFT
  ) {
    return 'draft'
  }

  return 'in_progress'
}
