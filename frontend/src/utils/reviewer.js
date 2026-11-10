/**
 * Who approved or rejected a screening / assessment, for the "Approved By" / "Position" fields
 * (D16). The populated `approved_by` / `reject_by` is used first; when it is missing (or only an
 * id), the last matching `status_history` entry fills it, so an approved record never shows
 * empty fields.
 */
import { ROLE_LABELS } from './roles'

const asUser = (value) => (value && typeof value === 'object' && value.name ? value : null)

/**
 * Position of a user: job title, else the role label; '' when unknown.
 * @param {Object} user
 * @returns {string}
 */
export function positionOf(user) {
  return user?.job_title?.title_name || ROLE_LABELS[user?.role] || ''
}

/**
 * @param {Object} record - screening or assessment
 * @param {'approved'|'rejected'} kind
 * @returns {{ name: string, position: string, at: string|null } | null}
 */
export function getReviewer(record, kind = 'approved') {
  if (!record) return null
  const field = kind === 'rejected' ? record.reject_by : record.approved_by
  const entry = [...(record.status_history || [])].reverse().find((e) => e?.status === kind)
  const fromField = asUser(field)
  const fromHistory = asUser(entry?.by)
  const user = fromField || fromHistory
  if (!user) return null
  return {
    name: user.name,
    position: positionOf(fromField) || positionOf(fromHistory),
    at: entry?.at || null,
  }
}
