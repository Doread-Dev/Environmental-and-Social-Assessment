import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import api from '@/services/api'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import ProjectLayout from '@/components/layout/ProjectLayout'
import ProjectOverviewPage from '@/pages/project-workspace/overview/ProjectOverviewPage'
import ScreeningRouter from '@/pages/project-workspace/screening/ScreeningRouter'
import ScreeningSummaryPage from '@/pages/project-workspace/screening/ScreeningSummaryPage'
import SempOverviewPage from '@/pages/project-workspace/semp/SempOverviewPage'
import { getUrls, mockGet, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'
import ProtectedRoute from './ProtectedRoute'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))

const routes = [
  {
    path: '/app/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/app/projects/:projectId',
    element: (
      <ProtectedRoute>
        <ProjectLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'overview', element: <ProjectOverviewPage /> },
      // Place handles as in routes/index.jsx (checked in routes.test.jsx)
      { path: 'screening', handle: { place: 'screening' }, element: <ScreeningRouter /> },
      {
        path: 'screening/summary',
        handle: { place: 'screening' },
        element: <ScreeningSummaryPage />,
      },
      { path: 'semp', element: <SempOverviewPage /> },
    ],
  },
]

const dashboard = {
  stats: {
    total_projects: 3,
    by_status: { draft: 1, in_progress: 1, needs_action: 0, monitoring: 1, completed: 0 },
    high_risk: 2,
  },
  latest_projects: [
    { _id: 'p1', title: 'Water network', location: 'Aleppo', workflow: { status: 'monitoring' } },
  ],
}

const guidance = [
  {
    _id: 'd1',
    title: 'Screening checklist',
    places: ['screening'],
    size: 10,
    original_name: 'a.pdf',
  },
]

function mockApi({
  permissions = ['create_project', 'edit', 'export'],
  workspace,
  library = guidance,
} = {}) {
  mockGet(api, {
    '/auth/me': { user: { _id: 'u1', name: 'Rana', role: 'project_manager' }, permissions },
    '/dashboard': dashboard,
    '/projects/p1/workspace': workspace ?? workspaceFixture(),
    '/screenings/project/p1': null,
    '/library': library,
  })
}

// Settle, then list every GET that went out
async function requestsAfter(text) {
  await screen.findByText(text)
  await waitFor(() => expect(api.get).toHaveBeenCalled())
  return getUrls(api)
}

