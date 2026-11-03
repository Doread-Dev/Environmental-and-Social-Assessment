/**
 * useProjectSave Hook
 * Shared write path of the tool hooks (screening, assessment, SEMP, monitoring): runs one
 * request as a TanStack mutation, stores its result in the tool's query, then refreshes the
 * project's workflow state (workspace, project list, dashboard). Replaces the old window events.
 */
import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { extractErrorMessage } from '@/services/api'
import { invalidateProjectState } from '@/services/queryKeys'

/**
 * @param {string} projectId - Project ID
 * @returns {{ save: Function, isSaving: boolean, error: string|null, setError: Function }}
 */
export function useProjectSave(projectId) {
  const queryClient = useQueryClient()
  const [error, setError] = useState(null)
  const { mutateAsync, isPending } = useMutation({ mutationFn: (request) => request() })

  /**
   * @param {() => Promise<any>} request - The API call(s)
   * @param {(data: any) => void} [onSaved] - Put the result into the tool's query cache
   * @returns {Promise<{success: true, data: any} | {success: false, error: string}>}
   */
  const save = useCallback(
    async (request, onSaved) => {
      setError(null)
      try {
        const data = await mutateAsync(request)
        onSaved?.(data)
        await invalidateProjectState(queryClient, projectId)
        return { success: true, data }
      } catch (err) {
        const message = extractErrorMessage(err)
        setError(message)
        return { success: false, error: message }
      }
    },
    [mutateAsync, queryClient, projectId]
  )

  /**
   * Fail without a request (client-side check), shown like a server error
   * @param {string} message
   */
  const fail = useCallback((message) => {
    setError(message)
    return { success: false, error: message }
  }, [])

  return { save, fail, isSaving: isPending, error, setError, queryClient }
}

export default useProjectSave
