import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import api from '@/services/api'
import { PlaceBadges, PlacePicker } from './PlacePicker'
import { fail, lookupsFixture, ok, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))

function Picker({ initial = [], onChange = () => {} }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <PlacePicker
        value={value}
        onChange={(next) => {
          setValue(next)
          onChange(next)
        }}
      />
      <div data-testid="badges">
        <PlaceBadges keys={value} />
      </div>
    </>
  )
}

const renderPicker = (props) => renderApp([{ path: '/', element: <Picker {...props} /> }], '/')

describe('PlacePicker (D64 a)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signIn()
    api.get.mockImplementation((url) =>
      url === '/lookups' ? ok(lookupsFixture()) : fail(404, `No mock for GET ${url}`)
    )
  })

  it('groups the places by group, in registry order, and marks v3 places', async () => {
    renderPicker()
    const workflow = await screen.findByRole('group', { name: 'Project workflow' })
    expect(
      within(workflow)
        .getAllByRole('checkbox')
        .map((c) => c.getAttribute('aria-label'))
    ).toEqual([
      'Screening – Tool 1',
      'Assessment – Tool 2',
      'Management activities – Tool 3',
      'Mitigation plan – Tool 4',
      'Monitoring – Tool 5',
    ])
    const support = screen.getByRole('group', { name: 'Project support' })
    expect(within(support).getByRole('checkbox', { name: 'SEMP Plan (v3)' })).toBeEnabled()
    expect(within(support).getAllByText('v3')).toHaveLength(2)
    const organization = screen.getByRole('group', { name: 'Organization' })
    expect(within(organization).getByRole('checkbox', { name: 'GHG Emissions (v3)' })).toBeEnabled()
  })

  it('no choice = General — Library only; v3 places can be chosen', async () => {
    const onChange = vi.fn()
    renderPicker({ onChange })
    await screen.findByRole('group', { name: 'Project workflow' })
    expect(within(screen.getByTestId('badges')).getByText('General — Library only')).toBeVisible()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Mitigation plan – Tool 4' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'SEMP Plan (v3)' }))
    expect(onChange).toHaveBeenLastCalledWith(['mitigation', 'semp_plan'])
    const badges = within(screen.getByTestId('badges'))
    expect(badges.getByText('Mitigation plan – Tool 4')).toBeVisible()
    expect(badges.getByText(/SEMP Plan · v3/)).toBeVisible()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Mitigation plan – Tool 4' }))
    expect(onChange).toHaveBeenLastCalledWith(['semp_plan'])
  })
})
