/**
 * useWorkspace Hook
 * Everything the project workspace needs, from one request (D31): project, workflow state
 * (computed by the backend, D30), allowed actions (D35), screening/assessment summaries and row
 * counts. Layout, sidebar, route guards and pages share the cached query (D33).
 */
import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { projectService } from '@/services/projectService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'

const NO_ACTIONS = []

/**
 * @param {string} projectId - Project ID
 */
export function useWorkspace(projectId) {
  const query = useQuery({
    queryKey: queryKeys.workspace(projectId),
    queryFn: () => projectService.getWorkspace(projectId),
    enabled: !!projectId,
  })
  const data = query.data
  const allowedActions = data?.allowed_actions ?? NO_ACTIONS

  /**
   * May the user do this on the project now? e.g. 'screening.approve', 'semp.edit', 'export'
   * @param {string} action
   * @returns {boolean}
   */
  const can = useCallback((action) => allowedActions.includes(action), [allowedActions])

  return {
    project: data?.project ?? null,
    workflow: data?.workflow ?? null,
    screening: data?.screening ?? null,
    assessment: data?.assessment ?? null,
    counts: data?.counts ?? null,
    allowedActions,
    can,
    isLoading: !!projectId && query.isPending,
    error: query.error ? extractErrorMessage(query.error) : null,
    refetch: query.refetch,
  }
}

export default useWorkspace
