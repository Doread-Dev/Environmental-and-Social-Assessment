import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAssessment } from './useAssessment'
import { assessmentService } from '@/services'
import { withQueryClient } from '@/test/utils'

vi.mock('@/services', () => ({
  assessmentService: {
    getByProject: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setMethods: vi.fn(),
    setConsultations: vi.fn(),
    reject: vi.fn(),
    addScores: vi.fn(),
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

// The backend embeds the children in the read and in the create response (D63 c)
const withChildren = (assessment, children = {}) => ({
  ...assessment,
  methods: [],
  consultations: [],
  scores: defaultScores,
  ...children,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAssessment loading', () => {
  it('not started: no assessment', async () => {
    const { result } = await renderLoaded(null)

    expect(result.current.assessment).toBeNull()
    expect(result.current.impactScores).toEqual([])
  })

  it('loads the assessment with its methods, consultations and scores in one request', async () => {
    const { result } = await renderLoaded(
      withChildren({ _id: 'a1', status: 'draft' }, { methods: [{ method_type: 'site_visit' }] })
    )

    expect(assessmentService.getByProject).toHaveBeenCalledTimes(1)
    expect(result.current.assessment).toEqual({ _id: 'a1', status: 'draft' })
    expect(result.current.methods).toEqual([{ method_type: 'site_visit' }])
    expect(result.current.impactScores).toEqual(normalizedScores)
  })
})

describe('useAssessment.startAssessment', () => {
  beforeEach(() => {
    assessmentService.create.mockResolvedValue(withChildren({ _id: 'a1', status: 'draft' }))
  })

  it('creates the assessment with every input empty: no prefill, no placeholder (D69)', async () => {
    const { result } = await renderLoaded()

    await act(() => result.current.startAssessment())

    expect(assessmentService.create).toHaveBeenCalledWith({ project: 'p1' })
  })

  it('loads the default Negligible scores the backend created (D54)', async () => {
    const { result } = await renderLoaded()

    let outcome
    await act(async () => {
      outcome = await result.current.startAssessment()
    })

    expect(result.current.impactScores).toEqual(normalizedScores)
    expect(outcome).toEqual({ success: true, data: { _id: 'a1', status: 'draft' } })
  })

  it('does not create a second assessment when one exists', async () => {
    const { result } = await renderLoaded(withChildren({ _id: 'a1', status: 'draft' }))

    let outcome
    await act(async () => {
      outcome = await result.current.startAssessment()
    })

    expect(assessmentService.create).not.toHaveBeenCalled()
    expect(outcome).toEqual({ success: true, data: { _id: 'a1', status: 'draft' } })
  })

  it('returns the backend message when the workflow blocks the create (409)', async () => {
    assessmentService.create.mockRejectedValue({
      response: { status: 409, data: { success: false, error: 'Tool 1 must be approved' } },
    })
    const { result } = await renderLoaded()

    let outcome
    await act(async () => {
      outcome = await result.current.startAssessment()
    })

    expect(outcome).toEqual({ success: false, error: 'Tool 1 must be approved' })
  })
})

describe('useAssessment writes', () => {
  it('saving scores stores the totals the backend recalculated (no calculate call)', async () => {
    // The scores write answers the whole assessment with its new version (D62)
    assessmentService.addScores.mockResolvedValue(
      withChildren({ _id: 'a1', updatedAt: 'v2' }, { scores: [{ question: 'q1', level: 'high' }] })
    )
    assessmentService.update.mockResolvedValue({
      _id: 'a1',
      total_project_impact: 'high',
      updatedAt: 'v3',
    })
    const { result } = await renderLoaded(
      withChildren({ _id: 'a1', status: 'draft', updatedAt: 'v1' })
    )

    await act(() => result.current.saveImpactScores([{ question: 'q1', level: 'high' }], 'N', 'P'))

    expect(assessmentService.addScores).toHaveBeenCalledWith(
      'a1',
      [{ question: 'q1', level: 'high' }],
      'v1'
    )
    expect(assessmentService.update).toHaveBeenCalledWith('a1', {
      potential_negative_impact: 'N',
      potential_positive_impact: 'P',
      version: 'v2',
    })
    expect(result.current.assessment.total_project_impact).toBe('high')
    expect(result.current.impactScores).toEqual([{ question: 'q1', level: 'high' }])
  })

  it('metadata: creates the assessment when none exists, updates it otherwise', async () => {
    assessmentService.create.mockResolvedValue({ _id: 'a1', description: 'New' })
    const first = await renderLoaded(null)
    await act(() => first.result.current.saveMetadata({ description: 'New' }))
    expect(assessmentService.create).toHaveBeenCalledWith({ project: 'p1', description: 'New' })

    assessmentService.update.mockResolvedValue({ _id: 'a1', description: 'Edited' })
    const second = await renderLoaded(withChildren({ _id: 'a1', status: 'draft' }))
    await act(() => second.result.current.saveMetadata({ description: 'Edited' }))
    expect(assessmentService.update).toHaveBeenCalledWith('a1', { description: 'Edited' })
    expect(second.result.current.assessment.description).toBe('Edited')
  })

  it('methods and consultations replace the lists in the cache, each with the version the last write left', async () => {
    assessmentService.setMethods.mockResolvedValue(
      withChildren(
        { _id: 'a1', status: 'draft', updatedAt: 'v2' },
        { methods: [{ method_type: 'field_visits' }] }
      )
    )
    assessmentService.setConsultations.mockResolvedValue(
      withChildren(
        { _id: 'a1', status: 'draft', updatedAt: 'v3' },
        {
          methods: [{ method_type: 'field_visits' }],
          consultations: [{ type: 'village_meetings' }],
        }
      )
    )
    const { result } = await renderLoaded(
      withChildren({ _id: 'a1', status: 'draft', updatedAt: 'v1' })
    )

    await act(() => result.current.saveMethods([{ method_type: 'field_visits' }]))
    await act(() => result.current.saveConsultations([{ type: 'village_meetings' }]))

    expect(assessmentService.setMethods).toHaveBeenCalledWith(
      'a1',
      [{ method_type: 'field_visits' }],
      'v1'
    )
    expect(assessmentService.setConsultations).toHaveBeenCalledWith(
      'a1',
      [{ type: 'village_meetings' }],
      'v2'
    )

    expect(result.current.methods).toEqual([{ method_type: 'field_visits' }])
    expect(result.current.consultations).toEqual([{ type: 'village_meetings' }])
  })

  it('reject sends an empty reason when none is given', async () => {
    assessmentService.reject.mockResolvedValue({ _id: 'a1', status: 'rejected' })
    const { result } = await renderLoaded(withChildren({ _id: 'a1', status: 'submitted' }))

    await act(() => result.current.rejectAssessment())

    expect(assessmentService.reject).toHaveBeenCalledWith('a1', '')
    expect(result.current.assessment.status).toBe('rejected')
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
