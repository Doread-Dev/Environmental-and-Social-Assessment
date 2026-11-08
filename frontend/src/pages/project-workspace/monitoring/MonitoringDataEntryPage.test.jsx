// Phase 12a: Tool 5 data entry — a read-only user (viewer) gets no Cancel button (nothing to
// cancel), an editor keeps Cancel and Save; the lock card names the real gate (Tools 3 and 4) and
// leads to the SEMP overview.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import api from '@/services/api'
import ProjectLayout from '@/components/layout/ProjectLayout'
import MonitoringDataEntryPage from './MonitoringDataEntryPage'
import { lookupsFixture, mockGet, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), put: vi.fn() },
}))

const lookups = {
  ...lookupsFixture(),
  impact_categories: [{ _id: 'c1', code: 'A', name: 'Air Quality' }],
  indicators: [
    { _id: 'i1', category: 'c1', name: 'Visible dust', definition: 'd', measurement: 'm' },
  ],
}

function mockApi({ allowed = [], locked = false } = {}) {
  mockGet(api, {
    '/auth/me': { user: { _id: 'u1', name: 'Rana', role: 'viewer' }, permissions: [] },
    '/projects/p1/workspace': workspaceFixture({
      allowed_actions: allowed,
      steps: {
        screening: { tool: 1, status: 'approved' },
        assessment: { tool: 2, status: 'approved' },
        monitoring: { tool: 5, status: locked ? 'locked' : 'in_progress', records: 0 },
      },
    }),
    '/monitoring/project/p1': [],
    '/lookups': lookups,
    '/library': [],
    '/users': [],
  })
}

const routes = [
  {
    path: '/app/projects/:projectId',
    element: <ProjectLayout />,
    children: [
      { path: 'monitoring', element: <p>monitoring overview</p> },
      { path: 'monitoring/data-entry', element: <MonitoringDataEntryPage /> },
      { path: 'semp', element: <p>semp page</p> },
      { path: 'assessment', element: <p>assessment page</p> },
    ],
  },
]

describe('MonitoringDataEntryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
  })

  it('shows a read-only user neither Cancel nor Save', async () => {
    mockApi({ allowed: [] })
    renderApp(routes, '/app/projects/p1/monitoring/data-entry')
    expect(await screen.findByText('Monitoring Data Entry')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancel/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Save$/ })).toBeNull()
  })

  it('gives an editor Cancel (back to the overview) and Save', async () => {
    mockApi({ allowed: ['monitoring.edit'] })
    renderApp(routes, '/app/projects/p1/monitoring/data-entry')
    expect(await screen.findByRole('button', { name: /Save/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }))
    expect(await screen.findByText('monitoring overview')).toBeInTheDocument()
  })

  it("enables the header's Export Excel once the page answers it (phase 12a)", async () => {
    mockApi({ allowed: ['monitoring.edit', 'export'] })
    const defaultGet = api.get.getMockImplementation()
    let answer
    api.get.mockImplementation((url) => {
      if (url !== '/monitoring/project/p1') return defaultGet(url)
      return new Promise((resolve) => {
        answer = () => resolve({ data: { success: true, data: [] } })
      })
    })
    renderApp(routes, '/app/projects/p1/monitoring/data-entry')
    // The page is still loading its records: the click would be lost, so the button is disabled
    expect(await screen.findByRole('button', { name: /Export Excel/ })).toBeDisabled()
    answer()
    expect(await screen.findByText('Monitoring Data Entry')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export Excel/ })).toBeEnabled()
  })

  it('names Tools 3 and 4 on the lock card and leads to the SEMP overview', async () => {
    mockApi({ allowed: ['monitoring.edit'], locked: true })
    renderApp(routes, '/app/projects/p1/monitoring/data-entry')
    expect(await screen.findByText('Monitoring Locked')).toBeInTheDocument()
    expect(screen.getByText(/Management Activities \(Tool 3\)/)).toBeInTheDocument()
    expect(screen.getByText(/Mitigation Plan \(Tool 4\)/)).toBeInTheDocument()
    expect(screen.queryByText(/Environmental Assessment \(Tool 2\)/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Go to SEMP' }))
    expect(await screen.findByText('semp page')).toBeInTheDocument()
  })
})
