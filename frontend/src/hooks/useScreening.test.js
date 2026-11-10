import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useScreening } from './useScreening'
import { screeningService } from '@/services'
import { withQueryClient } from '@/test/utils'

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
  const { wrapper, queryClient } = withQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const hook = renderHook(() => useScreening('p1'), { wrapper })
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return { ...hook, invalidate }
}

const invalidatedKeys = (invalidate) => invalidate.mock.calls.map(([{ queryKey }]) => queryKey)

describe('useScreening', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads: loading, then the screening (null = not started)', async () => {
    screeningService.getByProject.mockResolvedValue(null)
    const { wrapper } = withQueryClient()
    const { result } = renderHook(() => useScreening('p1'), { wrapper })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.screening).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('shows the backend message when loading fails', async () => {
    screeningService.getByProject.mockRejectedValue({
      response: { status: 500, data: { error: 'Server Error' } },
    })
    const { wrapper } = withQueryClient()
    const { result } = renderHook(() => useScreening('p1'), { wrapper })

    await waitFor(() => expect(result.current.error).toBe('Server Error'))
  })

  it('saveDraft sends no status (the server owns it)', async () => {
    screeningService.create.mockResolvedValue({ _id: 's1', status: 'draft' })
    const { result } = await renderLoaded(null)

    await act(() => result.current.saveDraft(form))

    expect(screeningService.create).toHaveBeenCalledWith({ project: 'p1', ...form })
    expect(result.current.screening).toEqual({ _id: 's1', status: 'draft' })
  })

  it('saveDraft of a new screening needs a category and a reason (no request)', async () => {
    const { result } = await renderLoaded(null)

    let outcome
    await act(async () => {
      outcome = await result.current.saveDraft({ category_code: 'B' })
    })

    expect(outcome.success).toBe(false)
    expect(result.current.error).toMatch(/category/)
    expect(screeningService.create).not.toHaveBeenCalled()
  })

  it('submit creates the screening, then calls the submit endpoint with its version', async () => {
    screeningService.create.mockResolvedValue({ _id: 's1', status: 'draft', updatedAt: 'v1' })
    screeningService.submit.mockResolvedValue({ _id: 's1', status: 'submitted' })
    const { result } = await renderLoaded(null)

    let outcome
    await act(async () => {
      outcome = await result.current.submit(form)
    })

    expect(screeningService.create).toHaveBeenCalledWith({ project: 'p1', ...form })
    expect(screeningService.submit).toHaveBeenCalledWith('s1', 'v1')
    expect(outcome).toEqual({ success: true, data: { _id: 's1', status: 'submitted' } })
    expect(result.current.screening.status).toBe('submitted')
  })

  it('submit updates an existing screening (no status in the PUT), then submits it', async () => {
    screeningService.update.mockResolvedValue({ _id: 's1', status: 'rejected', updatedAt: 'v2' })
    screeningService.submit.mockResolvedValue({ _id: 's1', status: 'submitted' })
    const { result } = await renderLoaded({ _id: 's1', status: 'rejected', updatedAt: 'v1' })

    await act(() => result.current.submit(form))

    // The PUT carries the version the page shows; the submit the version the PUT left (D62)
    expect(screeningService.update).toHaveBeenCalledWith('s1', {
      project: 'p1',
      ...form,
      version: 'v1',
    })
    expect(screeningService.submit).toHaveBeenCalledWith('s1', 'v2')
  })

  it('approve refreshes the workspace, project list and dashboard (sidebar unlocks Tool 2)', async () => {
    screeningService.approve.mockResolvedValue({ _id: 's1', status: 'approved' })
    const { result, invalidate } = await renderLoaded({ _id: 's1', status: 'submitted' })

    await act(() => result.current.approve('Go ahead'))

    expect(screeningService.approve).toHaveBeenCalledWith('s1', 'Go ahead')
    expect(invalidatedKeys(invalidate)).toEqual([['workspace', 'p1'], ['projects'], ['dashboard']])
    expect(result.current.screening.status).toBe('approved')
  })

  it('a failed request refreshes nothing and returns the backend message', async () => {
    screeningService.approve.mockRejectedValue({
      response: { status: 409, data: { error: 'Only a submitted screening can be approved' } },
    })
    const { result, invalidate } = await renderLoaded({ _id: 's1', status: 'submitted' })

    let outcome
    await act(async () => {
      outcome = await result.current.approve('Go ahead')
    })

    expect(invalidate).not.toHaveBeenCalled()
    expect(outcome).toEqual({ success: false, error: 'Only a submitted screening can be approved' })
    expect(result.current.error).toBe('Only a submitted screening can be approved')
  })

  it('two users of the hook at the same time share one request', async () => {
    screeningService.getByProject.mockResolvedValue({ _id: 's1', status: 'draft' })
    const { wrapper } = withQueryClient()
    const { result } = renderHook(() => [useScreening('p1'), useScreening('p1')], { wrapper })

    await waitFor(() => expect(result.current[1].isLoading).toBe(false))
    expect(screeningService.getByProject).toHaveBeenCalledTimes(1)
  })
})
