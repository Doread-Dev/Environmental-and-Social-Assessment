/**
 * ConfirmDeleteModal
 * Asks before deleting a file or a library document (in-app dialog: some embedded views suppress
 * window.confirm).
 */
import { Modal, Button, Icon } from '@/components/ui'

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
    <Modal isOpen onClose={onClose} title={title} size="lg">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-main dark:text-white">
          Delete <span dir="auto">&quot;{name}&quot;</span>? {note}
        </p>
        <Modal.Footer className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            isLoading={isDeleting}
            leftIcon={<Icon name="delete" />}
          >
            Delete
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  )
}

export default ConfirmDeleteModal
