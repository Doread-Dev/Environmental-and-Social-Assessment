import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useScreening } from './useScreening'
import { screeningService } from '@/services'
import { WORKFLOW_CHANGED_EVENT } from '@/utils/workflowEvents'

vi.mock('@/services', () => ({
  screeningService: {
    getByProject: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    submit: vi.fn(),
    approve: vi.fn(),
  },
}))

const form = { category_code: 'B', category_reason: 'Urban works' }

async function renderLoaded(existing) {
  screeningService.getByProject.mockResolvedValue(existing)
  const hook = renderHook(() => useScreening('p1'))
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return hook
}

describe('useScreening', () => {
  beforeEach(() => vi.clearAllMocks())

  it('saveDraft sends no status (the server owns it)', async () => {
    screeningService.create.mockResolvedValue({ _id: 's1', status: 'draft' })
    const { result } = await renderLoaded(null)

    await act(() => result.current.saveDraft(form))

    expect(screeningService.create).toHaveBeenCalledWith({ project: 'p1', ...form })
  })

  it('submit creates the screening, then calls the submit endpoint', async () => {
    screeningService.create.mockResolvedValue({ _id: 's1', status: 'draft' })
    screeningService.submit.mockResolvedValue({ _id: 's1', status: 'submitted' })
    const { result } = await renderLoaded(null)

    let outcome
    await act(async () => {
      outcome = await result.current.submit(form)
    })

    expect(screeningService.create).toHaveBeenCalledWith({ project: 'p1', ...form })
    expect(screeningService.submit).toHaveBeenCalledWith('s1')
    expect(outcome).toEqual({ success: true, data: { _id: 's1', status: 'submitted' } })
    expect(result.current.screening.status).toBe('submitted')
  })

  it('submit updates an existing screening (no status in the PUT), then submits it', async () => {
    screeningService.update.mockResolvedValue({ _id: 's1', status: 'rejected' })
    screeningService.submit.mockResolvedValue({ _id: 's1', status: 'submitted' })
    const { result } = await renderLoaded({ _id: 's1', status: 'rejected' })

    await act(() => result.current.submit(form))

    expect(screeningService.update).toHaveBeenCalledWith('s1', { project: 'p1', ...form })
    expect(screeningService.submit).toHaveBeenCalledWith('s1')
  })

  it('announces approve so the sidebar unlocks the assessment', async () => {
    screeningService.approve.mockResolvedValue({ _id: 's1', status: 'approved' })
    const { result } = await renderLoaded({ _id: 's1', status: 'submitted' })
    const listener = vi.fn()
    window.addEventListener(WORKFLOW_CHANGED_EVENT, listener)

    await act(() => result.current.approve('Go ahead'))

    window.removeEventListener(WORKFLOW_CHANGED_EVENT, listener)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0].detail).toEqual({ projectId: 'p1' })
  })

  it('does not announce a failed request', async () => {
    screeningService.approve.mockRejectedValue({ response: { status: 409, data: {} } })
    const { result } = await renderLoaded({ _id: 's1', status: 'submitted' })
    const listener = vi.fn()
    window.addEventListener(WORKFLOW_CHANGED_EVENT, listener)

    await act(() => result.current.approve('Go ahead'))

    window.removeEventListener(WORKFLOW_CHANGED_EVENT, listener)
    expect(listener).not.toHaveBeenCalled()
  })
})
