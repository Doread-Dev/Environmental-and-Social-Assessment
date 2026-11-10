/**
 * useProjects Hook
 * The project list (D31): each project comes with its screening/assessment summary, `workflow`
 * state and `allowed_actions` from the backend, in one request. `{ archived: true }` lists the
 * archived projects instead (D17). Delete, archive, restore and purge (admin, D60) refresh both
 * lists, the dashboard and the project's workspace.
 */
import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectService } from '@/services/projectService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'

const NO_PROJECTS = []

/** Wrap a mutation as `(id) => Promise<{ success, error? }>` */
function useProjectAction(mutationFn, { removeWorkspace = false } = {}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn,
    onSuccess: (_data, id) => {
      if (removeWorkspace) queryClient.removeQueries({ queryKey: queryKeys.workspace(id) })
      else queryClient.invalidateQueries({ queryKey: queryKeys.workspace(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      return queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
  const { mutateAsync } = mutation
  const run = useCallback(
    async (id) => {
      try {
        await mutateAsync(id)
        return { success: true }
      } catch (err) {
        return { success: false, error: extractErrorMessage(err) }
      }
    },
    [mutateAsync]
  )
  return [run, mutation.isPending ? mutation.variables : null]
}

/**
 * Custom hook for the project list
 * @param {Object} [options]
 * @param {boolean} [options.archived] - List the archived projects (D17)
 * @returns {Object} Projects state and methods
 */
export function useProjects({ archived = false } = {}) {
  const query = useQuery({
    queryKey: archived ? queryKeys.archivedProjects : queryKeys.projects,
    queryFn: archived ? projectService.getArchived : projectService.getAll,
  })

  const [deleteProject, deletingId] = useProjectAction((id) => projectService.delete(id), {
    removeWorkspace: true,
  })
  const [purgeProject, purgingId] = useProjectAction((id) => projectService.purge(id), {
    removeWorkspace: true,
  })
  const [archiveProject, archivingId] = useProjectAction((id) => projectService.archive(id))
  const [restoreProject, restoringId] = useProjectAction((id) => projectService.restore(id))

  return {
    projects: query.data ?? NO_PROJECTS,
    isLoading: query.isPending,
    error: query.error ? extractErrorMessage(query.error) : null,
    fetchProjects: query.refetch,
    deleteProject,
    deletingId,
    archiveProject,
    archivingId,
    restoreProject,
    restoringId,
    purgeProject,
    purgingId,
    /** Id of the project an action is running on, or null */
    busyId: deletingId || purgingId || archivingId || restoringId,
  }
}

export default useProjects
