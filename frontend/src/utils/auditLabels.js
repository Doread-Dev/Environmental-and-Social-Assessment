/**
 * Labels for the critical-actions log (D65, Settings → Activity log). The action names come from
 * the backend (models/auditLog.model.js); this is the only place that turns them into text.
 */
import { ROLE_LABELS } from '@/contexts'
import { annexItems } from './annexTypes'
import { formatFileSize } from './formatFileSize'

export const AUDIT_ACTION_LABELS = {
  'project.delete': 'Project deleted',
  'project.purge': 'Project permanently deleted',
  'project.archive': 'Project archived',
  'project.restore': 'Project restored',
  'file.delete': 'File deleted',
  'management.rows_removed': 'Management activities removed',
  'mitigation.rows_removed': 'Mitigation plan rows removed',
  'user.create': 'User created',
  'user.role_change': 'Role changed',
  'user.deactivate': 'User deactivated',
  'user.reactivate': 'User reactivated',
  'user.reset_password': 'Password reset',
}

/** @param {string} action */
export const auditActionLabel = (action) => AUDIT_ACTION_LABELS[action] ?? action

/** Badge colour: removals red, archive/restore amber, user and access changes blue. */
export function auditActionVariant(action) {
  if (/\.(delete|purge|rows_removed)$/.test(action)) return 'error'
  if (action.startsWith('project.')) return 'warning'
  return 'info'
}

const actionsOf = (prefix) =>
  Object.keys(AUDIT_ACTION_LABELS)
    .filter((action) => action.startsWith(prefix))
    .map((value) => ({ value, label: AUDIT_ACTION_LABELS[value] }))

/**
 * Options of the action filter: each group can be picked as a whole (a prefix such as "user.",
 * which the backend accepts) or one action at a time.
 */
export const AUDIT_ACTION_FILTER_GROUPS = [
  { label: 'Projects', all: 'project.', options: actionsOf('project.') },
  { label: 'Files', all: 'file.', options: actionsOf('file.') },
  {
    label: 'SEMP rows (Tools 3 & 4)',
    all: null,
    options: [...actionsOf('management.'), ...actionsOf('mitigation.')],
  },
  { label: 'Users & access', all: 'user.', options: actionsOf('user.') },
]

export const AUDIT_TARGET_LABELS = {
  project: 'Project',
  file: 'File',
  management_activity: 'Management activities',
  mitigation_plan: 'Mitigation plan',
  user: 'User',
}

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
}

const IMPACT_LABELS = {
  negligible: 'Negligible',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  not_applicable: 'Not applicable',
}

const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const annexLabel = (category) =>
  annexItems.find((item) => item.category === category)?.title ?? category

const rowCounts = (rows) =>
  [
    `${rows.management_activities ?? 0} management activities`,
    `${rows.mitigation_plans ?? 0} mitigation plan rows`,
    `${rows.monitoring_records ?? 0} monitoring records`,
  ].join(', ')

/**
 * Snapshot and details fields shown when a row is expanded, in this order. Ids are left out
 * (copied names are shown instead); unknown fields are not shown.
 */
const FIELDS = [
  ['title', 'Title'],
  ['name', 'Name'],
  ['email', 'Email'],
  ['role', 'Role', (v) => ROLE_LABELS[v] ?? v],
  ['from', 'Old role', (v) => ROLE_LABELS[v] ?? v],
  ['to', 'New role', (v) => ROLE_LABELS[v] ?? v],
  ['location', 'Location'],
  ['screening_status', 'Screening', (v) => STATUS_LABELS[v] ?? v],
  ['screening_category', 'Screening category', (v) => `Category ${v}`],
  ['assessment_status', 'Assessment', (v) => STATUS_LABELS[v] ?? v],
  ['total_project_impact', 'Total impact', (v) => IMPACT_LABELS[v] ?? v],
  ['rows', 'Rows', (v) => (Array.isArray(v) ? null : rowCounts(v))],
  ['files', 'Files', (v) => String(v)],
  ['archived', 'Archived', (v) => (v ? 'Yes' : 'No')],
  ['archived_by_name', 'Archived by'],
  ['archived_at', 'Archived on', formatDateTime],
  ['area', 'Area', (v) => (v === 'annex' ? 'Annex' : v)],
  ['category', 'Category', annexLabel],
  ['size', 'Size', formatFileSize],
  ['mime_type', 'Type'],
  ['uploaded_by_name', 'Uploaded by'],
  ['uploaded_at', 'Uploaded on', formatDateTime],
  ['removed', 'Rows removed', (v) => String(v)],
]

/**
 * What the expanded row shows: labelled fields from snapshot + details, and the removed rows of a
 * bulk save (serial number + description).
 * @param {Object} entry - An audit-log entry from GET /audit-logs
 * @returns {{ fields: Array<{label: string, value: string}>, rows: Array<{key: string, serial: *, description: string}> }}
 */
export function describeAuditEntry(entry) {
  const data = { ...(entry.snapshot ?? {}), ...(entry.details ?? {}) }
  const fields = FIELDS.filter(([key]) => data[key] !== undefined && data[key] !== null)
    .map(([key, label, format]) => ({ label, value: format ? format(data[key]) : data[key] }))
    .filter(({ value }) => value !== null && value !== '')
  const rows = Array.isArray(entry.snapshot?.rows)
    ? entry.snapshot.rows.map((row, index) => ({
        key: row._id ?? index,
        serial: row.serial_number ?? '—',
        description: row.description || '—',
      }))
    : []
  return { fields, rows }
}

export { formatDateTime as formatAuditDate }
