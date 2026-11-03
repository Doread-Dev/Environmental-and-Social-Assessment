import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAssessment } from './useAssessment'
import { assessmentService } from '@/services'
import { withQueryClient } from '@/test/utils'

vi.mock('./useLookups', () => ({
  useLookups: () => ({ categoriesWithQuestions: [], isLoading: false }),
}))

vi.mock('@/services', () => ({
  assessmentService: {
    getByProject: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    addScores: vi.fn(),
    getScores: vi.fn(),
    getMethods: vi.fn(),
    getConsultations: vi.fn(),
    approve: vi.fn(),
  },
}))

const defaultScores = [
  { question: 'q1', level: 'negligible' },
  { question: { _id: 'q2' }, level: 'negligible' },
]
const normalizedScores = [
  { question: 'q1', level: 'negligible' },
  { question: 'q2', level: 'negligible' },
]

async function renderLoaded(existing = null) {
  assessmentService.getByProject.mockResolvedValue(existing)
  const { wrapper, queryClient } = withQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const hook = renderHook(() => useAssessment('p1'), { wrapper })
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return { ...hook, invalidate }
}

beforeEach(() => {
  vi.clearAllMocks()
  assessmentService.getMethods.mockResolvedValue([])
  assessmentService.getConsultations.mockResolvedValue([])
  assessmentService.getScores.mockResolvedValue(defaultScores)
})

describe('useAssessment loading', () => {
  it('not started: no assessment and no sub-requests', async () => {
    const { result } = await renderLoaded(null)

    expect(result.current.assessment).toBeNull()
    expect(result.current.impactScores).toEqual([])
    expect(assessmentService.getScores).not.toHaveBeenCalled()
  })

  it('loads the assessment with its methods, consultations and scores', async () => {
    assessmentService.getMethods.mockResolvedValue([{ method_type: 'site_visit' }])
    const { result } = await renderLoaded({ _id: 'a1', status: 'draft' })

    expect(result.current.assessment).toEqual({ _id: 'a1', status: 'draft' })
    expect(result.current.methods).toEqual([{ method_type: 'site_visit' }])
    expect(result.current.impactScores).toEqual(normalizedScores)
  })
})

describe('useAssessment.startAssessment', () => {
  beforeEach(() => {
    assessmentService.create.mockResolvedValue({ _id: 'a1', status: 'draft' })
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

    let outcome
    await act(async () => {
      outcome = await result.current.startAssessment({ project_component: 'Water network' })
    })

    expect(assessmentService.getScores).toHaveBeenCalledWith('a1')
    expect(result.current.impactScores).toEqual(normalizedScores)
    expect(outcome).toEqual({ success: true, data: { _id: 'a1', status: 'draft' } })
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

describe('useAssessment writes', () => {
  it('saving scores stores the totals the backend recalculated (no calculate call)', async () => {
    assessmentService.addScores.mockResolvedValue([{ question: 'q1', level: 'high' }])
    assessmentService.update.mockResolvedValue({ _id: 'a1', total_project_impact: 'high' })
    const { result } = await renderLoaded({ _id: 'a1', status: 'draft' })

    await act(() => result.current.saveImpactScores([{ question: 'q1', level: 'high' }], 'N', 'P'))

    expect(assessmentService.update).toHaveBeenCalledWith('a1', {
      potential_negative_impact: 'N',
      potential_positive_impact: 'P',
    })
    expect(result.current.assessment.total_project_impact).toBe('high')
    expect(result.current.impactScores).toEqual([{ question: 'q1', level: 'high' }])
  })

  it('approve refreshes the workspace (sidebar unlocks SEMP)', async () => {
    assessmentService.approve.mockResolvedValue({ _id: 'a1', status: 'approved' })
    const { result, invalidate } = await renderLoaded({ _id: 'a1', status: 'submitted' })

    await act(() => result.current.approveAssessment('ok'))

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['workspace', 'p1'] })
    expect(result.current.assessment.status).toBe('approved')
  })

  it('writes before the assessment exists fail without a request', async () => {
    const { result } = await renderLoaded(null)

    let outcome
    await act(async () => {
      outcome = await result.current.approveAssessment('ok')
    })

    expect(outcome).toEqual({ success: false, error: 'Assessment record not found.' })
    expect(assessmentService.approve).not.toHaveBeenCalled()
  })
})
