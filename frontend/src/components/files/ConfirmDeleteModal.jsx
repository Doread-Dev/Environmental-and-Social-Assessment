/**
 * ConfirmDeleteModal
 * Asks before deleting a file or a library document (the shared ConfirmDialog).
 */
import { ConfirmDialog } from '@/components/ui'

/**
 * @param {Object} props
 * @param {string} props.title - e.g. "Delete file"
 * @param {string} props.name - What is deleted (shown in quotes)
 * @param {string} [props.note] - What else happens
 */
export function ConfirmDeleteModal({
  title,
  name,
  note = 'It is removed for everyone and cannot be recovered.',
  isDeleting,
  onConfirm,
  onClose,
}) {
  return (
    <ConfirmDialog
      title={title}
      message={
        <p>
          Delete <span dir="auto">&quot;{name}&quot;</span>? {note}
        </p>
      }
      variant="danger"
      confirmLabel="Delete"
      confirmIcon="delete"
      isLoading={isDeleting}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}

export default ConfirmDeleteModal
