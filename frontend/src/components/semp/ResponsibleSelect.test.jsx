import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ResponsibleSelect from './ResponsibleSelect'

const active = [{ _id: 'u1', name: 'Rana' }]
const toggle = (name) => screen.getByRole('button', { name })

describe('ResponsibleSelect (D4)', () => {
  it('offers only the users passed in (the active ones)', () => {
    render(<ResponsibleSelect value={null} onChange={vi.fn()} users={active} />)
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Select...', 'Rana'])
  })

  it('keeps showing a since-deactivated responsible user, marked inactive and not selectable', () => {
    const value = { _id: 'u2', name: 'Omar', is_active: false }
    render(<ResponsibleSelect value={value} onChange={vi.fn()} users={active} />)

    const option = screen.getByRole('option', { name: 'Omar (inactive)' })
    expect(option).toBeDisabled()
    expect(screen.getByRole('combobox')).toHaveValue('u2')
  })

  it('read-only cells show the inactive user name too', () => {
    const value = { _id: 'u2', name: 'Omar', is_active: false }
    render(<ResponsibleSelect value={value} onChange={vi.fn()} users={active} readOnly />)
    expect(screen.getByText('Omar (inactive)')).toBeInTheDocument()
  })
})

describe('ResponsibleSelect: internal user or external party (D55)', () => {
  it('starts in user mode and picking a user sends no external party', () => {
    const onChange = vi.fn()
    render(<ResponsibleSelect value={null} onChange={onChange} users={active} />)

    expect(toggle(/User/)).toHaveAttribute('aria-pressed', 'true')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'u1' } })
    expect(onChange).toHaveBeenCalledWith({ responsible: 'u1', responsible_text: '' })
  })

  it('switching to External clears the user and shows a text field', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <ResponsibleSelect value={{ _id: 'u1', name: 'Rana' }} onChange={onChange} users={active} />
    )

    fireEvent.click(toggle(/External/))
    expect(onChange).toHaveBeenCalledWith({ responsible: null, responsible_text: '' })

    // the parent stores the cleared values
    rerender(<ResponsibleSelect value={null} valueText="" onChange={onChange} users={active} />)
    expect(toggle(/External/)).toHaveAttribute('aria-pressed', 'true')
    fireEvent.change(screen.getByRole('textbox', { name: 'External party' }), {
      target: { value: 'المقاول' },
    })
    expect(onChange).toHaveBeenLastCalledWith({ responsible: null, responsible_text: 'المقاول' })
  })

  it('a saved external party opens in external mode; switching back clears it', () => {
    const onChange = vi.fn()
    render(
      <ResponsibleSelect value={null} valueText="Municipality" onChange={onChange} users={active} />
    )

    expect(screen.getByRole('textbox', { name: 'External party' })).toHaveValue('Municipality')
    fireEvent.click(toggle(/User/))
    expect(onChange).toHaveBeenCalledWith({ responsible: null, responsible_text: '' })
  })

  it('read-only shows the external party', () => {
    render(<ResponsibleSelect value={null} valueText="Municipality" onChange={vi.fn()} readOnly />)
    expect(screen.getByText('Municipality')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
