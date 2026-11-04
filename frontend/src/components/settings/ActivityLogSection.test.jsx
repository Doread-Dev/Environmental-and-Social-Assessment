import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import api from '@/services/api'
import ActivityLogPage from '@/pages/settings/ActivityLogPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import SettingsRouteGuard from '@/routes/SettingsRouteGuard'
import PermissionRouteGuard from '@/routes/PermissionRouteGuard'
import { ROUTES } from '@/routes/routes.config'
import { fail, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const ADMIN = { _id: 'a1', name: 'Admin One', email: 'admin@example.com', role: 'admin' }
const ADMIN_PERMISSIONS = ['manage_users', 'delete_project', 'read_audit_log']

const ENTRIES = [
  {
    _id: 'e1',
    action: 'management.rows_removed',
    by: 'u2',
    by_name: 'Sara Field',
    by_role: 'project_manager',
    project: 'p1',
    project_title: 'Water network',
    target_type: 'management_activity',
    target_id: null,
    target_label: 'Management activities (Tool 3)',
    snapshot: {
      rows: [
        { _id: 'r2', serial_number: 2, description: 'Dig trenches' },
        { _id: 'r3', serial_number: 3, description: 'Lay pipes' },
      ],
    },
    details: { removed: 2 },
    createdAt: '2026-11-03T09:30:00.000Z',
  },
  {
    _id: 'e2',
    action: 'user.role_change',
    by: 'a1',
    by_name: 'Admin One',
    by_role: 'admin',
    project: null,
    project_title: null,
    target_type: 'user',
    target_id: 'u5',
    target_label: 'Omar',
    snapshot: { name: 'Omar', email: 'omar@example.com' },
    details: { from: 'viewer', to: 'project_manager' },
    createdAt: '2026-11-02T08:00:00.000Z',
  },
]

const page = (items, pagination) =>
  Promise.resolve({
    data: {
      success: true,
      data: items,
      pagination: { page: 1, limit: 20, total: items.length, pages: 1, ...pagination },
    },
  })

function mockApi({ permissions = ADMIN_PERMISSIONS, auditLogs } = {}) {
  api.get.mockImplementation((url, config) => {
    if (url === '/auth/me') {
      return Promise.resolve({ data: { success: true, data: { user: ADMIN, permissions } } })
    }
    if (url === '/audit-logs') return auditLogs ? auditLogs(config.params) : page(ENTRIES)
    if (url === '/users' || url === '/projects') {
      return Promise.resolve({ data: { success: true, data: [] } })
    }
    return fail(404, `No mock for GET ${url}`)
  })
}

const auditCalls = () =>
  api.get.mock.calls.filter(([url]) => url === '/audit-logs').map(([, config]) => config.params)

// The settings routes as in routes/index.jsx
const settingsRoutes = [
  {
    path: ROUTES.SETTINGS,
    element: <SettingsRouteGuard />,
    children: [
      { index: true, element: <SettingsPage /> },
      {
        path: 'activity-log',
        element: <PermissionRouteGuard permission="read_audit_log" redirectTo={ROUTES.SETTINGS} />,
        children: [{ index: true, element: <ActivityLogPage /> }],
      },
    ],
  },
  { path: ROUTES.DASHBOARD, element: <p>Dashboard</p> },
]

function renderLog(options) {
  signIn({ user: ADMIN })
  mockApi(options)
  return renderApp(settingsRoutes, ROUTES.SETTINGS_ACTIVITY_LOG)
}

describe('Settings → Activity log (D65)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('lists entries: date, who, readable action, project and target', async () => {
    renderLog()

    const row = (await screen.findByText('Sara Field')).closest('tr')
    expect(within(row).getByText('Project Manager')).toBeInTheDocument()
    expect(within(row).getByText('Management activities removed')).toBeInTheDocument()
    expect(within(row).getByText('Water network')).toBeInTheDocument()
    expect(within(row).getByText('Management activities (Tool 3)')).toBeInTheDocument()
    expect(within(row).getByText(/03 Nov 2026/)).toBeInTheDocument()

    const userRow = screen.getByText('Omar').closest('tr')
    expect(within(userRow).getByText('Role changed')).toBeInTheDocument()
    expect(within(userRow).getByText('—')).toBeInTheDocument() // no project
    expect(auditCalls()).toEqual([{ page: 1, limit: 20 }])
  })

  it('expands a row to show its snapshot', async () => {
    renderLog()
    await screen.findByText('Omar')
    expect(screen.queryByText('Dig trenches')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Show details' })[0])
    expect(screen.getByText('Dig trenches')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
    expect(screen.getByText('Rows removed')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Omar'))
    expect(screen.getByText('omar@example.com')).toBeInTheDocument()
    expect(screen.getByText('Old role').nextSibling).toHaveTextContent('Viewer')
    expect(screen.getByText('New role').nextSibling).toHaveTextContent('Project Manager')

    // Both rows open; closing one keeps the other.
    expect(screen.getAllByRole('button', { name: 'Hide details' })).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button', { name: 'Hide details' })[0])
    expect(screen.queryByText('Dig trenches')).not.toBeInTheDocument()
    expect(screen.getByText('omar@example.com')).toBeInTheDocument()
  })

  it('sends the action filter and goes back to page 1', async () => {
    renderLog({
      auditLogs: (params) =>
        page(params.action ? [ENTRIES[1]] : ENTRIES, { page: params.page, pages: 3, total: 45 }),
    })
    await screen.findByText('Sara Field')

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }))
    await waitFor(() => expect(auditCalls()).toContainEqual({ page: 2, limit: 20 }))

    fireEvent.change(screen.getByLabelText('Action filter'), { target: { value: 'user.' } })
    await waitFor(() => expect(screen.queryByText('Sara Field')).not.toBeInTheDocument())
    expect(auditCalls().at(-1)).toEqual({ page: 1, limit: 20, action: 'user.' })

    fireEvent.change(screen.getByLabelText('Action filter'), {
      target: { value: 'project.purge' },
    })
    await waitFor(() =>
      expect(auditCalls().at(-1)).toEqual({ page: 1, limit: 20, action: 'project.purge' })
    )
  })

  it('shows how many entries there are and pages through them', async () => {
    renderLog({ auditLogs: (params) => page(ENTRIES, { page: params.page, pages: 3, total: 45 }) })
    expect(await screen.findByText('Showing 1–20 of 45')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    expect(await screen.findByText('Showing 41–45 of 45')).toBeInTheDocument()
  })

  it('has an empty state', async () => {
    renderLog({ auditLogs: () => page([]) })
    expect(
      await screen.findByText('No critical actions have been recorded yet')
    ).toBeInTheDocument()
  })

  it('has an error state with a retry', async () => {
    let calls = 0
    renderLog({
      auditLogs: () => (++calls === 1 ? fail(500, 'Server Error') : page(ENTRIES)),
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('Server Error')

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Sara Field')).toBeInTheDocument()
  })

  it('admins get an Activity log tab in Settings', async () => {
    signIn({ user: ADMIN })
    mockApi()
    renderApp(settingsRoutes, ROUTES.SETTINGS)

    const tab = await screen.findByRole('link', { name: /Activity log/ })
    expect(tab).toHaveAttribute('href', ROUTES.SETTINGS_ACTIVITY_LOG)
    fireEvent.click(tab)
    expect(await screen.findByText('Sara Field')).toBeInTheDocument()
  })

  it('a specialist (Settings without the log) has no tab and is redirected', async () => {
    signIn({ user: { ...ADMIN, role: 'environmental_specialist' } })
    mockApi({ permissions: ['delete_project'] })
    const { router } = renderApp(settingsRoutes, ROUTES.SETTINGS_ACTIVITY_LOG)

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.SETTINGS))
    expect(screen.queryByRole('link', { name: /Activity log/ })).not.toBeInTheDocument()
    expect(auditCalls()).toEqual([])
  })

  it('a viewer is sent away from Settings altogether', async () => {
    signIn({ user: { ...ADMIN, role: 'viewer' } })
    mockApi({ permissions: [] })
    const { router } = renderApp(settingsRoutes, ROUTES.SETTINGS_ACTIVITY_LOG)

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.DASHBOARD))
    expect(auditCalls()).toEqual([])
  })
})
