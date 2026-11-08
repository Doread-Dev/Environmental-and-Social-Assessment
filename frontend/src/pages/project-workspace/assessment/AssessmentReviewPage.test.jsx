// Phase 12a: a rejected assessment offers "Edit Assessment" only to users whose allowed_actions
// let them edit it (as the screening summary does); a viewer sees the rejection without it.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import api from '@/services/api'
import ProjectLayout from '@/components/layout/ProjectLayout'
import AssessmentReviewPage from './AssessmentReviewPage'
import { lookupsFixture, mockGet, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))

const rejected = {
  _id: 'a1',
  project: 'p1',
  status: 'rejected',
  updatedAt: 'v1',
  reject_reason: 'Add the noise survey',
  status_history: [],
  methods: [],
  consultations: [],
  scores: [],
}

function mockApi(allowed) {
  mockGet(api, {
    '/auth/me': { user: { _id: 'u1', name: 'Rana', role: 'viewer' }, permissions: [] },
    '/projects/p1/workspace': workspaceFixture({
      allowed_actions: allowed,
      steps: {
        screening: { tool: 1, status: 'approved' },
        assessment: { tool: 2, status: 'rejected' },
      },
    }),
    '/assessments/project/p1': rejected,
    '/screenings/project/p1': null,
    '/lookups': lookupsFixture(),
    '/library': [],
  })
}

const routes = [
  {
    path: '/app/projects/:projectId',
    element: <ProjectLayout />,
    children: [
      { path: 'assessment/review', element: <AssessmentReviewPage /> },
      { path: 'assessment/metadata', element: <p>metadata page</p> },
    ],
  },
]

describe('AssessmentReviewPage — rejected', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
  })

  it('shows a viewer the reason but no "Edit Assessment"', async () => {
    mockApi([])
    renderApp(routes, '/app/projects/p1/assessment/review')
    expect(await screen.findByText('Add the noise survey')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Edit Assessment/ })).toBeNull()
  })

  it('offers "Edit Assessment" to a user who may edit it', async () => {
    mockApi(['assessment.edit'])
    renderApp(routes, '/app/projects/p1/assessment/review')
    expect(await screen.findByText('Add the noise survey')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Edit Assessment/ }))
    expect(await screen.findByText('metadata page')).toBeInTheDocument()
  })
})
