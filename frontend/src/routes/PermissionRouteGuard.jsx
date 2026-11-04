import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { useAuth } from '@/contexts'

/**
 * PermissionRouteGuard
 * Renders its child routes only for users with `permission` (from GET /auth/me); everyone else is
 * sent to `redirectTo`. Waits for the permissions to load first.
 * @param {{ permission: string, redirectTo: string }} props
 */
function PermissionRouteGuard({ permission, redirectTo }) {
  const location = useLocation()
  const outletContext = useOutletContext()
  const { isLoading, can } = useAuth()

  if (isLoading) return null
  if (!can(permission)) return <Navigate to={redirectTo} replace state={{ from: location }} />
  return <Outlet context={outletContext} />
}

export default PermissionRouteGuard
