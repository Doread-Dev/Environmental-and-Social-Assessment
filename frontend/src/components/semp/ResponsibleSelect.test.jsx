import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResponsibleSelect from './ResponsibleSelect'

const active = [{ _id: 'u1', name: 'Rana' }]

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
