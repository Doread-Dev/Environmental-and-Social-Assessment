/**
 * useProjectSave Hook
 * Shared write path of the tool hooks (screening, assessment, SEMP, monitoring) and the project
 * edit: runs one request as a TanStack mutation, stores its result in the tool's query, then
 * refreshes the project's workflow state (workspace, project list, dashboard).
 *
 * Unhappy paths, handled here once for every tool (D61, D62, D73):
 * - a second call while one runs (double click) sends no second request: it gets the running
 *   call's result;
 * - a stale save (409 `STALE_VERSION`) opens the shared "Someone else changed this" dialog
 *   (Reload / Keep editing); the typed input stays;
 * - an expired session opens the sign-in dialog over the page (api.js + AuthProvider);
 * both answer `{ success: false, error, handled: true }`: the page shows no second message.
 * Every other failure answers `{ success: false, error }` with the `extractErrorMessage` text.
 */
import { useCallback, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { extractErrorMessage, isStaleVersionError } from '@/services/api'
import { invalidateProjectState } from '@/services/queryKeys'
import { useSaveConflict } from '@/contexts/useSaveConflict'

/**
 * @param {string} projectId - Project ID
 * @param {Array} [toolQueryKey] - The tool's query, refetched by the stale-save dialog's Reload
 * @returns {{ save: Function, fail: Function, isSaving: boolean, error: string|null,
 *   setError: Function, queryClient: import('@tanstack/react-query').QueryClient }}
 */
export function useProjectSave(projectId, toolQueryKey) {
  const queryClient = useQueryClient()
  const { showConflict } = useSaveConflict()
  const [error, setError] = useState(null)
  const running = useRef(null)
  // A new array each render: read at failure time, so `save` keeps its identity
  const toolKey = useRef(toolQueryKey)
  toolKey.current = toolQueryKey
  const { mutateAsync, isPending } = useMutation({ mutationFn: (request) => request() })

  /**
   * @param {() => Promise<any>} request - The API call(s)
   * @param {(data: any) => void} [onSaved] - Put the result into the tool's query cache
   * @returns {Promise<{success: true, data: any} | {success: false, error: string,
   *   handled?: boolean}>}
   */
  const save = useCallback(
    (request, onSaved) => {
      // A double click (or a second action while one runs) sends one request.
      if (running.current) return running.current
      const run = (async () => {
        setError(null)
        try {
          const data = await mutateAsync(request)
          onSaved?.(data)
          await invalidateProjectState(queryClient, projectId)
          return { success: true, data }
        } catch (err) {
          const message = extractErrorMessage(err)
          if (isStaleVersionError(err) && showConflict) {
            showConflict({ projectId, queryKeys: [toolKey.current] })
            return { success: false, error: message, handled: true }
          }
          if (err?.sessionExpired) return { success: false, error: message, handled: true }
          setError(message)
          return { success: false, error: message }
        } finally {
          running.current = null
        }
      })()
      running.current = run
      return run
    },
    [mutateAsync, queryClient, projectId, showConflict]
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
