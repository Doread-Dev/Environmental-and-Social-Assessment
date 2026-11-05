/**
 * ConfirmUserActionModal
 * Asks before deactivating a user or resetting their password. An in-app dialog rather than
 * window.confirm, which some browsers and embedded views suppress (the shared ConfirmDialog).
 */
import { ConfirmDialog } from '@/components/ui'

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
    <ConfirmDialog
      title={copy.title}
      message={<p>{copy.body(user.name)}</p>}
      variant={copy.variant}
      confirmLabel={copy.confirm}
      confirmIcon={copy.icon}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}

export default ConfirmUserActionModal
