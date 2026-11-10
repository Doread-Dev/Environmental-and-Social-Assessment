/**
 * One label + Badge variant for every status the app shows (D71): workflow step statuses
 * (workflow.steps.<step>.status), screening/assessment record statuses, project statuses
 * (workflow.status) and the SEMP table statuses. The statuses themselves come from the backend.
 */
const STATUS_BADGES = {
  // Step / record statuses
  locked: { label: 'Locked', variant: 'default', icon: 'lock' },
  not_started: { label: 'Not Started', variant: 'default' },
  draft: { label: 'Draft', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'info' },
  submitted: { label: 'Submitted', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  completed: { label: 'Completed', variant: 'success' },
  // Project statuses (workflow.status)
  needs_action: { label: 'Needs Action', variant: 'error' },
  monitoring: { label: 'Active Monitoring', variant: 'primary' },
  // Archive
  archived: { label: 'Archived', variant: 'default', icon: 'inventory_2' },
}

/**
 * Badge config of a status; unknown statuses read as "Not Started".
 * @param {string} status
 * @returns {{ label: string, variant: string, icon?: string }}
 */
export function getStatusBadge(status) {
  return STATUS_BADGES[status] || STATUS_BADGES.not_started
}

/** Colour of a status in progress bars (same colour family as its badge). */
const BAR_COLORS = {
  default: 'bg-border-default dark:bg-white/10',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  success: 'bg-primary',
  error: 'bg-red-500',
  primary: 'bg-primary',
}

/**
 * Progress-bar colour of a status.
 * @param {string} status
 * @returns {string}
 */
export function getStatusBarColor(status) {
  return BAR_COLORS[getStatusBadge(status).variant]
}
