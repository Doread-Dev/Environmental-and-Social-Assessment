import { useState } from 'react'
import { Alert, Button, Input, Modal } from '@/components/ui'
import { useAuth } from '@/contexts'
import { allowLeaving } from '@/utils/leaveGuard'
import { ROUTES } from '@/routes/routes.config'

/**
 * Sign-in dialog over the page when the session expires mid-edit (D73).
 *
 * Opens when a request answers 401 while a user is signed in (token expired, account
 * deactivated). The page behind stays mounted, so nothing typed is lost; after signing in the
 * user presses Save again (writes are never retried on their own). The email is the current
 * user's and cannot be changed; "Sign in as someone else" ends the session (full logout, cache
 * cleared) and opens the login page.
 */
function SessionExpiredDialog() {
  const { sessionExpired, user } = useAuth()
  if (!sessionExpired) return null
  return <SessionExpiredForm email={user?.email ?? ''} />
}

function SessionExpiredForm({ email }) {
  const { reauthenticate, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) {
      setError('Enter your password.')
      return
    }
    setIsSigningIn(true)
    setError(null)
    const result = await reauthenticate(password)
    // On success the dialog closes (sessionExpired false); on failure it shows why, e.g. a wrong
    // password or "Account is deactivated".
    if (!result.success) {
      setError(result.error)
      setIsSigningIn(false)
    }
  }

  const handleSwitchUser = () => {
    allowLeaving()
    logout()
    window.location.assign(ROUTES.LOGIN)
  }

  return (
    <Modal
      isOpen
      onClose={() => {}}
      closeOnOverlay={false}
      closeOnEscape={false}
      showCloseButton={false}
      title="Your session has expired"
      description="Sign in again to continue. Nothing you typed on this page is lost: after signing in, press Save again."
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        )}
        <Input label="Email" type="email" value={email} readOnly autoComplete="username" />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          disabled={isSigningIn}
        />
        <Modal.Footer className="mt-2 flex-wrap">
          <Button type="button" variant="ghost" onClick={handleSwitchUser} disabled={isSigningIn}>
            Sign in as someone else
          </Button>
          <Button type="submit" variant="primary" isLoading={isSigningIn}>
            Sign in
          </Button>
        </Modal.Footer>
        <p className="text-xs text-text-secondary dark:text-gray-400">
          Signing in as someone else leaves this page; what you typed here is lost.
        </p>
      </form>
    </Modal>
  )
}

export default SessionExpiredDialog
