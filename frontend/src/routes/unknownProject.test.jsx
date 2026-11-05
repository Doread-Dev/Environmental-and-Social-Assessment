/**
 * A deleted or unknown project id in the URL (D61): every project page says "Project not found"
 * once, with a way back, and never asks the backend again and again.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import api from '@/services/api'
import ProjectLayout from '@/components/layout/ProjectLayout'
import SempFullWidthLayout from '@/components/layout/SempFullWidthLayout'
import ScreeningRouter from '@/pages/project-workspace/screening/ScreeningRouter'
import AssessmentRouter from '@/pages/project-workspace/assessment/AssessmentRouter'
import { signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'
import ProtectedRoute from './ProtectedRoute'
import WorkflowRouteGuard from './WorkflowRouteGuard'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))

// The route tree of routes/index.jsx for the project pages
const routes = [
  {
    path: '/app/projects/:projectId',
    element: (
      <ProtectedRoute>
        <ProjectLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'overview', element: <p>Overview page</p> },
      {
        path: 'assessment',
        element: <WorkflowRouteGuard step="assessment" />,
        children: [{ index: true, element: <p>Assessment page</p> }],
      },
    ],
  },
  {
    path: '/app/projects/:projectId/semp',
    element: (
      <ProtectedRoute>
        <WorkflowRouteGuard step="semp" />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <SempFullWidthLayout />,
        children: [{ path: 'activities', element: <p>Tool 3 page</p> }],
      },
    ],
  },
]

const notFound = () => {
  const err = new Error('Project not found')
  err.response = { status: 404, data: { success: false, error: 'Project not found' } }
  return Promise.reject(err)
}

function mockApi() {
  api.get.mockImplementation((url) =>
    url === '/auth/me'
      ? Promise.resolve({ data: { success: true, data: { user: { _id: 'u1' }, permissions: [] } } })
      : notFound()
  )
}
const workspaceReads = () =>
  api.get.mock.calls.filter(([url]) => url === '/projects/p404/workspace').length

describe('unknown project id in the URL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
    mockApi()
  })

  it.each([
    ['overview', '/app/projects/p404/overview'],
    ['a guarded tool (assessment)', '/app/projects/p404/assessment'],
    ['Tools 3/4 (full-width layout)', '/app/projects/p404/semp/activities'],
  ])('%s: "Project not found" with a way back, and one request', async (_name, path) => {
    renderApp(routes, path)

    expect(await screen.findByText('Project not found')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(workspaceReads()).toBe(1)
    expect(screen.getByRole('button', { name: /Back to Projects/ })).toBeInTheDocument()
    expect(screen.queryByText(/\{step\}/)).toBeNull()
  })
})

describe('a tool record that cannot be read (500, offline)', () => {
  const toolRoutes = [
    {
      path: '/app/projects/:projectId',
      element: <ProjectLayout />,
      children: [
        { path: 'screening', element: <ScreeningRouter /> },
        { path: 'assessment', element: <AssessmentRouter /> },
      ],
    },
  ]

  function mockToolFailure(failingUrl) {
    api.get.mockImplementation((url) => {
      if (url === failingUrl) {
        const err = new Error('Server Error')
        err.response = { status: 500, data: { success: false, error: 'Server Error' } }
        return Promise.reject(err)
      }
      const data = {
        '/auth/me': { user: { _id: 'u1' }, permissions: [] },
        '/projects/p1/workspace': workspaceFixture({
          steps: {
            screening: { tool: 1, status: 'approved' },
            assessment: { tool: 2, status: 'in_progress' },
          },
        }),
        '/library': [],
      }[url]
      return data === undefined
        ? Promise.reject(Object.assign(new Error('x'), { response: { status: 404, data: {} } }))
        : Promise.resolve({ data: { success: true, data } })
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
  })

  it.each([
    [
      'screening',
      '/app/projects/p1/screening',
      '/screenings/project/p1',
      'Failed to load the screening',
    ],
    [
      'assessment',
      '/app/projects/p1/assessment',
      '/assessments/project/p1',
      'Failed to load the assessment',
    ],
  ])('%s: the error with Try again, no request loop', async (_name, path, url, title) => {
    mockToolFailure(url)
    renderApp(toolRoutes, path)

    expect(await screen.findByText(title)).toBeInTheDocument()
    expect(screen.getByText('Server Error')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(api.get.mock.calls.filter(([u]) => u === url)).toHaveLength(1)
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument()
  })
})
