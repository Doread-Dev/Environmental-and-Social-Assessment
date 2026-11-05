import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OfflineBanner } from '@/components/OfflineBanner'
import { SessionExpiredDialog } from '@/components/auth'
import { SaveConflictProvider } from '@/contexts'

function App() {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      {/* Stale saves (D62): one dialog for every tool; the layouts remount the page on Reload */}
      <SaveConflictProvider>
        <RouterProvider router={router} />
      </SaveConflictProvider>
      {/* Session expired mid-edit (D73): sign in again over the page, nothing typed is lost */}
      <SessionExpiredDialog />
    </ErrorBoundary>
  )
}

export default App
