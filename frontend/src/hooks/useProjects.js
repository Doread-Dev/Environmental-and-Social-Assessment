/**
 * useProjects Hook
 * The project list (D31): each project comes with its screening/assessment summary, `workflow`
 * state and `allowed_actions` from the backend, in one request.
 */
import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectService } from '@/services/projectService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'

const NO_PROJECTS = []

/**
 * Custom hook for the project list
 * @returns {Object} Projects state and methods
 */
export function useProjects() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: queryKeys.projects, queryFn: projectService.getAll })

  const deleteMutation = useMutation({
    mutationFn: (id) => projectService.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.workspace(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      return queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })

  /**
   * Delete a project
   * @param {string} id - Project ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const { mutateAsync: deleteAsync } = deleteMutation
  const deleteProject = useCallback(
    async (id) => {
      try {
        await deleteAsync(id)
        return { success: true }
      } catch (err) {
        return { success: false, error: extractErrorMessage(err) }
      }
    },
    [deleteAsync]
  )

  return {
    projects: query.data ?? NO_PROJECTS,
    isLoading: query.isPending,
    error: query.error ? extractErrorMessage(query.error) : null,
    fetchProjects: query.refetch,
    deleteProject,
    deletingId: deleteMutation.isPending ? deleteMutation.variables : null,
  }
}

export default useProjects
