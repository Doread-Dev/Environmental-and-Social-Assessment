import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { useAuth } from '@/contexts'

/**
 * SettingsRouteGuard
 * Guards Settings routes: user management (admin) or project deletion (specialist / admin)
 */
function SettingsRouteGuard() {
  const location = useLocation()
  const outletContext = useOutletContext()
  const { user, isLoading, canAccessSettings } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">
            Loading settings access...
          </p>
        </div>
      </div>
    )
  }

  if (!user || !canAccessSettings) {
    return <Navigate to="/app/dashboard" replace state={{ from: location }} />
  }

  return <Outlet context={outletContext} />
}

export default SettingsRouteGuard
