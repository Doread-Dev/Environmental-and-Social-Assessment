import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import api from '@/services/api'
import { UsersManagementSection } from './UsersManagementSection'
import SettingsPage from '@/pages/settings/SettingsPage'
import { mockGet, ok, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const ADMIN = { _id: 'a1', name: 'Admin One', email: 'admin@example.com', role: 'admin' }
const USERS = [
  { ...ADMIN, is_active: true },
  {
    _id: 'u2',
    name: 'Sara Field',
    email: 'sara@example.com',
    role: 'project_manager',
    is_active: true,
    job_title: { _id: 'j1', title_name: 'Engineer' },
  },
  { _id: 'u3', name: 'Old Viewer', email: 'old@example.com', role: 'viewer', is_active: false },
]

function renderSection({ permissions = ['manage_users', 'delete_project'] } = {}) {
  signIn({ user: ADMIN })
  mockGet(api, {
    '/auth/me': { user: ADMIN, permissions },
    '/users': USERS,
    '/lookups': {
      impact_categories: [],
      impact_questions: [],
      indicators: [],
      job_titles: [{ _id: 'j1', title_name: 'Engineer' }],
    },
    '/projects': [],
  })
  return renderApp([{ path: '/', element: <UsersManagementSection /> }], '/')
}

const row = (name) => screen.getByText(name).closest('tr')
// The in-app confirmation dialog's button
const confirmIn = (name) =>
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name }))