describe('request counts (D31, D33)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
  })

  it('dashboard: 2 requests (permissions + dashboard), stats from the backend', async () => {
    mockApi()
    renderApp(routes, '/app/dashboard')

    expect(await requestsAfter('Water network')).toEqual(['/auth/me', '/dashboard'])
    expect(screen.getByText('High Risk Projects').closest('div').parentElement).toHaveTextContent(
      '2'
    )
  })

  it('project overview: 2 requests (permissions + workspace), no per-tool loads', async () => {
    mockApi()
    renderApp(routes, '/app/projects/p1/overview')

    expect(await requestsAfter('Start Screening')).toEqual(['/auth/me', '/projects/p1/workspace'])
  })

  it('screening page: the workspace, the screening record and its guidance (4)', async () => {
    mockApi({
      workspace: workspaceFixture({ allowed_actions: ['screening.create'] }),
    })
    renderApp(routes, '/app/projects/p1/screening')

    await screen.findByText('Submit Screening')
    expect(await screen.findByRole('button', { name: 'Guidance (1)' })).toBeInTheDocument()
    expect(getUrls(api).sort()).toEqual(
      ['/auth/me', '/projects/p1/workspace', '/screenings/project/p1', '/library'].sort()
    )
    // One library request, for this page's place (D64 c)
    expect(api.get.mock.calls.filter(([url]) => url === '/library')).toEqual([
      ['/library', { params: { place: 'screening' } }],
    ])
  })

  it('a tool page adds no library request when its guidance is cached', async () => {
    const screening = { _id: 's1', status: 'submitted', category_code: 'B', category_reason: 'x' }
    mockGet(api, {
      '/auth/me': { user: { _id: 'u1', role: 'project_manager' }, permissions: ['edit'] },
      '/projects/p1/workspace': {
        ...workspaceFixture({ steps: { screening: { status: 'submitted' } } }),
        screening,
      },
      '/screenings/project/p1': screening,
      '/library': guidance,
    })
    const { router } = renderApp(routes, '/app/projects/p1/screening')
    await screen.findByRole('button', { name: 'Guidance (1)' })
    const libraryCalls = () => getUrls(api).filter((url) => url === '/library').length
    expect(libraryCalls()).toBe(1)

    // Same place, another page (screening form → summary): the cached list is reused.
    await act(() => router.navigate('/app/projects/p1/screening/summary'))
    await screen.findByText('Environmental Integration Screening')
    expect(screen.getByRole('button', { name: 'Guidance (1)' })).toBeInTheDocument()
    expect(libraryCalls()).toBe(1)
  })

  it('a page with no linked guidance shows no button', async () => {
    mockApi({
      workspace: workspaceFixture({ allowed_actions: ['screening.create'] }),
      library: [],
    })
    renderApp(routes, '/app/projects/p1/screening')

    await screen.findByText('Submit Screening')
    await waitFor(() => expect(getUrls(api)).toContain('/library'))
    expect(screen.queryByRole('button', { name: /Guidance/ })).not.toBeInTheDocument()
  })

  it('SEMP overview: tool statuses from the workspace, no table loads', async () => {
    const semp = {
      tools: [3, 4],
      status: 'in_progress',
      management_activities: { count: 2, described: 2, status: 'completed' },
      mitigation_plans: { count: 0, described: 0, status: 'not_started' },
    }
    mockApi({
      workspace: workspaceFixture({
        steps: {
          screening: { status: 'approved' },
          assessment: { status: 'approved' },
          semp,
        },
      }),
    })
    renderApp(routes, '/app/projects/p1/semp')

    expect(await requestsAfter('Management Activities')).toEqual([
      '/auth/me',
      '/projects/p1/workspace',
    ])
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })
})

describe('viewer sees no export / edit / create buttons (D28a, D35)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn({ user: { _id: 'v1', name: 'Viewer', role: 'viewer' } })
  })

  it('dashboard: no New Project', async () => {
    mockApi({ permissions: [] })
    renderApp(routes, '/app/dashboard')

    await screen.findByText('Water network')
    expect(screen.queryByText('New Project')).not.toBeInTheDocument()
  })

  it('submitted screening: no Export Excel, no edit or approve controls', async () => {
    const screening = { _id: 's1', status: 'submitted', category_code: 'B', category_reason: 'x' }
    mockGet(api, {
      '/auth/me': { user: { _id: 'v1', role: 'viewer' }, permissions: [] },
      '/projects/p1/workspace': workspaceFixture({
        steps: { screening: { status: 'submitted' } },
        allowed_actions: [],
      }),
      '/screenings/project/p1': screening,
      '/library': [],
    })
    renderApp(routes, '/app/projects/p1/screening')

    await waitFor(() => expect(getUrls(api)).toContain('/screenings/project/p1'))
    expect(await screen.findByText('Environmental Integration Screening')).toBeInTheDocument()
    expect(screen.queryByText('Export Excel')).not.toBeInTheDocument()
    expect(screen.queryByText('Edit Project')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })

  it('an editor sees Export Excel on the same page', async () => {
    const screening = { _id: 's1', status: 'submitted', category_code: 'B', category_reason: 'x' }
    mockGet(api, {
      '/auth/me': { user: { _id: 'u1', role: 'project_manager' }, permissions: ['edit', 'export'] },
      '/projects/p1/workspace': {
        ...workspaceFixture({ steps: { screening: { status: 'submitted' } } }),
        allowed_actions: ['export'],
        screening,
      },
      '/screenings/project/p1': screening,
      '/library': [],
    })
    renderApp(routes, '/app/projects/p1/screening')

    expect(await screen.findByText('Export Excel')).toBeInTheDocument()
  })

  it('project overview: no Edit Project', async () => {
    mockApi({ permissions: [], workspace: workspaceFixture({ allowed_actions: [] }) })
    renderApp(routes, '/app/projects/p1/overview')

    await screen.findByText('Start Screening')
    expect(screen.queryByText('Edit Project')).not.toBeInTheDocument()
  })
})
