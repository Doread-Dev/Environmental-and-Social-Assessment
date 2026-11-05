import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useProjectWorkbook, workbookTools } from './useProjectWorkbook'
import { withQueryClient, workspaceFixture } from '@/test/utils'
import { projectService } from '@/services/projectService'
import { screeningService } from '@/services/screeningService'
import { sempService } from '@/services/sempService'
import { monitoringService } from '@/services/monitoringService'
import { lookupService } from '@/services/lookupService'
import { assessmentService } from '@/services'
import { exportProjectWorkbook } from '@/utils/excelExport'

vi.mock('@/utils/excelExport', () => ({
  exportProjectWorkbook: vi.fn(async () => 'ESMS_Water_network_2026-11-04.xlsx'),
}))
vi.mock('@/services/projectService', () => ({ projectService: { getWorkspace: vi.fn() } }))
vi.mock('@/services/screeningService', () => ({ screeningService: { getByProject: vi.fn() } }))
vi.mock('@/services/sempService', () => ({
  sempService: { getManagementActivities: vi.fn(), getMitigationPlans: vi.fn() },
}))
vi.mock('@/services/monitoringService', () => ({ monitoringService: { getByProject: vi.fn() } }))
vi.mock('@/services/lookupService', () => ({ lookupService: { getAll: vi.fn() } }))
vi.mock('@/services', () => ({ assessmentService: { getByProject: vi.fn() } }))

const lookups = {
  impactCategories: [{ _id: 'c1', code: 'A', name: 'Air' }],
  impactQuestions: [{ _id: 'q1', category: 'c1', question_text: 'Dust?' }],
  indicators: [{ _id: 'i1', category: 'c1', name: 'Visible dust' }],
}

function workspace(counts) {
  return {
    ...workspaceFixture({ allowed_actions: ['export'] }),
    screening: { status: 'approved' },
    assessment: { status: 'approved' },
    counts,
  }
}

async function renderLoaded(counts) {
  projectService.getWorkspace.mockResolvedValue(workspace(counts))
  const { wrapper } = withQueryClient()
  const hook = renderHook(() => useProjectWorkbook('p1'), { wrapper })
  await waitFor(() => expect(hook.result.current.hasData).toBe(true))
  return hook
}

const NO_ROWS = { management_activities: 0, mitigation_plans: 0, monitoring_records: 0 }

beforeEach(() => {
  vi.clearAllMocks()
  screeningService.getByProject.mockResolvedValue({ _id: 's1', status: 'approved' })
  assessmentService.getByProject.mockResolvedValue({
    _id: 'a1',
    methods: [],
    consultations: [],
    scores: [{ question: 'q1', level: 'low' }],
  })
  sempService.getManagementActivities.mockResolvedValue([{ _id: 'm1' }])
  sempService.getMitigationPlans.mockResolvedValue([{ _id: 't1' }])
  monitoringService.getByProject.mockResolvedValue([{ _id: 'r1', indicator: 'i1' }])
  lookupService.getAll.mockResolvedValue(lookups)
})

describe('useProjectWorkbook (D67 b)', () => {
  it('knows from the workspace which tools have data', () => {
    expect(
      workbookTools({
        screening: {},
        assessment: null,
        counts: { management_activities: 2, mitigation_plans: 0, monitoring_records: 1 },
      })
    ).toEqual({ tool1: true, tool2: false, tool3: true, tool4: false, tool5: true })
    expect(workbookTools({ screening: null, assessment: null, counts: null })).toEqual({
      tool1: false,
      tool2: false,
      tool3: false,
      tool4: false,
      tool5: false,
    })
  })

  it('loads every tool with data and hands the workbook all of it', async () => {
    const { result } = await renderLoaded({
      management_activities: 1,
      mitigation_plans: 1,
      monitoring_records: 1,
    })

    let outcome
    await act(async () => {
      outcome = await result.current.exportWorkbook()
    })

    expect(outcome).toEqual({ success: true, fileName: 'ESMS_Water_network_2026-11-04.xlsx' })
    const data = exportProjectWorkbook.mock.calls[0][0]
    expect(data.screening._id).toBe('s1')
    expect(data.assessment.assessment._id).toBe('a1')
    expect(data.assessment.impactScores).toEqual([{ question: 'q1', level: 'low' }])
    expect(data.management).toEqual([{ _id: 'm1' }])
    expect(data.mitigation).toEqual([{ _id: 't1' }])
    expect(data.records).toEqual([{ _id: 'r1', indicator: 'i1' }])
    expect(data.categoriesWithQuestions[0].questions[0].question).toBe('Dust?')
    expect(data.categoriesWithIndicators[0].indicators[0].name).toBe('Visible dust')
  })

  it('skips the tables without rows', async () => {
    const { result } = await renderLoaded(NO_ROWS)
    await act(() => result.current.exportWorkbook())

    expect(sempService.getManagementActivities).not.toHaveBeenCalled()
    expect(sempService.getMitigationPlans).not.toHaveBeenCalled()
    expect(monitoringService.getByProject).not.toHaveBeenCalled()
    expect(exportProjectWorkbook.mock.calls[0][0].management).toEqual([])
  })

  it('returns the error message when a load fails', async () => {
    screeningService.getByProject.mockRejectedValue(new Error('Network Error'))
    const { result } = await renderLoaded(NO_ROWS)

    let outcome
    await act(async () => {
      outcome = await result.current.exportWorkbook()
    })

    expect(outcome.success).toBe(false)
    expect(outcome.error).toBeTruthy()
    expect(exportProjectWorkbook).not.toHaveBeenCalled()
    expect(result.current.isExporting).toBe(false)
  })
})
