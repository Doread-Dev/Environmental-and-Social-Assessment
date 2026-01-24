import { Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from './routes.config'

/**
 * ProtectedRoute Component
 * Wrapper component that protects routes requiring authentication
 *
 * Note: This is a placeholder for future authentication implementation.
 * Currently allows all access.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string[]} props.allowedRoles - Optional array of roles allowed to access this route
 */
function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation()

  // TODO: Replace with actual auth check
  // const { isAuthenticated, user } = useAuth()
  const isAuthenticated = true // Placeholder - always authenticated
  const user = { role: 'admin' } // Placeholder user

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // Check if user has required role (if roles are specified)
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.includes(user?.role)

    if (!hasRequiredRole) {
      // Redirect to dashboard or unauthorized page
      return <Navigate to={ROUTES.DASHBOARD} replace />
    }
  }

  return children
}

export default ProtectedRoute
