/**
 * Labels for the critical-actions log (D65, Settings → Activity log). The action names come from
 * the backend (models/auditLog.model.js); this is the only place that turns them into text.
 */
import { ROLE_LABELS } from '@/contexts'
import { formatFileSize } from './formatFileSize'

export const AUDIT_ACTION_LABELS = {
  'project.delete': 'Project deleted',
  'project.purge': 'Project permanently deleted',
  'project.archive': 'Project archived',
  'project.restore': 'Project restored',
  'file.delete': 'File deleted',
  'library.replace_file': 'Library PDF replaced',
  'library.delete': 'Library document deleted',
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

/** Badge colour: removals red, archive/restore and file replacement amber, user changes blue. */
export function auditActionVariant(action) {
  if (/\.(delete|purge|rows_removed)$/.test(action)) return 'error'
  if (action.startsWith('project.') || action === 'library.replace_file') return 'warning'
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
  { label: 'Library', all: 'library.', options: actionsOf('library.') },
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
  library_document: 'Library document',
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

// Project file areas: "documents" since phase 7b (D64 d); "annex" in entries written before it.
const AREA_LABELS = {
  documents: 'Project documents',
  annex: 'Annex (before phase 7b)',
  semp_record: 'SEMP records',
}

/**
 * A file category: a place key (labels from GET /lookups), "other", or an old Annex A–H category
 * (annex_a … annex_h) of an entry written before phase 7b.
 */
const categoryLabel = (placeLabel) => (category) => {
  if (category === 'other') return 'Other'
  const annex = /^annex_([a-h])$/.exec(category)
  if (annex) return `Annex ${annex[1].toUpperCase()} (before phase 7b)`
  return placeLabel(category)
}

const placesLabel = (placeLabel) => (places) =>
  Array.isArray(places) && places.length > 0
    ? places.map(placeLabel).join(', ')
    : 'General — Library only'

const rowCounts = (rows) =>
  [
    `${rows.management_activities ?? 0} management activities`,
    `${rows.mitigation_plans ?? 0} mitigation plan rows`,
    `${rows.monitoring_records ?? 0} monitoring records`,
  ].join(', ')

/**
 * Snapshot and details fields shown when a row is expanded, in this order. Ids are left out
 * (copied names are shown instead); unknown fields are not shown.
 * @param {(key: string) => string} placeLabel
 */
const fieldsWith = (placeLabel) => [
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
  ['description', 'Description'],
  ['places', 'Shown in', placesLabel(placeLabel)],
  ['area', 'Area', (v) => AREA_LABELS[v] ?? v],
  ['category', 'Category', categoryLabel(placeLabel)],
  ['size', 'Size', formatFileSize],
  ['old_name', 'Old file'],
  ['old_size', 'Old size', formatFileSize],
  ['new_name', 'New file'],
  ['new_size', 'New size', formatFileSize],
  ['mime_type', 'Type'],
  ['uploaded_by_name', 'Uploaded by'],
  ['uploaded_at', 'Uploaded on', formatDateTime],
  ['removed', 'Rows removed', (v) => String(v)],
]

/**
 * What the expanded row shows: labelled fields from snapshot + details, and the removed rows of a
 * bulk save (serial number + description).
 * @param {Object} entry - An audit-log entry from GET /audit-logs
 * @param {{placeLabel?: (key: string) => string}} [options] - place labels (useLookups)
 * @returns {{ fields: Array<{label: string, value: string}>, rows: Array<{key: string, serial: *, description: string}> }}
 */
export function describeAuditEntry(entry, { placeLabel = (key) => key } = {}) {
  const data = { ...(entry.snapshot ?? {}), ...(entry.details ?? {}) }
  const fields = fieldsWith(placeLabel)
    .filter(([key]) => data[key] !== undefined && data[key] !== null)
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
