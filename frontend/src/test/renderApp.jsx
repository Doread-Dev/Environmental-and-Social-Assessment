/**
 * Renders routes with the app's providers (query cache, auth, theme, toasts) in a memory router.
 * Use with a mocked `@/services/api` (see utils.jsx) and signIn() for a session.
 */
import { render } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { AuthProvider, SaveConflictProvider, ThemeProvider } from '@/contexts'
import { SessionExpiredDialog } from '@/components/auth'
import AppShell from '@/routes/AppShell'
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
// `path`: the page to open, or a list of history entries (the last one is open; the browser Back
// goes to the one before)
export function renderApp(routes, path) {
  const entries = Array.isArray(path) ? path : [path]
  const queryClient = createTestQueryClient()
  // As the app: one root route with the shared unsaved-changes guard (routes/index.jsx)
  const router = createMemoryRouter([{ element: <AppShell />, children: routes }], {
    initialEntries: entries,
    initialIndex: entries.length - 1,
  })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <SaveConflictProvider>
              <RouterProvider router={router} />
            </SaveConflictProvider>
            <SessionExpiredDialog />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
  return { ...result, router, queryClient }
}
