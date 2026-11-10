// Phase 12a: the assessment metadata shows no Arabic UI text, and its four text areas are labelled
// by their visible question (and described by the hint below it).
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import MetadataFormSection from './MetadataFormSection'
import MetadataInfoSection from './MetadataInfoSection'

const ARABIC = /[؀-ۿ]/

describe('MetadataInfoSection', () => {
  const officer = { _id: 'u1', name: 'Rana', position: 'Engineer' }
  const other = { _id: 'u2', name: 'Omar', position: 'Specialist' }

  it('says in English that the submitter becomes the officer, with no Arabic text', () => {
    const { container } = render(
      <MetadataInfoSection officer={officer} currentUser={other} project={{}} />
    )
    expect(container.textContent).not.toMatch(ARABIC)
    expect(screen.getAllByText('(on submit)')).toHaveLength(2)
    expect(screen.getByText('Rana')).toHaveClass('line-through')
    expect(screen.getByText('Omar')).toBeInTheDocument()
  })

  it('shows no hint when the current user is the officer', () => {
    render(<MetadataInfoSection officer={officer} currentUser={officer} project={{}} />)
    expect(screen.queryByText('(on submit)')).toBeNull()
    expect(screen.getByText('Rana')).not.toHaveClass('line-through')
  })
})

describe('MetadataFormSection', () => {
  const questions = [
    ['project_activity', /The project \(Activity\) component being assessed/],
    ['description', /Brief description of the project \(activities\) being carried out/],
    ['environmental_setting', /Briefly describe the environmental setting/],
    ['legal_requirements', /The host country's legal requirements/],
  ]

  it.each(questions)('labels the %s text area by its question', (field, question) => {
    const onChange = vi.fn()
    render(<MetadataFormSection formData={{ [field]: 'old' }} onChange={onChange} />)
    const textarea = screen.getByRole('textbox', { name: question })
    expect(textarea).toHaveValue('old')
    fireEvent.change(textarea, { target: { value: 'new' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ [field]: 'new' }))
  })

  it('describes a text area by its hint, and by the error when there is one', () => {
    const { rerender } = render(<MetadataFormSection />)
    expect(screen.getByRole('textbox', { name: /Brief description/ })).toHaveAccessibleDescription(
      'Detail the operational activities, construction phases, and expected outputs.'
    )
    rerender(<MetadataFormSection errors={{ description: 'Required' }} />)
    expect(screen.getByRole('textbox', { name: /Brief description/ })).toHaveAccessibleDescription(
      'Required'
    )
  })

  it('makes every text area read-only in read-only mode', () => {
    render(<MetadataFormSection readOnly />)
    const boxes = screen.getAllByRole('textbox')
    expect(boxes).toHaveLength(4)
    boxes.forEach((box) => expect(box).toBeDisabled())
  })
})