describe('Settings → Users (D21, D22)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Like the embedded browser pane: window.confirm returns false without showing anything. The
    // section must not depend on it.
    vi.spyOn(window, 'confirm').mockReturnValue(false)
  })

  it('lists active users by default; the filter shows inactive ones', async () => {
    renderSection()
    expect(await screen.findByText('Sara Field')).toBeInTheDocument()
    expect(screen.getByText('Engineer')).toBeInTheDocument()
    expect(screen.queryByText('Old Viewer')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Status filter'), { target: { value: 'inactive' } })
    expect(screen.getByText('Old Viewer')).toBeInTheDocument()
    expect(screen.queryByText('Sara Field')).not.toBeInTheDocument()
  })

  it('creates a user (any role, admin included) and shows the temporary password once', async () => {
    api.post.mockImplementation(() =>
      ok({
        user: { _id: 'u9', name: 'New Admin', email: 'new@example.com', role: 'admin' },
        temporary_password: 'Tmp4Xy7Qz9Ab',
      })
    )
    renderSection()
    fireEvent.click(await screen.findByRole('button', { name: /Add User/ }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByLabelText(/Password/)).not.toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText(/^Name/), { target: { value: 'New Admin' } })
    fireEvent.change(within(dialog).getByLabelText(/^Email/), {
      target: { value: 'new@example.com' },
    })
    fireEvent.change(within(dialog).getByLabelText(/^Role/), { target: { value: 'admin' } })
    await within(dialog).findByRole('option', { name: 'Engineer' }) // job titles load from /lookups
    fireEvent.change(within(dialog).getByLabelText(/^Job title/), { target: { value: 'j1' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /Create User/ }))

    expect(await screen.findByTestId('temporary-password')).toHaveTextContent('Tmp4Xy7Qz9Ab')
    expect(api.post).toHaveBeenCalledWith('/users', {
      name: 'New Admin',
      email: 'new@example.com',
      role: 'admin',
      job_title: 'j1',
    })

    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByTestId('temporary-password')).not.toBeInTheDocument()
  })

  it('edits name, role and job title (email is read-only)', async () => {
    api.put.mockImplementation(() => ok({}))
    renderSection()
    await screen.findByText('Sara Field')
    fireEvent.click(screen.getByRole('button', { name: 'Edit Sara Field' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText(/^Email/)).toBeDisabled()
    fireEvent.change(within(dialog).getByLabelText(/^Name/), { target: { value: 'Sara F.' } })
    fireEvent.change(within(dialog).getByLabelText(/^Role/), { target: { value: 'viewer' } })
    fireEvent.change(within(dialog).getByLabelText(/^Job title/), { target: { value: '' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /Save Changes/ }))

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/users/u2', {
        name: 'Sara F.',
        role: 'viewer',
        job_title: null,
      })
    )
  })

  it('deactivates after confirming in the in-app dialog, and reactivates without one', async () => {
    api.patch.mockImplementation(() => ok({}))
    renderSection()
    await screen.findByText('Sara Field')

    fireEvent.click(within(row('Sara Field')).getByRole('button', { name: /Deactivate/ }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Deactivate "Sara Field"?')
    expect(api.patch).not.toHaveBeenCalled()
    confirmIn('Deactivate')
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/users/u2/deactivate'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(window.confirm).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Status filter'), { target: { value: 'inactive' } })
    fireEvent.click(within(row('Old Viewer')).getByRole('button', { name: /Reactivate/ }))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/users/u3/reactivate'))
  })

  it('Cancel in the dialog sends nothing', async () => {
    renderSection()
    await screen.findByText('Sara Field')

    fireEvent.click(within(row('Sara Field')).getByRole('button', { name: /Deactivate/ }))
    confirmIn('Cancel')
    fireEvent.click(within(row('Sara Field')).getByRole('button', { name: /Reset password/ }))
    confirmIn('Cancel')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.patch).not.toHaveBeenCalled()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('resets a password and shows the temporary one with a copy button', async () => {
    api.post.mockImplementation(() => ok({ user: USERS[1], temporary_password: 'Rst8Kp3Mn6Wq' }))
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderSection()
    await screen.findByText('Sara Field')

    fireEvent.click(within(row('Sara Field')).getByRole('button', { name: /Reset password/ }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Reset the password of "Sara Field"?')
    confirmIn('Reset Password')

    expect(await screen.findByTestId('temporary-password')).toHaveTextContent('Rst8Kp3Mn6Wq')
    expect(api.post).toHaveBeenCalledWith('/users/u2/reset-password')
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('Rst8Kp3Mn6Wq'))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('a blocked clipboard says so and selects the password instead of failing silently', async () => {
    api.post.mockImplementation(() => ok({ user: USERS[1], temporary_password: 'Rst8Kp3Mn6Wq' }))
    const writeText = vi.fn(() => Promise.reject(new DOMException('denied', 'NotAllowedError')))
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderSection()
    await screen.findByText('Sara Field')
    fireEvent.click(within(row('Sara Field')).getByRole('button', { name: /Reset password/ }))
    confirmIn('Reset Password')
    await screen.findByTestId('temporary-password')

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not copy automatically')
    expect(window.getSelection().toString()).toBe('Rst8Kp3Mn6Wq')
  })

  it('shows the backend error, e.g. the last active admin', async () => {
    const err = new Error('Conflict')
    err.response = {
      status: 409,
      data: { success: false, error: 'Cannot deactivate the last active admin' },
    }
    api.patch.mockImplementation(() => Promise.reject(err))
    renderSection()
    await screen.findByText('Sara Field')

    fireEvent.click(within(row('Sara Field')).getByRole('button', { name: /Deactivate/ }))
    confirmIn('Deactivate')

    expect(await screen.findByText('Cannot deactivate the last active admin')).toBeInTheDocument()
  })

  it('the own row has no reset or deactivate; other rows keep them (v2.0.1)', async () => {
    renderSection()
    await screen.findByText('Sara Field')

    const own = within(row('Admin One'))
    expect(own.getByRole('button', { name: 'Edit Admin One' })).toBeInTheDocument()
    expect(own.queryByRole('button', { name: /Reset password/ })).not.toBeInTheDocument()
    expect(own.queryByRole('button', { name: /Deactivate/ })).not.toBeInTheDocument()

    const other = within(row('Sara Field'))
    expect(other.getByRole('button', { name: 'Reset password of Sara Field' })).toBeInTheDocument()
    expect(other.getByRole('button', { name: 'Deactivate Sara Field' })).toBeInTheDocument()
  })

  it('editing the own account: the role is read-only, the name can change (v2.0.1)', async () => {
    api.put.mockImplementation(() => ok({}))
    renderSection()
    await screen.findByText('Sara Field')
    fireEvent.click(screen.getByRole('button', { name: 'Edit Admin One' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText(/^Role/)).toBeDisabled()
    expect(within(dialog).getByText('You cannot change your own role')).toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText(/^Name/), { target: { value: 'Admin 1' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /Save Changes/ }))

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/users/a1', {
        name: 'Admin 1',
        role: 'admin',
        job_title: null,
      })
    )
  })

  it("another user's form keeps the role editable", async () => {
    renderSection()
    await screen.findByText('Sara Field')
    fireEvent.click(screen.getByRole('button', { name: 'Edit Sara Field' }))
    expect(within(screen.getByRole('dialog')).getByLabelText(/^Role/)).not.toBeDisabled()
  })
})

describe('Settings page sections follow the permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderPage = (permissions) => {
    signIn({ user: ADMIN })
    mockGet(api, { '/auth/me': { user: ADMIN, permissions }, '/users': USERS, '/projects': [] })
    return renderApp([{ path: '/', element: <SettingsPage /> }], '/')
  }

  it('admin sees users and projects', async () => {
    renderPage(['manage_users', 'delete_project'])
    expect(await screen.findByText('Users Management')).toBeInTheDocument()
    expect(screen.getByText('Manage users and projects')).toBeInTheDocument()
  })

  it('a specialist (no manage_users) sees projects only', async () => {
    renderPage(['delete_project'])
    expect(await screen.findByText('Manage projects')).toBeInTheDocument()
    expect(screen.queryByText('Users Management')).not.toBeInTheDocument()
  })
})
