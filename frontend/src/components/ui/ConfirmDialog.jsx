import Modal from './Modal'
import Button from './Button'

/**
 * The app's confirmation dialog (D71): an in-app Modal, never `window.confirm` (some browsers
 * and embedded views suppress it, so it returns false at once and the button seems dead).
 * Mount it only while it is open.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {React.ReactNode} props.message - What happens if the user confirms
 * @param {string} [props.confirmLabel]
 * @param {string} [props.cancelLabel]
 * @param {string} [props.confirmIcon] - Material Symbols icon name
 * @param {'primary'|'danger'} [props.variant] - `danger` for destructive actions
 * @param {boolean} [props.isLoading] - Confirm button spinner; both buttons disabled
 * @param {Function} props.onConfirm
 * @param {Function} props.onClose - Cancel, Escape or the close button
 *
 * @example
 * {pending && (
 *   <ConfirmDialog title="Delete project" message={`Delete "${title}"?`} variant="danger"
 *     confirmLabel="Delete" confirmIcon="delete" onConfirm={remove} onClose={() => setPending(null)} />
 * )}
 */
function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmIcon,
  variant = 'primary',
  isLoading = false,
  onConfirm,
  onClose,
  children,
}) {
  return (
    <Modal isOpen onClose={isLoading ? () => {} : onClose} title={title} size="lg">
      <div className="flex flex-col gap-4">
        <div className="text-sm text-text-main dark:text-white">{message}</div>
        {children}
        <Modal.Footer className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
            leftIcon={
              confirmIcon ? (
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  {confirmIcon}
                </span>
              ) : undefined
            }
          >
            {confirmLabel}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
