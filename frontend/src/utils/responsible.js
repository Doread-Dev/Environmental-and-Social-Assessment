const idOf = (value) => (value && typeof value === 'object' ? value._id : value)

/**
 * "Responsible" (Tools 3, 4, 5) is a user or an external party, never both (D55); the backend
 * clears whichever is not sent, so both always go out. The tables only offer the user picker:
 * a picked user replaces the external party.
 * @param {Object} row - Row or record (`responsible` may be a populated user)
 * @returns {{ responsible: string|null, responsible_text: string }}
 */
export function responsibleFields(row) {
  const responsible = idOf(row.responsible) || null
  return responsible
    ? { responsible, responsible_text: '' }
    : { responsible: null, responsible_text: row.responsible_text ?? '' }
}
