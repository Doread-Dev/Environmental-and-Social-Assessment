import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'

/**
 * App Component
 * Root application component with router provider
 */
function App() {
  return <RouterProvider router={router} />
}

export default App
