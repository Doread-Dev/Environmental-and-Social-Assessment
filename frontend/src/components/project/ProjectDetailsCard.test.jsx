import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProjectDetailsCard from './ProjectDetailsCard'

const valueOf = (label) => screen.getByText(label).nextElementSibling.textContent

describe('ProjectDetailsCard', () => {
  it('renders the project location, component and dates', () => {
    render(
      <ProjectDetailsCard
        location="Aleppo, Al-Salam district"
        component="Water network rehabilitation"
        startDate="2026-01-15T12:00:00.000Z"
        endDate="2026-12-31T12:00:00.000Z"
      />
    )

    expect(screen.getByText('Project Details')).toBeInTheDocument()
    expect(valueOf('Location')).toBe('Aleppo, Al-Salam district')
    expect(valueOf('Component / Activity')).toBe('Water network rehabilitation')
    expect(valueOf('Start Date')).toBe('January 15, 2026')
    expect(valueOf('End Date')).toBe('December 31, 2026')
    expect(screen.queryByText('Not specified')).not.toBeInTheDocument()
  })

  it('shows "Not specified" for empty or blank values', () => {
    render(<ProjectDetailsCard location="   " component="" />)

    expect(valueOf('Location')).toBe('Not specified')
    expect(valueOf('Component / Activity')).toBe('Not specified')
    expect(valueOf('Start Date')).toBe('Not specified')
    expect(valueOf('End Date')).toBe('Not specified')
  })
})
