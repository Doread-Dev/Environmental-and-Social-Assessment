// Phase 12 (D76 3): Pagination (page list with dots), Tooltip (delay, position, hide) and
// Accordion (single / multiple open items).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import Pagination from './Pagination'
import Tooltip from './Tooltip'
import Accordion from './Accordion'

const pageLabels = () =>
  screen
    .getByRole('navigation')
    .querySelectorAll('button[aria-label^="Page "], span')
    .values()
    .map((el) => (el.tagName === 'SPAN' ? el.textContent.trim() : el.textContent))
    .filter(
      (text) => text && !['first_page', 'last_page', 'chevron_left', 'chevron_right'].includes(text)
    )
    .toArray()

describe('Pagination', () => {
  it.each([
    [1, 5, ['1', '2', '3', '4', '5']],
    [1, 20, ['1', '2', '3', '4', '5', '...', '20']],
    [10, 20, ['1', '...', '9', '10', '11', '...', '20']],
    [20, 20, ['1', '...', '16', '17', '18', '19', '20']],
  ])('page %i of %i shows %j', (current, total, expected) => {
    render(<Pagination currentPage={current} totalPages={total} onPageChange={() => {}} />)
    expect(pageLabels()).toEqual(expected)
    expect(screen.getByRole('button', { name: `Page ${current}` })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('moves with the arrows and page buttons, disabled at the ends', () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />
    )
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Last page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(onPageChange.mock.calls.map(([page]) => page)).toEqual([2, 3, 2])

    rerender(<Pagination currentPage={3} totalPages={3} onPageChange={onPageChange} />)
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(onPageChange).toHaveBeenLastCalledWith(2)
  })

  it('can hide the first / last buttons', () => {
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={() => {}} showFirstLast={false} />
    )
    expect(screen.queryByRole('button', { name: 'First page' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Last page' })).not.toBeInTheDocument()
  })
})

describe('Tooltip', () => {
  afterEach(() => vi.useRealTimers())

  it.each(['top', 'bottom', 'left', 'right'])(
    'shows its content after the delay (%s) and hides it on leave',
    (position) => {
      vi.useFakeTimers()
      render(
        <Tooltip content="More info" position={position} delay={100}>
          <button type="button">Help</button>
        </Tooltip>
      )
      const trigger = screen.getByRole('button', { name: 'Help' }).parentElement
      fireEvent.mouseEnter(trigger)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
      act(() => vi.advanceTimersByTime(100))
      expect(screen.getByRole('tooltip')).toHaveTextContent('More info')
      fireEvent.mouseLeave(trigger)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    }
  )

  it('opens on keyboard focus and does not open when the pointer leaves before the delay', () => {
    vi.useFakeTimers()
    render(
      <Tooltip content="Tip" delay={200}>
        <button type="button">Help</button>
      </Tooltip>
    )
    const trigger = screen.getByRole('button', { name: 'Help' }).parentElement
    fireEvent.mouseEnter(trigger)
    fireEvent.mouseLeave(trigger)
    act(() => vi.advanceTimersByTime(300))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.focus(trigger)
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tip')
    fireEvent.blur(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('Accordion', () => {
  const renderAccordion = (props) =>
    render(
      <Accordion {...props}>
        {['one', 'two'].map((value) => (
          <Accordion.Item key={value} value={value} disabled={value === 'two' && props.disableTwo}>
            <Accordion.Trigger>Section {value}</Accordion.Trigger>
            <Accordion.Content>Body {value}</Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion>
    )
  const trigger = (value) => screen.getByRole('button', { name: new RegExp(`Section ${value}`) })

  it('opens one item at a time by default and reports the open items', () => {
    const onChange = vi.fn()
    renderAccordion({ defaultOpen: 'one', onChange })
    expect(trigger('one')).toHaveAttribute('aria-expanded', 'true')
    expect(trigger('two')).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger('two'))
    expect(trigger('one')).toHaveAttribute('aria-expanded', 'false')
    expect(trigger('two')).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(trigger('two'))
    expect(trigger('two')).toHaveAttribute('aria-expanded', 'false')
    expect(onChange.mock.calls.map(([items]) => items)).toEqual([['two'], []])
  })

  it('keeps several items open with allowMultiple, and a disabled item does not toggle', () => {
    renderAccordion({ allowMultiple: true, defaultOpen: ['one'] })
    fireEvent.click(trigger('two'))
    expect(trigger('one')).toHaveAttribute('aria-expanded', 'true')
    expect(trigger('two')).toHaveAttribute('aria-expanded', 'true')
  })

  it('ignores clicks on a disabled item', () => {
    renderAccordion({ disableTwo: true })
    expect(trigger('two')).toBeDisabled()
    fireEvent.click(trigger('two'))
    expect(trigger('two')).toHaveAttribute('aria-expanded', 'false')
  })
})
