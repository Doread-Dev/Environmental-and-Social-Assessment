import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { useAuth, USER_ROLES } from '@/contexts'

/**
 * SettingsRouteGuard
 * Guards Settings routes - only Environmental Specialist can access
 */
function SettingsRouteGuard() {
  const location = useLocation()
  const outletContext = useOutletContext()
  const { user, isLoading } = useAuth()

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

  // Only Environmental Specialist can access settings
  if (!user || user.role !== USER_ROLES.ENVIRONMENTAL_SPECIALIST) {
    return (
      <Navigate to="/app/dashboard" replace state={{ from: location }} />
    )
  }

  return <Outlet context={outletContext} />
}

export default SettingsRouteGuard
