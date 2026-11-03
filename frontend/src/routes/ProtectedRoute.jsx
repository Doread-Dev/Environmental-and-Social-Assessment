import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { ROUTES } from './routes.config'

/**
 * ProtectedRoute Component
 * Wrapper component that protects routes requiring authentication
 *
 * Features:
 * - Validates user authentication via AuthContext (and waits for the user's permissions)
 * - Redirects to login with return URL preservation
 * - Shows loading state while verifying auth status
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 */
function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">
            Verifying authentication...
          </p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
