import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import api from '@/services/api'
import { useManagementActivities, useMitigationPlans } from './useSemp'
import { fail, mockGet, ok, withQueryClient } from '@/test/utils'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), put: vi.fn() },
}))

const saved = [
  {
    _id: 'r1',
    project: { _id: 'p1', title: 'Water network' },
    serial_number: 1,
    activity_description: 'Dig',
    responsible: { _id: 'u1', name: 'Rana' },
    responsible_text: '',
    createdAt: '2026-01-01',
  },
  {
    _id: 'r2',
    project: 'p1',
    serial_number: 2,
    activity_description: 'Fill',
    responsible: null,
    responsible_text: 'Contractor',
  },
]

async function renderTable(useTable = useManagementActivities, rows = saved) {
  mockGet(api, { '/management/project/p1': rows, '/mitigation/project/p1': rows })
  const { wrapper } = withQueryClient()
  const hook = renderHook(() => useTable('p1'), { wrapper })
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return hook
}

describe('useManagementActivities (Tool 3)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads the saved table', async () => {
    const { result } = await renderTable()

    expect(result.current.rows).toEqual(saved)
    expect(result.current.hasChanges).toBe(false)
  })

  it('saves the whole table in ONE request: updated, new and removed rows (D32)', async () => {
    const savedTable = [{ _id: 'r1', activity_description: 'Dig deeper' }]
    api.put.mockImplementation(() => ok(savedTable))
    const { result } = await renderTable()

    act(() => result.current.updateRow('r1', 'activity_description', 'Dig deeper'))
    act(() => result.current.deleteRow('r2'))
    act(() => {
      const row = result.current.addRow()
      result.current.updateRow(row._id, 'activity_description', 'Plant trees')
    })
    let outcome
    await act(async () => {
      outcome = await result.current.saveRows()
    })

    expect(outcome.success).toBe(true)
    expect(api.put).toHaveBeenCalledTimes(1)
    const [url, body] = api.put.mock.calls[0]
    expect(url).toBe('/projects/p1/management')
    expect(body.rows).toEqual([
      expect.objectContaining({
        _id: 'r1',
        serial_number: 1,
        activity_description: 'Dig deeper',
        responsible: 'u1', // populated user → id
        responsible_text: '',
      }),
      {
        serial_number: 2, // renumbered after the delete; new row: no temporary _id
        activity_description: 'Plant trees',
        responsible: null,
        responsible_text: '',
      },
    ])
    expect(body.rows[0]).not.toHaveProperty('project')
    // The saved table replaces the local edits
    expect(result.current.rows).toEqual(savedTable)
    expect(result.current.hasChanges).toBe(false)
  })

  it('keeps an external responsible party, and a picked user replaces it (D55)', async () => {
    api.put.mockImplementation(() => ok(saved))
    const { result } = await renderTable()

    await act(() => result.current.saveRows())
    expect(api.put.mock.calls[0][1].rows[1]).toMatchObject({
      responsible: null,
      responsible_text: 'Contractor',
    })

    act(() => result.current.updateRow('r2', 'responsible', 'u2'))
    await act(() => result.current.saveRows())
    expect(api.put.mock.calls[1][1].rows[1]).toMatchObject({
      responsible: 'u2',
      responsible_text: '',
    })
  })

  it('a row without its description stops the save before any request', async () => {
    const { result } = await renderTable()

    act(() => {
      result.current.addRow()
    })
    let outcome
    await act(async () => {
      outcome = await result.current.saveRows()
    })

    expect(outcome.success).toBe(false)
    expect(result.current.error).toMatch(/Activity Description/)
    expect(api.put).not.toHaveBeenCalled()
  })

  it('shows the backend message and keeps the edits when the save fails', async () => {
    api.put.mockImplementation(() => fail(400, 'Row 1: activity_description is required'))
    const { result } = await renderTable()

    act(() => result.current.updateRow('r1', 'notes', 'x'))
    await act(() => result.current.saveRows())

    expect(result.current.error).toBe('Row 1: activity_description is required')
    expect(result.current.rows[0].notes).toBe('x')
  })
})

describe('useMitigationPlans (Tool 4)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('saves through PUT /projects/:id/mitigation and needs the output description', async () => {
    const rows = [{ _id: 'm1', serial_number: 1, output_description: 'Network' }]
    api.put.mockImplementation(() => ok(rows))
    const { result } = await renderTable(useMitigationPlans, rows)

    await act(() => result.current.saveRows())
    expect(api.put).toHaveBeenCalledWith('/projects/p1/mitigation', {
      rows: [
        {
          _id: 'm1',
          serial_number: 1,
          output_description: 'Network',
          responsible: null,
          responsible_text: '',
        },
      ],
    })

    act(() => result.current.updateRow('m1', 'output_description', ' '))
    await act(() => result.current.saveRows())
    expect(result.current.error).toMatch(/Output Description/)
    expect(api.put).toHaveBeenCalledTimes(1)
  })
})
