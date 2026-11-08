// Phase 12 (D76 3): the theme provider (stored choice, system theme, toggle), and two small
// components with logic: an assessment score row and the workflow progress bar.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { ThemeProvider } from './ThemeContext'
import { useTheme } from './useTheme'
import ImpactScoreRow from '@/components/assessment/ImpactScoreRow'
import WorkflowProgressBar from '@/components/dashboard/WorkflowProgressBar'

let systemDark = false
let mediaListeners = []
beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  systemDark = false
  mediaListeners = []
  window.matchMedia = vi.fn(() => ({
    get matches() {
      return systemDark
    },
    addEventListener: (_event, fn) => mediaListeners.push(fn),
    removeEventListener: (_event, fn) => (mediaListeners = mediaListeners.filter((l) => l !== fn)),
  }))
})
afterEach(() => vi.restoreAllMocks())

const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
const isDarkClass = () => document.documentElement.classList.contains('dark')

describe('ThemeProvider', () => {
  it('starts light, toggles to dark and stores the choice', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.resolvedTheme).toBe('light')
    expect(isDarkClass()).toBe(false)
    act(() => result.current.toggleTheme())
    expect(result.current.resolvedTheme).toBe('dark')
    expect(isDarkClass()).toBe(true)
    expect(localStorage.getItem('esms-theme')).toBe('dark')
  })

  it('starts from a stored theme and ignores an unknown stored value', () => {
    localStorage.setItem('esms-theme', 'dark')
    const { result, unmount } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('dark')
    expect(isDarkClass()).toBe(true)
    unmount()

    localStorage.setItem('esms-theme', 'purple')
    const second = renderHook(() => useTheme(), { wrapper })
    expect(second.result.current.theme).toBe('light')
  })

  it('follows the system theme while "system" is chosen, and stops after another choice', () => {
    systemDark = true
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setTheme('system'))
    expect(result.current.resolvedTheme).toBe('dark')
    act(() => mediaListeners.forEach((listener) => listener({ matches: false })))
    expect(result.current.resolvedTheme).toBe('light')
    expect(isDarkClass()).toBe(false)
    act(() => result.current.setTheme('dark'))
    expect(mediaListeners).toHaveLength(0)
  })
})

describe('ImpactScoreRow', () => {
  const question = { id: 'q1', text: 'Will the project generate dust?' }
  const renderRow = (props) =>
    render(
      <table>
        <tbody>
          <ImpactScoreRow question={question} {...props} />
        </tbody>
      </table>
    )

  it('reports a new level and note with the question id', () => {
    const onScoreChange = vi.fn()
    const onNoteChange = vi.fn()
    renderRow({ score: { level: 'negligible' }, onScoreChange, onNoteChange })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'high' } })
    fireEvent.change(screen.getByPlaceholderText('Add notes or mitigation measures...'), {
      target: { value: 'Water spraying' },
    })
    expect(onScoreChange).toHaveBeenCalledWith('q1', 'high')
    expect(onNoteChange).toHaveBeenCalledWith('q1', 'Water spraying')
  })

  it('shows the level as text when read-only, "Not Set" without one', () => {
    const { unmount } = renderRow({ score: { level: 'medium' }, readOnly: true })
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    unmount()
    renderRow({ score: null, readOnly: true })
    expect(screen.getByText('Not Set')).toBeInTheDocument()
  })
})

describe('WorkflowProgressBar', () => {
  it('shows one segment per step with its status as the title, and optional labels', () => {
    const progress = {
      steps: {
        screening: { status: 'approved' },
        assessment: { status: 'submitted' },
        semp: { status: 'locked' },
      },
    }
    const { container } = render(<WorkflowProgressBar progress={progress} showLabels />)
    const titles = [...container.querySelectorAll('[title]')].map((el) => el.getAttribute('title'))
    expect(titles).toHaveLength(4)
    expect(titles[0]).toMatch(/^Screening: /)
    expect(titles[1]).toMatch(/^Assessment: /)
    expect(titles[2]).toMatch(/^SEMP: /)
    expect(titles[3]).toMatch(/^Monitoring: /)
    expect(titles[0]).not.toBe(titles[3].replace('Monitoring', 'Screening'))
    expect(screen.getByText('Scr')).toBeInTheDocument()
    expect(screen.getByText('Mon')).toBeInTheDocument()
  })

  it('treats a missing workflow as not started; labels can be hidden', () => {
    const { container } = render(<WorkflowProgressBar progress={null} showLabels={false} />)
    expect(container.querySelectorAll('[title]')).toHaveLength(4)
    expect(screen.queryByText('Scr')).not.toBeInTheDocument()
  })
})
