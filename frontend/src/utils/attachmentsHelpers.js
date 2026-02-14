/**
 * Helpers for grouping attachments by entity type.
 * Used by useFiles and FileListTable. Attachments list comes from API or state.
 */

/**
 * Group attachments by entity_type
 * @param {Array} attachments - List of attachment objects with entity_type
 * @returns {{ project: Array, screening: Array, assessment: Array, monitoring: Array }}
 */
export function groupAttachmentsByType(attachments) {
  if (!Array.isArray(attachments)) {
    return { project: [], screening: [], assessment: [], monitoring: [] }
  }
  return {
    project: attachments.filter((a) => a.entity_type === 'project'),
    screening: attachments.filter((a) => a.entity_type === 'screening'),
    assessment: attachments.filter((a) => a.entity_type === 'assessment'),
    monitoring: attachments.filter((a) => a.entity_type === 'monitoring'),
  }
}
