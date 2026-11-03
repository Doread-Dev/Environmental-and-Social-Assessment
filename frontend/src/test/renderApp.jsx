/**
 * Renders routes with the app's providers (query cache, auth, theme, toasts) in a memory router.
 * Use with a mocked `@/services/api` (see utils.jsx) and signIn() for a session.
 */
import { render } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { AuthProvider, ThemeProvider } from '@/contexts'
import { ToastProvider } from '@/components/ui'
import { createTestQueryClient } from './utils'

// jsdom has no matchMedia (ThemeProvider reads the system theme)
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

/**
 * @param {Array} routes - react-router route objects
 * @param {string} path - Initial URL
 * @returns {{ router: Object, queryClient: Object }} plus the render result
 */
export function renderApp(routes, path) {
  const queryClient = createTestQueryClient()
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
  return { ...result, router, queryClient }
}
