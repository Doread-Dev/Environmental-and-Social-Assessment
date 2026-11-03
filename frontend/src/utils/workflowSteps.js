/**
 * Display helpers over the backend workflow state (D30)
 *
 * The backend decides every step status (`workflow.steps.<step>.status`: locked | not_started |
 * in_progress | submitted | approved | rejected | completed). These helpers only read it.
 */

export const WORKFLOW_STEP_ORDER = ['screening', 'assessment', 'semp', 'monitoring']

/**
 * @param {Object|null} workflow - `workflow` from the workspace / project list
 * @param {string} step - screening | assessment | semp | monitoring
 * @returns {string|undefined}
 */
export function getStepStatus(workflow, step) {
  return workflow?.steps?.[step]?.status
}

export function isStepLocked(workflow, step) {
  return getStepStatus(workflow, step) === 'locked'
}

export function isStepDone(workflow, step) {
  const status = getStepStatus(workflow, step)
  return status === 'approved' || status === 'completed'
}

/**
 * The step to send the user to when `step` is locked: the last step before it that is open
 * @returns {string|null} null when `step` is not locked
 */
export function getRedirectStep(workflow, step) {
  if (!isStepLocked(workflow, step)) return null
  const before = WORKFLOW_STEP_ORDER.slice(0, WORKFLOW_STEP_ORDER.indexOf(step))
  return before.reverse().find((s) => !isStepLocked(workflow, s)) ?? 'screening'
}
