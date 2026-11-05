import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import AssessmentProgressIndicator from './AssessmentProgressIndicator'
import AssessmentStartCard from './AssessmentStartCard'
import ProjectContextCard from './ProjectContextCard'
import { ArchivedNotice } from '@/components/project'

const workflow = (steps) => ({
  steps: Object.fromEntries(Object.entries(steps).map(([k, status]) => [k, { status }])),
})

describe('Assessment gateway (owner-reported, phase 10)', () => {
  it('the step indicator shows all four steps, Monitoring included', () => {
    render(
      <AssessmentProgressIndicator
        workflow={workflow({
          screening: 'approved',
          assessment: 'not_started',
          semp: 'locked',
          monitoring: 'locked',
        })}
      />
    )
    const nav = screen.getByRole('navigation', { name: 'Workflow progress' })
    const items = within(nav).getAllByRole('listitem')
    expect(items.map((li) => li.textContent.replace(' (done)', ''))).toEqual([
      'check_circleScreening',
      '2Assessment',
      '3SEMP',
      '4Monitoring',
    ])
    expect(items[0]).toHaveTextContent('(done)')
    expect(items[1]).toHaveAttribute('aria-current', 'step')
  })

  it('the start card has the shared status badge, no accent border and no decorative icon', () => {
    const { container } = render(
      <AssessmentStartCard status="not_started" onStart={vi.fn()} onContinue={vi.fn()} />
    )
    expect(screen.getByText('Not Started').closest('[data-status]')).toHaveAttribute(
      'data-status',
      'not_started'
    )
    expect(container.querySelector('.absolute.left-0.w-2')).toBeNull()
    expect(screen.queryByText('assignment_add')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Environmental Assessment/ })).toBeVisible()
  })
})

describe('Project Context card (owner-reported, phase 10)', () => {
  const project = {
    title: 'Water Network',
    location: 'Aleppo',
    project_component: 'Pipes',
    start_date: '2026-01-15T00:00:00Z',
    end_date: null,
  }
  const valueOf = (label) => screen.getByText(label).nextElementSibling.textContent

  it('shows real project data only: no map image, no title, "Not specified" when empty', () => {
    const { container } = render(<ProjectContextCard project={project} screening={null} />)
    expect(screen.getByText('Project Context')).toBeInTheDocument()
    expect(container.querySelector('img, [style*="background-image"]')).toBeNull()
    expect(screen.queryByText('Water Network')).not.toBeInTheDocument()
    expect(valueOf('Location')).toBe('Aleppo')
    expect(valueOf('Component / Activity')).toBe('Pipes')
    expect(valueOf('Start Date')).toBe('15 Jan 2026')
    expect(valueOf('End Date')).toBe('Not specified')
    expect(valueOf('Screening approved by')).toBe('Not specified')
  })

  it('"Screening approved by" comes from status_history when approved_by is not populated (D16)', () => {
    const screening = {
      status: 'approved',
      approved_by: 'u1',
      status_history: [
        { status: 'approved', by: { name: 'Lina Haddad', role: 'environmental_specialist' } },
      ],
    }
    render(<ProjectContextCard project={project} screening={screening} />)
    expect(valueOf('Screening approved by')).toBe('Lina Haddad (Environmental Specialist)')
  })
})

describe('ArchivedNotice (D17)', () => {
  it('says who archived the project and when; nothing on an active project', () => {
    const { rerender } = render(
      <ArchivedNotice
        project={{
          archived: true,
          archived_by: { name: 'Omar' },
          archived_at: '2026-10-20T10:00:00Z',
        }}
      />
    )
    expect(screen.getByText('Archived project — read only')).toBeInTheDocument()
    expect(screen.getByText(/archived by Omar on 20 Oct 2026/)).toBeInTheDocument()
    rerender(<ArchivedNotice project={{ archived: false }} />)
    expect(screen.queryByText(/read only/)).not.toBeInTheDocument()
  })
})
