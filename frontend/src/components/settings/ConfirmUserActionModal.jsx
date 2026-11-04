/**
 * ConfirmUserActionModal
 * Asks before deactivating a user or resetting their password. An in-app dialog rather than
 * window.confirm, which some browsers and embedded views suppress (it then returns false at once).
 */
import { Modal, Button, Icon } from '@/components/ui'

const COPY = {
  deactivate: {
    title: 'Deactivate user',
    body: (name) =>
      `Deactivate "${name}"? They are signed out at once and cannot sign in until reactivated. Their name stays on past work.`,
    confirm: 'Deactivate',
    icon: 'person_off',
    variant: 'danger',
  },
  reset: {
    title: 'Reset password',
    body: (name) =>
      `Reset the password of "${name}"? Their current password stops working. You get a temporary password to give them, and they must choose a new one at next sign-in.`,
    confirm: 'Reset Password',
    icon: 'lock_reset',
    variant: 'primary',
  },
}

export function ConfirmUserActionModal({ action, user, onConfirm, onClose }) {
  const copy = COPY[action]

  return (
    <Modal isOpen onClose={onClose} title={copy.title} size="lg">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-main dark:text-white">{copy.body(user.name)}</p>
        <Modal.Footer className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={copy.variant}
            onClick={onConfirm}
            leftIcon={<Icon name={copy.icon} />}
          >
            {copy.confirm}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  )
}

export default ConfirmUserActionModal
