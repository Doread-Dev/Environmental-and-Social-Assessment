import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { ROUTES } from './routes.config'
import { LoadingState } from '@/components/ui'

/**
 * ProtectedRoute Component
 * Wrapper component that protects routes requiring authentication
 *
 * Features:
 * - Validates user authentication via AuthContext (and waits for the user's permissions)
 * - Redirects to login with return URL preservation
 * - Sends a user with a pending forced password change (D22) to the change-password screen
 * - Shows loading state while verifying auth status
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 */
function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth()

  // Show loading state while checking auth
  if (isLoading) {
    return <LoadingState message="Verifying authentication..." variant="screen" />
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // The backend answers 403 everywhere until the password is changed
  if (mustChangePassword) {
    return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />
  }

  return children
}

export default ProtectedRoute
