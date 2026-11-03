/**
 * useDashboard Hook
 * Dashboard stats and latest projects from one request (D31)
 */
import { useQuery } from '@tanstack/react-query'
import { projectService } from '@/services/projectService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'

const NO_PROJECTS = []

export function useDashboard() {
  const query = useQuery({ queryKey: queryKeys.dashboard, queryFn: projectService.getDashboard })

  return {
    stats: query.data?.stats ?? null,
    latestProjects: query.data?.latest_projects ?? NO_PROJECTS,
    isLoading: query.isPending,
    error: query.error ? extractErrorMessage(query.error) : null,
    refetch: query.refetch,
  }
}

export default useDashboard
