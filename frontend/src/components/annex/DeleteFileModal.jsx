/**
 * DeleteFileModal
 * Asks before deleting a file (in-app dialog: some embedded views suppress window.confirm).
 */
import { Modal, Button, Icon } from '@/components/ui'

export function DeleteFileModal({ file, isDeleting, onConfirm, onClose }) {
  return (
    <Modal isOpen onClose={onClose} title="Delete file" size="lg">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-main dark:text-white">
          Delete <span dir="auto">&quot;{file.original_name}&quot;</span>? The file is removed for
          everyone and cannot be recovered.
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

export default DeleteFileModal
