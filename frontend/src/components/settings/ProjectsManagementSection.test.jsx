import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import api from '@/services/api'
import { ProjectsManagementSection } from './ProjectsManagementSection'
import { ok, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const ADMIN = { _id: 'a1', name: 'Admin One', email: 'admin@example.com', role: 'admin' }

const ACTIVE = [
  {
    _id: 'p1',
    title: 'Water Network',
    location: 'Aleppo',
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-02T10:00:00Z',
    allowed_actions: ['project.edit', 'project.archive', 'project.delete'],
  },
  {
    _id: 'p2',
    title: 'Approved School',
    location: 'Homs',
    allowed_actions: ['project.edit', 'project.archive'],
  },
]
const ARCHIVED = [
  {
    _id: 'p9',
    title: 'Old Clinic',
    location: 'Hama',
    archived: true,
    archived_at: '2026-10-20T10:00:00Z',
    allowed_actions: ['project.restore', 'project.delete', 'project.purge', 'export'],
  },
]

function mockApi({ archived = ARCHIVED } = {}) {
  api.get.mockImplementation((url, config) => {
    if (url === '/auth/me') return ok({ user: ADMIN, permissions: ['delete_project'] })
    if (url === '/projects') return ok(config?.params?.archived ? archived : ACTIVE)
    return Promise.reject(new Error(`No mock for GET ${url}`))
  })
  api.patch.mockImplementation(() => ok({}))
  api.delete.mockImplementation(() => ok(null))
}

const renderSection = () => renderApp([{ path: '/', element: <ProjectsManagementSection /> }], '/')

const row = (title) => screen.getByText(title).closest('tr')
const dialog = () => screen.getByRole('dialog')

describe('Settings → Projects: archive, restore, delete, purge (D17, D60)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn({ user: ADMIN })
    // Like the embedded browser pane: window.confirm is never used
    vi.spyOn(window, 'confirm').mockReturnValue(false)
  })

  it('shows only the actions the backend allows for each active project', async () => {
    mockApi()
    renderSection()
    await screen.findByText('Water Network')
    expect(within(row('Water Network')).getByRole('button', { name: /Archive/ })).toBeVisible()
    expect(within(row('Water Network')).getByRole('button', { name: /Delete/ })).toBeVisible()
    // approved work: archive only (D17)
    expect(within(row('Approved School')).queryByRole('button', { name: /Delete/ })).toBeNull()
    expect(within(row('Approved School')).getByRole('button', { name: /Archive/ })).toBeVisible()
  })

  it('archives after confirming in the app dialog', async () => {
    mockApi()
    renderSection()
    await screen.findByText('Water Network')
    fireEvent.click(within(row('Water Network')).getByRole('button', { name: /Archive/ }))
    expect(within(dialog()).getByText(/becomes read-only/)).toBeInTheDocument()
    fireEvent.click(within(dialog()).getByRole('button', { name: /Archive/ }))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/projects/p1/archive'))
    expect(await screen.findByText('Project archived')).toBeInTheDocument()
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('cancel writes nothing', async () => {
    mockApi()
    renderSection()
    await screen.findByText('Water Network')
    fireEvent.click(within(row('Water Network')).getByRole('button', { name: /Delete/ }))
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Cancel' }))
    expect(api.delete).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lists archived projects with an Archived badge; restore and permanent delete', async () => {
    mockApi()
    renderSection()
    await screen.findByText('Water Network')
    fireEvent.change(screen.getByRole('combobox', { name: 'Projects shown' }), {
      target: { value: 'archived' },
    })
    await screen.findByText('Old Clinic')
    expect(api.get).toHaveBeenCalledWith('/projects', { params: { archived: true } })
    expect(within(row('Old Clinic')).getByText('Archived')).toBeInTheDocument()
    expect(within(row('Old Clinic')).getByText('20 Oct 2026')).toBeInTheDocument()

    fireEvent.click(within(row('Old Clinic')).getByRole('button', { name: /Restore/ }))
    fireEvent.click(within(dialog()).getByRole('button', { name: /Restore/ }))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/projects/p9/restore'))

    fireEvent.click(within(row('Old Clinic')).getByRole('button', { name: /Delete permanently/ }))
    expect(within(dialog()).getByText(/approved work and files included/)).toBeInTheDocument()
    fireEvent.click(within(dialog()).getByRole('button', { name: /Delete permanently/ }))
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/projects/p9/purge'))
    expect(await screen.findByText('Project deleted permanently')).toBeInTheDocument()
  })

  it('no "Delete permanently" without project.purge (specialists, D60)', async () => {
    mockApi({
      archived: [{ ...ARCHIVED[0], allowed_actions: ['project.restore', 'project.delete'] }],
    })
    renderSection()
    await screen.findByText('Water Network')
    fireEvent.change(screen.getByRole('combobox', { name: 'Projects shown' }), {
      target: { value: 'archived' },
    })
    await screen.findByText('Old Clinic')
    expect(within(row('Old Clinic')).getByRole('button', { name: /Restore/ })).toBeVisible()
    expect(within(row('Old Clinic')).queryByRole('button', { name: /permanently/ })).toBeNull()
  })

  it('shows the backend error when an action fails', async () => {
    mockApi()
    api.patch.mockImplementation(() => {
      const err = new Error('x')
      err.response = { status: 409, data: { success: false, error: 'Project is archived' } }
      return Promise.reject(err)
    })
    renderSection()
    await screen.findByText('Water Network')
    fireEvent.click(within(row('Water Network')).getByRole('button', { name: /Archive/ }))
    fireEvent.click(within(dialog()).getByRole('button', { name: /Archive/ }))
    expect(await screen.findByText('Project is archived')).toBeInTheDocument()
  })
})
