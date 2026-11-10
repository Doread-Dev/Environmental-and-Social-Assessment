import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { LoadingState } from '@/components/ui'

/**
 * SettingsRouteGuard
 * Guards Settings routes: user management (admin) or project deletion (specialist / admin)
 */
function SettingsRouteGuard() {
  const location = useLocation()
  const outletContext = useOutletContext()
  const { user, isLoading, canAccessSettings } = useAuth()

  if (isLoading) {
    return <LoadingState message="Loading settings access..." />
  }

  if (!user || !canAccessSettings) {
    return <Navigate to="/app/dashboard" replace state={{ from: location }} />
  }

  return <Outlet context={outletContext} />
}

export default SettingsRouteGuard
