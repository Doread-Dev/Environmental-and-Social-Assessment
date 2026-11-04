import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import api from '@/services/api'
import { useWorkspace } from './useWorkspace'
import { useDashboard } from './useDashboard'
import { useProjects } from './useProjects'
import { useLookups, useUsers } from './useLookups'
import { fail, mockGet, ok, withQueryClient, workspaceFixture } from '@/test/utils'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), delete: vi.fn() },
}))

async function renderLoaded(useHook) {
  const { wrapper, queryClient } = withQueryClient()
  const hook = renderHook(useHook, { wrapper })
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return { ...hook, queryClient }
}

beforeEach(() => vi.clearAllMocks())

describe('useWorkspace', () => {
  it('exposes project, workflow and the allowed actions as can()', async () => {
    mockGet(api, {
      '/projects/p1/workspace': workspaceFixture({ allowed_actions: ['screening.create'] }),
    })
    const { result } = await renderLoaded(() => useWorkspace('p1'))

    expect(result.current.project.title).toBe('Water network')
    expect(result.current.workflow.next_action.route).toBe('SCREENING')
    expect(result.current.can('screening.create')).toBe(true)
    expect(result.current.can('screening.approve')).toBe(false)
  })

  it('returns the backend message on error (no retry on 404)', async () => {
    api.get.mockImplementation(() => fail(404, 'Project not found'))
    const { result } = await renderLoaded(() => useWorkspace('p1'))

    expect(result.current.error).toBe('Project not found')
    expect(result.current.can('export')).toBe(false)
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('no project id: nothing to load', () => {
    const { wrapper } = withQueryClient()
    const { result } = renderHook(() => useWorkspace(undefined), { wrapper })

    expect(result.current.isLoading).toBe(false)
    expect(api.get).not.toHaveBeenCalled()
  })
})

describe('useDashboard', () => {
  it('loading, then stats and latest projects', async () => {
    mockGet(api, {
      '/dashboard': { stats: { total_projects: 1 }, latest_projects: [{ _id: 'p1' }] },
    })
    const { wrapper } = withQueryClient()
    const { result } = renderHook(() => useDashboard(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.stats.total_projects).toBe(1)
    expect(result.current.latestProjects).toEqual([{ _id: 'p1' }])
  })

  it('error', async () => {
    api.get.mockImplementation(() => fail(500, 'Server Error'))
    const { result } = await renderLoaded(() => useDashboard())

    await waitFor(() => expect(result.current.error).toBe('Server Error'))
    expect(result.current.latestProjects).toEqual([])
  })
})

describe('useProjects', () => {
  it('deleteProject refreshes the list and dashboard and drops the workspace', async () => {
    mockGet(api, { '/projects': [{ _id: 'p1' }] })
    api.delete.mockImplementation(() => ok(null))
    const { result, queryClient } = await renderLoaded(() => useProjects())
    queryClient.setQueryData(['workspace', 'p1'], {})
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    let outcome
    await act(async () => {
      outcome = await result.current.deleteProject('p1')
    })

    expect(outcome).toEqual({ success: true })
    expect(api.delete).toHaveBeenCalledWith('/projects/p1')
    expect(queryClient.getQueryData(['workspace', 'p1'])).toBeUndefined()
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['projects'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
  })

  it('deleteProject returns the backend message (409: approved work, archive instead)', async () => {
    mockGet(api, { '/projects': [] })
    api.delete.mockImplementation(() => fail(409, 'Archive it instead'))
    const { result } = await renderLoaded(() => useProjects())

    let outcome
    await act(async () => {
      outcome = await result.current.deleteProject('p1')
    })

    expect(outcome).toEqual({ success: false, error: 'Archive it instead' })
  })
})

describe('useLookups / useUsers', () => {
  it('loads all lookups in one request and groups questions by category, sorted by code', async () => {
    mockGet(api, {
      '/lookups': {
        impact_categories: [
          { _id: 'c2', code: 'B' },
          { _id: 'c1', code: 'A' },
        ],
        impact_questions: [
          { _id: 'q1', question_text: 'Dust?', category: { _id: 'c1' } },
          { _id: 'q2', question_text: 'Water?', category: 'c2' },
        ],
        indicators: [],
        job_titles: [{ _id: 'j1' }],
        place_groups: [
          { key: 'project_workflow', label: 'Project workflow' },
          { key: 'organization', label: 'Organization' },
        ],
        places: [
          { key: 'screening', label: 'Screening – Tool 1', group: 'project_workflow' },
          { key: 'ghg_emissions', label: 'GHG Emissions', group: 'organization', locked: true },
          { key: 'mitigation', label: 'Mitigation plan – Tool 4', group: 'project_workflow' },
        ],
      },
    })
    const { result } = await renderLoaded(() => useLookups())

    expect(api.get).toHaveBeenCalledTimes(1)
    expect(result.current.impactCategories.map((c) => c.code)).toEqual(['A', 'B'])
    expect(result.current.categoriesWithQuestions[0].questions).toEqual([
      expect.objectContaining({ _id: 'q1', question: 'Dust?', legacyId: 'A_q1' }),
    ])
    expect(result.current.jobTitles).toEqual([{ _id: 'j1' }])
    // Places registry (D64 a): grouped in registry order, labels by key
    expect(result.current.placesByGroup.map((g) => [g.label, g.places.map((p) => p.key)])).toEqual([
      ['Project workflow', ['screening', 'mitigation']],
      ['Organization', ['ghg_emissions']],
    ])
    expect(result.current.placeLabel('mitigation')).toBe('Mitigation plan – Tool 4')
    expect(result.current.placeLabel('unknown')).toBe('unknown')
  })

  it('active users only for the pickers', async () => {
    mockGet(api, {
      '/users': [
        { _id: 'u1', is_active: true },
        { _id: 'u2', is_active: false },
      ],
    })
    const { result } = await renderLoaded(() => useUsers())

    expect(result.current.users).toHaveLength(2)
    expect(result.current.activeUsers).toEqual([{ _id: 'u1', is_active: true }])
  })
})
