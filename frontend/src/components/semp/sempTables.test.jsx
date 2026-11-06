// Phase 12 (D76 3): the Tools 3 / 4 grids — every cell reports its field, the responsible switch
// reports both fields (D55), rows are added and deleted (hover button), read-only shows no controls.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ManagementActivitiesTable from './ManagementActivitiesTable'
import MitigationPlanTable from './MitigationPlanTable'

const users = [{ _id: 'u1', name: 'Rana', is_active: true }]

const TABLES = [
  {
    name: 'ManagementActivitiesTable (Tool 3)',
    Component: ManagementActivitiesTable,
    prop: 'activities',
    row: {
      _id: 'r1',
      serial_number: 1,
      activity_description: 'Dig',
      potential_impact: 'Dust',
      recommended_actions: 'Spray',
      monitoring_requirements: 'Log',
      notes: 'n',
    },
    fields: [
      'activity_description',
      'potential_impact',
      'recommended_actions',
      'monitoring_requirements',
      'notes',
    ],
  },
  {
    name: 'MitigationPlanTable (Tool 4)',
    Component: MitigationPlanTable,
    prop: 'plans',
    row: {
      _id: 'r1',
      serial_number: 1,
      output_description: 'Pipes',
      potential_impact_and_significance: 'Noise',
      mitigation_and_enhancement_measures: 'Day work',
      monitoring: 'Weekly',
      schedule: 'Q1',
      notes: 'n',
    },
    fields: [
      'output_description',
      'potential_impact_and_significance',
      'mitigation_and_enhancement_measures',
      'monitoring',
      'schedule',
      'notes',
    ],
  },
]

describe.each(TABLES)('$name', ({ Component, prop, row, fields }) => {
  const setup = (props = {}) => {
    const handlers = { onUpdate: vi.fn(), onDelete: vi.fn(), onAddRow: vi.fn() }
    const view = render(<Component {...{ [prop]: [row] }} users={users} {...handlers} {...props} />)
    const cells = [...view.container.querySelectorAll('[contenteditable="true"]')]
    return { ...handlers, ...view, cells }
  }

  it('shows the row and reports each edited cell with its field', () => {
    const { cells, onUpdate } = setup()
    expect(cells).toHaveLength(fields.length)
    cells.forEach((cell, i) => {
      cell.textContent = `new ${i}`
      fireEvent.input(cell)
    })
    expect(onUpdate.mock.calls).toEqual(fields.map((field, i) => ['r1', field, `new ${i}`]))
  })

  it('reports both responsible fields when the type changes (D55)', () => {
    const { onUpdate } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'External' }))
    fireEvent.change(screen.getByLabelText('External party'), { target: { value: 'Contractor' } })
    const responsibleCalls = onUpdate.mock.calls.filter(([, field]) =>
      ['responsible', 'responsible_text'].includes(field)
    )
    expect(responsibleCalls).toContainEqual(['r1', 'responsible_text', 'Contractor'])
    expect(responsibleCalls).toContainEqual(['r1', 'responsible', null])
  })

  it('adds a row and deletes the hovered row', () => {
    const { container, onAddRow, onDelete } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Add another row/ }))
    expect(onAddRow).toHaveBeenCalledTimes(1)
    fireEvent.mouseEnter(container.querySelector('tbody tr'))
    fireEvent.click(screen.getByTitle('Delete Row'))
    expect(onDelete).toHaveBeenCalledWith('r1')
  })

  it('read-only: no editable cell, no add or delete', () => {
    const { container, cells } = setup({ readOnly: true })
    expect(cells).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Add another row/ })).not.toBeInTheDocument()
    fireEvent.mouseEnter(container.querySelector('tbody tr'))
    expect(screen.queryByTitle('Delete Row')).not.toBeInTheDocument()
    expect(container).toHaveTextContent(fields.length === 5 ? 'Dig' : 'Pipes')
  })
})
