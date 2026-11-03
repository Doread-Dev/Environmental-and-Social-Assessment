import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useWorkflow } from './useWorkflow'
import { assessmentService, monitoringService, screeningService, sempService } from '@/services'
import { notifyWorkflowChanged } from '@/utils/workflowEvents'

vi.mock('@/services', () => ({
  screeningService: { getByProject: vi.fn() },
  assessmentService: { getByProject: vi.fn() },
  sempService: { getManagementActivities: vi.fn(), getMitigationPlans: vi.fn() },
  monitoringService: { getByProject: vi.fn() },
}))

function mockProject({ screening = null, assessment = null, activities = [], plans = [] } = {}) {
  screeningService.getByProject.mockResolvedValue(screening)
  assessmentService.getByProject.mockResolvedValue(assessment)
  sempService.getManagementActivities.mockResolvedValue(activities)
  sempService.getMitigationPlans.mockResolvedValue(plans)
  monitoringService.getByProject.mockResolvedValue([])
}

async function renderLoaded(projectId = 'p1') {
  const hook = renderHook(() => useWorkflow(projectId))
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return hook
}

describe('useWorkflow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('derives the workflow from all five tools', async () => {
    mockProject({ screening: { _id: 's1', status: 'approved' } })

    const { result } = await renderLoaded()

    expect(result.current.workflow.screening.status).toBe('approved')
    expect(result.current.workflow.assessment.locked).toBeUndefined()
    expect(result.current.workflow.semp.locked).toBe(true)
  })

  it('unlocks the next tool after a change on another page, without a reload', async () => {
    mockProject({ screening: { _id: 's1', status: 'submitted' } })
    const { result } = await renderLoaded()
    expect(result.current.workflow.assessment.locked).toBe(true)

    // The screening summary page approves the screening.
    mockProject({ screening: { _id: 's1', status: 'approved' } })
    act(() => notifyWorkflowChanged('p1'))

    await waitFor(() => expect(result.current.workflow.assessment.locked).toBeUndefined())
  })

  it('refetches silently: isLoading stays false, so the layout keeps the page mounted', async () => {
    mockProject()
    const { result } = await renderLoaded()
    const loadingStates = []
    screeningService.getByProject.mockImplementation(async () => {
      loadingStates.push(result.current.isLoading)
      return { _id: 's1', status: 'draft' }
    })

    act(() => notifyWorkflowChanged('p1'))

    await waitFor(() => expect(result.current.screening?.status).toBe('draft'))
    expect(loadingStates).toEqual([false])
    expect(result.current.isLoading).toBe(false)
  })

  it('completes SEMP and unlocks monitoring once Tools 3 and 4 are saved', async () => {
    const approved = { _id: 'x', status: 'approved' }
    mockProject({ screening: approved, assessment: approved })
    const { result } = await renderLoaded()
    expect(result.current.workflow.monitoring.locked).toBe(true)

    mockProject({
      screening: approved,
      assessment: approved,
      activities: [{ activity_description: 'Dig' }],
      plans: [{ output_description: 'Network' }],
    })
    act(() => notifyWorkflowChanged('p1'))

    await waitFor(() => expect(result.current.workflow.semp.status).toBe('completed'))
    expect(result.current.workflow.monitoring.locked).toBeUndefined()
  })

  it('ignores changes to another project', async () => {
    mockProject()
    await renderLoaded()
    expect(screeningService.getByProject).toHaveBeenCalledTimes(1)

    act(() => notifyWorkflowChanged('other'))

    expect(screeningService.getByProject).toHaveBeenCalledTimes(1)
  })

  it('treats a failed request as nothing there yet', async () => {
    mockProject({ screening: { _id: 's1', status: 'approved' } })
    assessmentService.getByProject.mockRejectedValue(new Error('network'))

    const { result } = await renderLoaded()

    expect(result.current.assessment).toBeNull()
    expect(result.current.workflow.screening.status).toBe('approved')
  })
})
