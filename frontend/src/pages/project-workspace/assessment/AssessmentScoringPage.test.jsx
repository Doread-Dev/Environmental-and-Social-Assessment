// Phase 12a: "Save as Draft" on the assessment scoring shows the same "Saved" feedback as
// Tools 3–5 after a successful save, and goes back to "Save as Draft" on the next change.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import api from '@/services/api'
import ProjectLayout from '@/components/layout/ProjectLayout'
import AssessmentScoringPage from './AssessmentScoringPage'
import { fail, lookupsFixture, mockGet, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const assessment = {
  _id: 'a1',
  project: 'p1',
  status: 'draft',
  updatedAt: 'v1',
  potential_negative_impact: '',
  potential_positive_impact: '',
  methods: [],
  consultations: [],
  scores: [{ _id: 's1', question: 'q1', level: 'negligible', note: '' }],
}

const ok = (data) => Promise.resolve({ data: { success: true, data } })

function mockApi() {
  mockGet(api, {
    '/auth/me': { user: { _id: 'u1', name: 'Rana', role: 'project_manager' }, permissions: [] },
    '/projects/p1/workspace': workspaceFixture({
      allowed_actions: ['assessment.edit'],
      steps: {
        screening: { tool: 1, status: 'approved' },
        assessment: { tool: 2, status: 'in_progress' },
      },
    }),
    '/assessments/project/p1': assessment,
    '/screenings/project/p1': null,
    '/lookups': {
      ...lookupsFixture(),
      impact_categories: [{ _id: 'c1', code: 'A', name: 'Air quality' }],
      impact_questions: [{ _id: 'q1', category: 'c1', question_text: 'Dust?' }],
    },
    '/library': [],
  })
}

const routes = [
  {
    path: '/app/projects/:projectId',
    element: <ProjectLayout />,
    children: [{ path: 'assessment/scoring', element: <AssessmentScoringPage /> }],
  },
]

describe('AssessmentScoringPage — Save as Draft feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
    mockApi()
  })

  const negative = () => screen.findByPlaceholderText(/potential negative consequences/)

  it('shows "Saved" after a successful draft save, and "Save as Draft" after the next change', async () => {
    api.post.mockImplementation(() => ok({ ...assessment, updatedAt: 'v2' }))
    api.put.mockImplementation((url, body) => ok({ ...assessment, ...body, updatedAt: 'v3' }))
    renderApp(routes, '/app/projects/p1/assessment/scoring')

    fireEvent.change(await negative(), { target: { value: 'Dust' } })
    fireEvent.click(screen.getByRole('button', { name: /Save as Draft/ }))

    const saved = await screen.findByRole('button', { name: /Saved/ })
    expect(saved).toBeDisabled()
    expect(api.post).toHaveBeenCalledWith('/assessments/a1/scores', expect.anything())

    fireEvent.change(await negative(), { target: { value: 'Dust and noise' } })
    expect(screen.getByRole('button', { name: /Save as Draft/ })).toBeEnabled()
    expect(screen.queryByRole('button', { name: /^Saved$/ })).toBeNull()
  })

  it('does not say "Saved" when the save fails', async () => {
    api.post.mockImplementation(() => fail(500, 'Server Error'))
    renderApp(routes, '/app/projects/p1/assessment/scoring')

    fireEvent.change(await negative(), { target: { value: 'Dust' } })
    fireEvent.click(screen.getByRole('button', { name: /Save as Draft/ }))

    expect(await screen.findByText('Server Error')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Saved$/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Save as Draft/ })).toBeEnabled()
  })
})
