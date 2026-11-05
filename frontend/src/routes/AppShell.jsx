import { Outlet } from 'react-router-dom'
import { UnsavedChangesProvider } from '@/contexts'

/**
 * Root route of the app: holds what every page shares inside the router, i.e. the one
 * unsaved-changes guard (D61; React Router allows one blocker per router).
 */
function AppShell() {
  return (
    <UnsavedChangesProvider>
      <Outlet />
    </UnsavedChangesProvider>
  )
}

export default AppShell
