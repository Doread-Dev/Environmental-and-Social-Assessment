import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import api from '@/services/api'
import ProtectedRoute from './ProtectedRoute'
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage'
import { mockGet, ok, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), put: vi.fn() },
}))

const routes = [
  { path: '/login', element: <p>login page</p> },
  { path: '/change-password', element: <ChangePasswordPage /> },
  {
    path: '/app/dashboard',
    element: (
      <ProtectedRoute>
        <p>dashboard page</p>
      </ProtectedRoute>
    ),
  },
]

const me = (user) => ({
  user: { _id: 'u1', name: 'Rana', role: 'viewer', ...user },
  permissions: [],
  password_rules: { min_length: 6 },
})

describe('forced password change (D22)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('sends a user with must_change_password to the change-password screen', async () => {
    signIn()
    mockGet(api, { '/auth/me': me({ must_change_password: true }) })

    const { router } = renderApp(routes, '/app/dashboard')

    expect(await screen.findByText('Change your password')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/change-password')
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument()
  })

  it('after the change, the app opens on the dashboard', async () => {
    signIn()
    mockGet(api, { '/auth/me': me({ must_change_password: true }) })
    api.put.mockImplementation(() => ok(me({ must_change_password: false })))
    const type = (label, value) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } })

    const { router } = renderApp(routes, '/change-password')
    await screen.findByText('Change your password')
    type(/^Current password/, 'Temp12345678')
    type(/^New password/, 'my-own-pass')
    type(/^Confirm new password/, 'my-own-pass')
    fireEvent.click(screen.getByRole('button', { name: /Save and Continue/ }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/dashboard'))
    expect(api.put).toHaveBeenCalledWith('/auth/password', {
      current_password: 'Temp12345678',
      new_password: 'my-own-pass',
    })
    expect(await screen.findByText('dashboard page')).toBeInTheDocument()
  })

  it('a user without a pending change is sent from the screen to the dashboard', async () => {
    signIn()
    mockGet(api, { '/auth/me': me({ must_change_password: false }) })

    const { router } = renderApp(routes, '/change-password')

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/dashboard'))
  })

  it('signed out: the screen sends to login', async () => {
    const { router } = renderApp(routes, '/change-password')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
})
