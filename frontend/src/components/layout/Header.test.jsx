// Phase 12 (D76 3): the app header (theme switch, user menu with Profile / Settings / Sign Out)
// and the Profile page (account details, own password change, D23).
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import api from '@/services/api'
import Header from './Header'
import ProfilePage from '@/pages/profile/ProfilePage'
import { mockGet, ok, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), put: vi.fn() },
}))

const me = (user, permissions = []) => ({
  user: {
    _id: 'u1',
    name: 'Rana Haddad',
    email: 'rana@example.com',
    role: 'project_manager',
    ...user,
  },
  permissions,
  password_rules: { min_length: 6 },
})

const routes = [
  { path: '/app/dashboard', element: <Header /> },
  { path: '/app/profile', element: <p>profile page</p> },
  { path: '/app/settings', element: <p>settings page</p> },
  { path: '/login', element: <p>login page</p> },
]

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('switches the theme', async () => {
    signIn()
    mockGet(api, { '/auth/me': me() })
    renderApp(routes, '/app/dashboard')

    fireEvent.click(await screen.findByRole('button', { name: 'Switch to dark mode' }))
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('opens the user menu with the role label; Profile navigates; no Settings without access', async () => {
    signIn()
    mockGet(api, { '/auth/me': me() })
    const { router } = renderApp(routes, '/app/dashboard')

    fireEvent.click(await screen.findByRole('button', { name: /Rana Haddad/ }))
    // The role label in the button and again in the open menu
    expect(screen.getAllByText('Project Manager').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Profile' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/app/profile'))
  })

  it('shows the release version at the bottom of the user menu (D77)', async () => {
    signIn()
    mockGet(api, { '/auth/me': me() })
    renderApp(routes, '/app/dashboard')

    expect(screen.queryByText(/^ESMS v/)).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: /Rana Haddad/ }))
    expect(screen.getByText('ESMS v2.0.1')).toBeInTheDocument()
  })

  it('shows Settings to users who may open it', async () => {
    signIn({ user: { _id: 'u1', name: 'Admin', role: 'admin' } })
    mockGet(api, { '/auth/me': me({ name: 'Admin', role: 'admin' }, ['manage_users']) })
    const { router } = renderApp(routes, '/app/dashboard')

    fireEvent.click(await screen.findByRole('button', { name: /Admin/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Settings' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/app/settings'))
  })

  it('signs out to the login page and clears the session', async () => {
    signIn()
    mockGet(api, { '/auth/me': me() })
    const { router } = renderApp(routes, '/app/dashboard')

    fireEvent.click(await screen.findByRole('button', { name: /Rana Haddad/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(localStorage.getItem('token')).toBeNull()
  })
})

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows the account details and changes the own password', async () => {
    signIn()
    mockGet(api, {
      '/auth/me': me({ job_title: { title_name: 'Field Engineer' } }),
    })
    api.put.mockImplementation(() => ok(me()))
    renderApp([{ path: '/app/profile', element: <ProfilePage /> }], '/app/profile')

    expect(await screen.findByText('rana@example.com')).toBeInTheDocument()
    expect(screen.getByText('Project Manager')).toBeInTheDocument()
    expect(screen.getByText('Field Engineer')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Current password/), { target: { value: 'old-pass' } })
    fireEvent.change(screen.getByLabelText(/^New password/), { target: { value: 'new-pass-1' } })
    fireEvent.change(screen.getByLabelText(/Confirm new password/), {
      target: { value: 'new-pass-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/auth/password', {
        current_password: 'old-pass',
        new_password: 'new-pass-1',
      })
    )
    expect(await screen.findByText('Password changed')).toBeInTheDocument()
  })

  it('says "Not specified" for a missing job title', async () => {
    signIn()
    mockGet(api, { '/auth/me': me() })
    renderApp([{ path: '/app/profile', element: <ProfilePage /> }], '/app/profile')
    expect(await screen.findByText('Not specified')).toBeInTheDocument()
  })
})
