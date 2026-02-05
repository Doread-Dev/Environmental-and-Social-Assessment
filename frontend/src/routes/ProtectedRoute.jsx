import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { ROUTES } from './routes.config'

/**
 * ProtectedRoute Component
 * Wrapper component that protects routes requiring authentication
 *
 * Features:
 * - Validates user authentication via AuthContext
 * - Supports role-based access control via allowedRoles prop
 * - Redirects to login with return URL preservation
 * - Shows loading state while verifying auth status
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string[]} props.allowedRoles - Optional array of roles allowed to access this route
 */
function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation()
  const { isAuthenticated, isLoading, hasAnyRole } = useAuth()

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // Check if user has required role (if roles are specified)
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = hasAnyRole(allowedRoles)

    if (!hasRequiredRole) {
      // Redirect to dashboard or unauthorized page
      return <Navigate to={ROUTES.DASHBOARD} replace />
    }
  }

  return children
}

export default ProtectedRoute
