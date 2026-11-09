import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import api from '@/services/api'
import ProjectLayout from '@/components/layout/ProjectLayout'
import ProjectOverviewPage from './ProjectOverviewPage'
import { lookupsFixture, mockGet, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))

function renderOverview({ allowed = [] } = {}) {
  mockGet(api, {
    '/auth/me': { user: { _id: 'u1', name: 'Rana', role: 'project_manager' }, permissions: [] },
    '/projects/p1/workspace': workspaceFixture({
      allowed_actions: allowed,
      steps: { screening: { tool: 1, status: 'in_progress' } },
    }),
    '/lookups': lookupsFixture(),
    '/library': [],
  })
  return renderApp(
    [
      {
        path: '/app/projects/:projectId',
        element: <ProjectLayout />,
        children: [{ path: 'overview', element: <ProjectOverviewPage /> }],
      },
    ],
    '/app/projects/p1/overview'
  )
}

const follows = (first, second) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)

describe('Project overview: project workbook (owner, phase 14)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
  })

  it('shows the workbook bar right under the header, above the metrics and the next step', async () => {
    renderOverview({ allowed: ['export'] })
    const workbook = await screen.findByRole('region', { name: 'Project workbook' })
    const title = screen.getByRole('heading', { level: 1, name: 'Water network' })
    expect(follows(title, workbook)).toBe(true)
    for (const text of ['Risk Level', 'Start Screening', 'Project Details']) {
      expect(follows(workbook, screen.getByText(text)), text).toBe(true)
    }
    // Behaviour as before: disabled until Tool 1 has data
    expect(screen.getByRole('button', { name: /Export project workbook/ })).toBeDisabled()
    expect(screen.getByText('Available once Tool 1 has been started.')).toBeInTheDocument()
  })

  it('keeps its permission: no workbook without export (the viewer)', async () => {
    renderOverview({ allowed: [] })
    await screen.findByText('Risk Level')
    expect(screen.queryByRole('region', { name: 'Project workbook' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Export project workbook/ })).toBeNull()
  })
})
