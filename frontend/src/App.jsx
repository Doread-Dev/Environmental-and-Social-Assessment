import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OfflineBanner } from '@/components/OfflineBanner'

/**
 * App Component
 * Root application component with router provider
 */
function App() {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}

export default App
