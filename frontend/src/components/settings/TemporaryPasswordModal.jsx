/**
 * TemporaryPasswordModal
 * Shows a one-time temporary password (new account or admin reset, D22) with a copy button.
 * The backend returns it only once: closing the modal loses it (a new reset makes another).
 */
import { useRef, useState } from 'react'
import { Modal, Button, Icon } from '@/components/ui'

export function TemporaryPasswordModal({ user, password, onClose }) {
  // null | 'copied' | 'failed'
  const [copyState, setCopyState] = useState(null)
  const passwordRef = useRef(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopyState('copied')
    } catch {
      // Clipboard blocked (plain http, embedded browser, permissions): say so and select the text
      // so the admin can copy it by hand.
      setCopyState('failed')
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(passwordRef.current)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Temporary password" closeOnOverlay={false} size="lg">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-main dark:text-white">
          Give this password to <strong>{user?.name}</strong> ({user?.email}). They must change it
          when they sign in.
        </p>
        <div className="flex items-center gap-3">
          <code
            ref={passwordRef}
            data-testid="temporary-password"
            className="flex-1 select-all rounded-lg border border-border-default dark:border-border-dark bg-background dark:bg-background-dark px-4 py-3 font-mono text-lg tracking-wider text-text-main dark:text-white"
          >
            {password}
          </code>
          <Button
            variant="outline"
            onClick={copy}
            leftIcon={<Icon name={copyState === 'copied' ? 'check' : 'content_copy'} />}
          >
            {copyState === 'copied' ? 'Copied' : 'Copy'}
          </Button>
        </div>
        {copyState === 'failed' && (
          <p role="alert" className="text-sm text-error flex items-center gap-1">
            <Icon name="error" className="text-base" />
            Could not copy automatically. The password is selected: press Ctrl+C to copy it.
          </p>
        )}
        <p className="text-sm text-warning flex items-center gap-1">
          <Icon name="warning" className="text-base" />
          It is shown only once. If it gets lost, reset the password again.
        </p>
        <Modal.Footer className="mt-2">
          <Button onClick={onClose}>Done</Button>
        </Modal.Footer>
      </div>
    </Modal>
  )
}

export default TemporaryPasswordModal
