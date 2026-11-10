import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import EditableCell from './EditableCell'

const paste = (cell, { text, html }) =>
  fireEvent.paste(cell, {
    clipboardData: { getData: (type) => (type === 'text/plain' ? text : html) },
  })

describe('EditableCell free-text limit (D74 4)', () => {
  it('typing or pasting past 30,000 characters is cut at the limit', () => {
    const onChange = vi.fn()
    const { container } = render(<EditableCell value="" onChange={onChange} multiline />)
    const cell = container.querySelector('[contenteditable="true"]')

    paste(cell, { text: 'x'.repeat(30005) })
    expect(onChange).toHaveBeenLastCalledWith('x'.repeat(30000))

    cell.textContent = 'y'.repeat(30001)
    fireEvent.input(cell)
    expect(onChange).toHaveBeenLastCalledWith('y'.repeat(30000))
    expect(cell.textContent).toHaveLength(30000)
  })
})

describe('EditableCell paste (phase 10a: what is shown is what is saved)', () => {
  it('pastes formatted text as plain text', () => {
    const onChange = vi.fn()
    const { container } = render(<EditableCell value="" onChange={onChange} multiline />)
    const cell = container.querySelector('[contenteditable="true"]')

    paste(cell, {
      text: 'Dig the trench',
      html: '<b>Dig</b> the <a href="x">trench</a><img src="y">',
    })

    expect(onChange).toHaveBeenLastCalledWith('Dig the trench')
    expect(cell.querySelector('b, a, img')).toBeNull()
    expect(cell).toHaveTextContent('Dig the trench')
  })

  it('a single-line cell gets pasted lines joined with spaces', () => {
    const onChange = vi.fn()
    const { container } = render(<EditableCell value="" onChange={onChange} />)

    paste(container.querySelector('[contenteditable="true"]'), { text: 'Line one\nLine two' })

    expect(onChange).toHaveBeenLastCalledWith('Line one Line two')
  })
})
