import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import api from '@/services/api'
import { useMonitoring } from './useMonitoring'
import { mockGet, ok, withQueryClient } from '@/test/utils'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), put: vi.fn() },
}))

const lookups = {
  impact_categories: [{ _id: 'c1', code: 'A', name: 'Air' }],
  impact_questions: [],
  indicators: [
    { _id: 'i1', name: 'Dust', category: { _id: 'c1' } },
    { _id: 'i2', name: 'Noise', category: 'c1' },
  ],
  job_titles: [],
}
const savedRecord = {
  _id: 'm1',
  indicator: { _id: 'i1', name: 'Dust' },
  scores: { baseline: '1', Q1: '', Q2: '', Q3: '', Q4: '' },
  ranking: 'low',
  responsible: null,
  responsible_text: 'Municipality',
}

async function renderMonitoring() {
  mockGet(api, { '/lookups': lookups, '/monitoring/project/p1': [savedRecord] })
  const { wrapper } = withQueryClient()
  const hook = renderHook(() => useMonitoring('p1'), { wrapper })
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return hook
}

describe('useMonitoring (Tool 5)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists every indicator of a category, with its record or an empty placeholder', async () => {
    const { result } = await renderMonitoring()

    const data = result.current.getCategoryData('A')
    expect(data.map(({ indicator }) => indicator._id)).toEqual(['i1', 'i2'])
    expect(data[0].record).toBe(savedRecord)
    expect(data[1].record).toMatchObject({ _id: 'placeholder_i2', isNew: true })
    expect(result.current.getAllCategoryStats()[0].stats).toMatchObject({ completed: 1, total: 2 })
  })

  it('saves only the changed records, by indicator, in ONE request (D32)', async () => {
    api.put.mockImplementation(() => ok([savedRecord]))
    const { result } = await renderMonitoring()

    act(() => result.current.updateQuarterScore('m1', 'Q1', '2'))
    act(() => result.current.updateRecordField('placeholder_i2', 'note', 'Checked'))
    let outcome
    await act(async () => {
      outcome = await result.current.saveAllRecords()
    })

    expect(outcome.success).toBe(true)
    expect(api.put).toHaveBeenCalledTimes(1)
    const [url, body] = api.put.mock.calls[0]
    expect(url).toBe('/projects/p1/monitoring')
    expect(body.records).toEqual([
      {
        indicator: 'i1',
        scores: { baseline: '1', Q1: '2', Q2: '', Q3: '', Q4: '' },
        total: '',
        final_assessment: '',
        ranking: 'low',
        note: '',
        responsible: null,
        responsible_text: 'Municipality', // external party kept
      },
      expect.objectContaining({ indicator: 'i2', note: 'Checked', ranking: null }), // empty until picked (D69)
    ])
    expect(result.current.hasChanges).toBe(false)
  })

  it('shows local edits before saving', async () => {
    const { result } = await renderMonitoring()

    act(() => result.current.updateQuarterScore('placeholder_i2', 'baseline', '5', 'i2'))

    expect(result.current.records).toHaveLength(2)
    expect(result.current.getCategoryData('A')[1].record.scores.baseline).toBe('5')
    expect(result.current.hasChanges).toBe(true)
  })

  it('nothing changed → no request', async () => {
    const { result } = await renderMonitoring()

    await act(() => result.current.saveAllRecords())

    expect(api.put).not.toHaveBeenCalled()
  })
})
