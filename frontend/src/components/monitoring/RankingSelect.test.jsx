import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import RankingSelect from './RankingSelect'

describe('RankingSelect (D69)', () => {
  it('starts empty when no ranking was picked', () => {
    render(<RankingSelect value={null} onChange={vi.fn()} />)

    expect(screen.getByRole('combobox')).toHaveValue('')
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Select ranking')
  })

  it('sends the picked level, and null for the empty option', () => {
    const onChange = vi.fn()
    render(<RankingSelect value="low" onChange={onChange} />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'not_applicable' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } })

    expect(onChange.mock.calls).toEqual([['not_applicable'], [null]])
  })
})
