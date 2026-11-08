/**
 * useScreening Hook
 * Tool 1 record of a project (query) and its writes (mutations). Each write refreshes the
 * project's workflow state through useProjectSave.
 *
 * Every write carries the version the page shows (D62): the screening's `updatedAt` in the cache
 * when the request starts. The form shows that cached record, and the tool queries are not
 * refetched behind an open form (no refetch on reconnect), so a change by someone else is caught
 * by the backend (409) instead of being overwritten.
 */
import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { screeningService } from '@/services'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'
import { useProjectSave } from './useProjectSave'

/**
 * The screening of a project and its actions
 * @param {string} projectId - Project id
 */
export function useScreening(projectId) {
  const query = useQuery({
    queryKey: queryKeys.screening(projectId),
    queryFn: () => screeningService.getByProject(projectId), // null = not started yet
    enabled: !!projectId,
    refetchOnReconnect: false,
  })
  const screening = query.data ?? null
  const screeningId = screening?._id
  const { save, fail, isSaving, error, queryClient } = useProjectSave(
    projectId,
    queryKeys.screening(projectId)
  )

  const store = useCallback(
    (data) => queryClient.setQueryData(queryKeys.screening(projectId), data),
    [queryClient, projectId]
  )
  // The version the page shows, read when the request starts (D62)
  const version = useCallback(
    () => queryClient.getQueryData(queryKeys.screening(projectId))?.updatedAt,
    [queryClient, projectId]
  )

  // Save as draft
  const saveDraft = useCallback(
    (data) => {
      // status is server-owned: a new screening starts as draft
      const payload = { project: projectId, ...data }
      if (!screeningId && (!payload.category_code || !payload.category_reason?.trim())) {
        return Promise.resolve(
          fail('Please select a category and provide justification before saving.')
        )
      }
      return save(
        () =>
          screeningId
            ? screeningService.update(screeningId, { ...payload, version: version() })
            : screeningService.create(payload),
        store
      )
    },
    [projectId, screeningId, save, fail, store, version]
  )

  // Submit for approval: save the form first, then move it to submitted through the transition
  const submit = useCallback(
    (data) => {
      const payload = { project: projectId, ...data }
      return save(async () => {
        const saved = screeningId
          ? await screeningService.update(screeningId, { ...payload, version: version() })
          : await screeningService.create(payload)
        store(saved)
        return screeningService.submit(saved._id, saved.updatedAt)
      }, store)
    },
    [projectId, screeningId, save, store, version]
  )

  // Approve
  const approve = useCallback(
    (recommendations) => {
      if (!screeningId) return Promise.resolve(fail('Screening record not found.'))
      return save(() => screeningService.approve(screeningId, recommendations), store)
    },
    [screeningId, save, fail, store]
  )

  // Reject
  const reject = useCallback(
    (rejectReason) => {
      if (!screeningId) return Promise.resolve(fail('Screening record not found.'))
      return save(
        () => screeningService.reject(screeningId, rejectReason === undefined ? '' : rejectReason),
        store
      )
    },
    [screeningId, save, fail, store]
  )

  return {
    screening,
    isLoading: !!projectId && query.isPending,
    isSaving,
    error: error ?? (query.error ? extractErrorMessage(query.error) : null),
    // The screening could not be read at all (not a failed save, not a failed background refresh)
    loadError: query.error && query.data === undefined ? extractErrorMessage(query.error) : null,
    refetch: query.refetch,
    saveDraft,
    submit,
    approve,
    reject,
  }
}
