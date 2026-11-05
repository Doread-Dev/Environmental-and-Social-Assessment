import { Navigate, useNavigate } from 'react-router-dom'
import { Icon, LoadingState, PAGE_TITLE, PAGE_DESCRIPTION } from '@/components/ui'
import { ChangePasswordForm } from '@/components/auth'
import { useAuth } from '@/contexts'
import { ROUTES } from '@/routes/routes.config'

/**
 * ChangePasswordPage - forced password change (D22)
 * Shown after an admin reset or on a new account, before anything else. Layout: AuthLayout.
 * Route: /change-password (signed in only)
 */
function ChangePasswordPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, mustChangePassword, logout } = useAuth()

  if (isLoading) {
    return <LoadingState />
  }
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
  if (!mustChangePassword) return <Navigate to={ROUTES.DASHBOARD} replace />

  const handleSignOut = () => {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <div className="w-full max-w-md bg-surface dark:bg-surface-dark rounded-2xl shadow-xl border border-border-default dark:border-border-dark p-8">
      <div className="flex items-center gap-3 mb-2">
        <Icon name="lock_reset" className="text-3xl text-primary" />
        <h1 className={PAGE_TITLE}>Change your password</h1>
      </div>
      <p className={PAGE_DESCRIPTION}>
        {user?.name ? `${user.name}, your` : 'Your'} password was set by an administrator. Choose
        your own password to continue. Use the temporary password as the current password.
      </p>
      <ChangePasswordForm
        submitLabel="Save and Continue"
        onSuccess={() => navigate(ROUTES.DASHBOARD, { replace: true })}
      />
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-6 text-sm text-text-secondary dark:text-gray-400 hover:text-primary transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}

export default ChangePasswordPage
