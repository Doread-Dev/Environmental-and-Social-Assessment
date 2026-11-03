import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAssessment } from './useAssessment'
import { assessmentService } from '@/services'

vi.mock('@/contexts', () => ({
  useLookups: () => ({ categoriesWithQuestions: [], isLoading: false }),
  useAuth: () => ({ user: { _id: 'u1' } }),
}))

vi.mock('@/services', () => ({
  assessmentService: {
    getByProject: vi.fn(),
    create: vi.fn(),
    getScores: vi.fn(),
  },
}))

const defaultScores = [
  { question: 'q1', level: 'negligible' },
  { question: 'q2', level: 'negligible' },
]

async function renderLoaded() {
  assessmentService.getByProject.mockResolvedValue(null)
  const hook = renderHook(() => useAssessment('p1'))
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return hook
}

describe('useAssessment.startAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assessmentService.create.mockResolvedValue({ _id: 'a1', status: 'draft' })
    assessmentService.getScores.mockResolvedValue(defaultScores)
  })

  it('leaves project activity to the backend prefill when the project has a component (D53)', async () => {
    const { result } = await renderLoaded()

    await act(() => result.current.startAssessment({ project_component: 'Water network' }))

    expect(assessmentService.create).toHaveBeenCalledWith({
      project: 'p1',
      description: '(To be filled)',
    })
  })

  it('sends a placeholder project activity when the project has no component', async () => {
    const { result } = await renderLoaded()

    await act(() => result.current.startAssessment({ project_component: '' }))

    expect(assessmentService.create).toHaveBeenCalledWith({
      project: 'p1',
      description: '(To be filled)',
      project_activity: '(To be filled)',
    })
  })

  it('loads the default Negligible scores the backend created (D54)', async () => {
    const { result } = await renderLoaded()

    await act(() => result.current.startAssessment({ project_component: 'Water network' }))

    expect(assessmentService.getScores).toHaveBeenCalledWith('a1')
    expect(result.current.impactScores).toEqual(defaultScores)
  })

  it('returns the backend message when the workflow blocks the create (409)', async () => {
    assessmentService.create.mockRejectedValue({
      response: { status: 409, data: { success: false, error: 'Tool 1 must be approved' } },
    })
    const { result } = await renderLoaded()

    let outcome
    await act(async () => {
      outcome = await result.current.startAssessment({ project_component: 'x' })
    })

    expect(outcome).toEqual({ success: false, error: 'Tool 1 must be approved' })
  })
})
