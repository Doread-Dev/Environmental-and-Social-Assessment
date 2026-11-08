// Phase 12 (D76 3): the Monitoring overview — baseline and quarter status, category ranking,
// the data-entry button by permission, Export (Tool 5 file, saved records), the lock card.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import api from '@/services/api'
import ProjectLayout from '@/components/layout/ProjectLayout'
import MonitoringOverviewPage from './MonitoringOverviewPage'
import { exportTool } from '@/utils/excelExport'
import { lookupsFixture, mockGet, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))
vi.mock('@/utils/excelExport', () => ({
  exportTool: vi.fn(async () => 'Tool5_Water_network_In_progress_2026-11-06.xlsx'),
  exportStatus: vi.fn(() => 'In progress'),
}))

const lookups = {
  ...lookupsFixture(),
  impact_categories: [{ _id: 'c1', code: 'A', name: 'Air Quality' }],
  indicators: [
    { _id: 'i1', category: 'c1', name: 'Visible dust', definition: 'd', measurement: 'm' },
  ],
}
const records = [
  { _id: 'r1', indicator: 'i1', scores: { baseline: '5', Q1: '4' }, ranking: 'medium' },
]

function mockApi({ allowed = ['monitoring.edit', 'export'], locked = false, data = records } = {}) {
  mockGet(api, {
    '/auth/me': { user: { _id: 'u1', name: 'Rana', role: 'project_manager' }, permissions: [] },
    '/projects/p1/workspace': workspaceFixture({
      allowed_actions: allowed,
      steps: {
        screening: { tool: 1, status: 'approved' },
        assessment: { tool: 2, status: 'approved' },
        monitoring: { tool: 5, status: locked ? 'locked' : 'in_progress', records: 1 },
      },
    }),
    '/monitoring/project/p1': data,
    '/assessments/project/p1': { _id: 'a1', status: 'approved', scores: [] },
    '/lookups': lookups,
    '/library': [],
  })
}

const routes = [
  {
    path: '/app/projects/:projectId',
    element: <ProjectLayout />,
    children: [
      { path: 'monitoring', element: <MonitoringOverviewPage /> },
      { path: 'monitoring/data-entry', element: <p>data entry page</p> },
      { path: 'assessment', element: <p>assessment page</p> },
      { path: 'semp', element: <p>semp page</p> },
    ],
  },
]

describe('MonitoringOverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
  })

  it('shows the baseline, the quarters recorded and the category ranking', async () => {
    mockApi()
    renderApp(routes, '/app/projects/p1/monitoring')
    expect(await screen.findByText('Entered')).toBeInTheDocument()
    expect(screen.getByText('Number of quarters recorded').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Air Quality')).toBeInTheDocument()
    expect(screen.queryByText('Monitoring Locked')).not.toBeInTheDocument()
  })

  it('says "Not Entered" without a baseline', async () => {
    mockApi({ data: [] })
    renderApp(routes, '/app/projects/p1/monitoring')
    expect(await screen.findByText('Not Entered')).toBeInTheDocument()
  })

  it('opens data entry for an editor', async () => {
    mockApi()
    const { router } = renderApp(routes, '/app/projects/p1/monitoring')
    fireEvent.click(await screen.findByRole('button', { name: /Enter \/ Edit Data/ }))
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/app/projects/p1/monitoring/data-entry')
    )
  })

  it('has no export and shows "View Data" without the permissions', async () => {
    mockApi({ allowed: [] })
    renderApp(routes, '/app/projects/p1/monitoring')
    expect(await screen.findByRole('button', { name: /View Data/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Export Excel/ })).not.toBeInTheDocument()
  })

  it('exports Tool 5 with the saved records and says which file was saved', async () => {
    mockApi()
    renderApp(routes, '/app/projects/p1/monitoring')
    await screen.findByText('Entered')
    fireEvent.click(screen.getAllByRole('button', { name: /Export Excel/ }).at(-1))
    await waitFor(() => expect(exportTool).toHaveBeenCalledTimes(1))
    const [tool, data, status] = exportTool.mock.calls[0]
    expect(tool).toBe('tool5')
    expect(data.records).toEqual(records)
    expect(data.assessment).toMatchObject({ _id: 'a1' })
    expect(status).toBe('In progress')
    expect(
      await screen.findByText('Downloaded Tool5_Water_network_In_progress_2026-11-06.xlsx')
    ).toBeInTheDocument()
  })

  it('shows the lock card while monitoring is locked', async () => {
    mockApi({ locked: true })
    renderApp(routes, '/app/projects/p1/monitoring')
    expect(await screen.findByText('Monitoring Locked')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enter \/ Edit Data/ })).toBeDisabled()
    // The gate is Tools 3 and 4 (phase 12a), not the assessment
    expect(screen.getByText(/Management Activities \(Tool 3\)/)).toBeInTheDocument()
    expect(screen.getByText(/Mitigation Plan \(Tool 4\)/)).toBeInTheDocument()
    expect(screen.queryByText(/Environmental Assessment \(Tool 2\)/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Go to SEMP' }))
    expect(await screen.findByText('semp page')).toBeInTheDocument()
  })
})
