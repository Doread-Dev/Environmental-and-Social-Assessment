// Phase 12 (D76 3): the error boundary (incl. the one-time reload after a new deploy) and the
// offline banner with its hook.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'
import { OfflineBanner } from './OfflineBanner'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

let failWith = null
function Thrower() {
  if (failWith) throw failWith
  return <p>All good</p>
}

describe('ErrorBoundary', () => {
  let reload
  beforeEach(() => {
    sessionStorage.clear()
    reload = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    })
  })
  afterEach(() => {
    failWith = null
    vi.restoreAllMocks()
  })

  it('renders its children when nothing fails', () => {
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('shows "Something went wrong" with Try Again, which renders the children again', () => {
    failWith = new Error('boom')
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    )
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Dashboard' })).toHaveAttribute(
      'href',
      '/app/dashboard'
    )
    expect(reload).not.toHaveBeenCalled()

    failWith = null
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('reloads once after a failed chunk load (new deploy), then offers a manual reload', () => {
    failWith = new Error('Failed to fetch dynamically imported module: /assets/x.js')
    const { unmount } = render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    )
    expect(reload).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('esms_chunk_reload_done')).toBe('1')
    unmount()

    // Second time in the same tab: no automatic reload loop, a button instead
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    )
    expect(reload).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('heading', { name: 'New version available' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reload page' }))
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['ChunkLoadError', 'x'],
    ['Error', 'Loading chunk 12 failed'],
    ['TypeError', 'Importing a module script failed.'],
    ['Error', 'error loading dynamically imported module'],
  ])('treats %s "%s" as a chunk load error', (name, message) => {
    sessionStorage.setItem('esms_chunk_reload_done', '1')
    failWith = Object.assign(new Error(message), { name })
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    )
    expect(screen.getByRole('heading', { name: 'New version available' })).toBeInTheDocument()
  })
})

describe('useOnlineStatus and OfflineBanner', () => {
  const setOnline = (value) => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value })
    act(() => window.dispatchEvent(new Event(value ? 'online' : 'offline')))
  }
  afterEach(() => Object.defineProperty(navigator, 'onLine', { configurable: true, value: true }))

  it('follows the browser online/offline events', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
    setOnline(false)
    expect(result.current).toBe(false)
    setOnline(true)
    expect(result.current).toBe(true)
  })

  it('shows the banner only while offline', () => {
    render(<OfflineBanner />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    setOnline(false)
    expect(screen.getByRole('alert')).toHaveTextContent('You are offline')
    setOnline(true)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
