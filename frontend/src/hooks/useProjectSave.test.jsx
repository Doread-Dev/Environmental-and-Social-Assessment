import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { SaveConflictProvider } from '@/contexts/SaveConflictContext'
import { useSaveConflict } from '@/contexts/useSaveConflict'
import { createTestQueryClient } from '@/test/utils'
import { useProjectSave } from './useProjectSave'

const httpError = (status, data) => Object.assign(new Error('x'), { response: { status, data } })
const stale = () =>
  httpError(409, { error: 'Someone else changed this since you opened it.', code: 'STALE_VERSION' })

function wrapperWith(queryClient, { provider = true } = {}) {
  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        {provider ? <SaveConflictProvider>{children}</SaveConflictProvider> : children}
      </QueryClientProvider>
    )
  }
  return Wrapper
}

describe('useProjectSave (D61, D62)', () => {
  let queryClient
  beforeEach(() => {
    queryClient = createTestQueryClient()
  })

  it('a second call while one runs (double click) sends no second request', async () => {
    let finish
    const request = vi.fn(() => new Promise((resolve) => (finish = resolve)))
    const { result } = renderHook(() => useProjectSave('p1'), {
      wrapper: wrapperWith(queryClient),
    })

    let first
    let second
    act(() => {
      first = result.current.save(request)
      second = result.current.save(request)
    })
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    await act(async () => finish({ _id: 'r1' }))

    expect(await first).toEqual({ success: true, data: { _id: 'r1' } })
    expect(await second).toEqual({ success: true, data: { _id: 'r1' } })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('after a call finished, the next one sends its request', async () => {
    const request = vi.fn(async () => 'ok')
    const { result } = renderHook(() => useProjectSave('p1'), {
      wrapper: wrapperWith(queryClient),
    })

    await act(() => result.current.save(request))
    await act(() => result.current.save(request))

    expect(request).toHaveBeenCalledTimes(2)
  })

  it('a stale save opens the shared dialog and is handled (no page error)', async () => {
    const { result } = renderHook(() => useProjectSave('p1', ['screening', 'p1']), {
      wrapper: wrapperWith(queryClient),
    })

    let outcome
    await act(async () => {
      outcome = await result.current.save(() => Promise.reject(stale()))
    })

    expect(outcome).toMatchObject({ success: false, handled: true })
    expect(result.current.error).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Someone else changed this' })).toBeInTheDocument()
  })

  it('without the provider a stale save is a plain error', async () => {
    const { result } = renderHook(() => useProjectSave('p1'), {
      wrapper: wrapperWith(queryClient, { provider: false }),
    })

    await act(() => result.current.save(() => Promise.reject(stale())))

    expect(result.current.error).toMatch(/Someone else changed this/)
  })

  it('an expired session is handled by the sign-in dialog (no page error)', async () => {
    const { result } = renderHook(() => useProjectSave('p1'), {
      wrapper: wrapperWith(queryClient),
    })
    const expired = Object.assign(httpError(401, { error: 'Token expired' }), {
      sessionExpired: true,
    })

    let outcome
    await act(async () => {
      outcome = await result.current.save(() => Promise.reject(expired))
    })

    expect(outcome).toMatchObject({ success: false, handled: true })
    expect(result.current.error).toBeNull()
  })

  it('other errors answer and show the extractErrorMessage text', async () => {
    const { result } = renderHook(() => useProjectSave('p1'), {
      wrapper: wrapperWith(queryClient),
    })

    let outcome
    await act(async () => {
      outcome = await result.current.save(() =>
        Promise.reject(httpError(409, { error: 'Tool 1 (Screening) must be approved first' }))
      )
    })

    expect(outcome).toEqual({ success: false, error: 'Tool 1 (Screening) must be approved first' })
    expect(result.current.error).toBe('Tool 1 (Screening) must be approved first')
  })
})

describe('stale-save dialog (SaveConflictProvider)', () => {
  // A tool page: its query, the workspace query, and a save that comes back stale
  function ToolPage({ load, loadWorkspace }) {
    const { reloadKey } = useSaveConflict()
    const tool = useQuery({ queryKey: ['management', 'p1'], queryFn: load })
    useQuery({ queryKey: ['workspace', 'p1'], queryFn: loadWorkspace })
    const { save } = useProjectSave('p1', ['management', 'p1'])
    return (
      <div>
        <p>Page mount {reloadKey}</p>
        <p>Saved: {tool.data}</p>
        <input aria-label="Typed" defaultValue="" />
        <button type="button" onClick={() => save(() => Promise.reject(stale()))}>
          Save
        </button>
      </div>
    )
  }

  function setup() {
    const queryClient = createTestQueryClient()
    const load = vi.fn(async () => (load.mock.calls.length > 1 ? 'theirs' : 'mine'))
    const loadWorkspace = vi.fn(async () => ({ project: { _id: 'p1' } }))
    render(
      <QueryClientProvider client={queryClient}>
        <SaveConflictProvider>
          <ToolPage load={load} loadWorkspace={loadWorkspace} />
        </SaveConflictProvider>
      </QueryClientProvider>
    )
    return { load, loadWorkspace }
  }

  it('says that someone else changed it, with Reload and Keep editing', async () => {
    setup()
    await screen.findByText('Saved: mine')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    const dialog = await screen.findByRole('dialog', { name: 'Someone else changed this' })
    expect(dialog).toHaveTextContent('Someone else changed this since you opened it')
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep editing' })).toBeInTheDocument()
  })

  it('Keep editing closes it and keeps the typed input', async () => {
    setup()
    await screen.findByText('Saved: mine')
    fireEvent.change(screen.getByLabelText('Typed'), { target: { value: 'my text' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Keep editing' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByLabelText('Typed')).toHaveValue('my text')
    expect(screen.getByText('Page mount 0')).toBeInTheDocument()
  })

  it('Reload refetches the tool and the workspace, then mounts the page again', async () => {
    const { load, loadWorkspace } = setup()
    await screen.findByText('Saved: mine')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Reload' }))

    expect(await screen.findByText('Saved: theirs')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
    expect(loadWorkspace).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(screen.getByText('Page mount 1')).toBeInTheDocument())
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
