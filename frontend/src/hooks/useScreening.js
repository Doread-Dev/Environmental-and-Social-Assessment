/**
 * useScreening Hook
 * Tool 1 record of a project (query) and its writes (mutations). Each write refreshes the
 * project's workflow state through useProjectSave.
 */
import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { screeningService } from '@/services'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'
import { useProjectSave } from './useProjectSave'

/**
 * Hook لإدارة حالة الفرز
 * @param {string} projectId - معرف المشروع
 */
export function useScreening(projectId) {
  const query = useQuery({
    queryKey: queryKeys.screening(projectId),
    queryFn: () => screeningService.getByProject(projectId), // null = not started yet
    enabled: !!projectId,
  })
  const screening = query.data ?? null
  const screeningId = screening?._id
  const { save, fail, isSaving, error, queryClient } = useProjectSave(projectId)

  const store = useCallback(
    (data) => queryClient.setQueryData(queryKeys.screening(projectId), data),
    [queryClient, projectId]
  )

  // حفظ كمسودة
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
            ? screeningService.update(screeningId, payload)
            : screeningService.create(payload),
        store
      )
    },
    [projectId, screeningId, save, fail, store]
  )

  // إرسال للموافقة: save the form first, then move it to submitted through the transition
  const submit = useCallback(
    (data) => {
      const payload = { project: projectId, ...data }
      return save(async () => {
        const saved = screeningId
          ? await screeningService.update(screeningId, payload)
          : await screeningService.create(payload)
        store(saved)
        return screeningService.submit(saved._id)
      }, store)
    },
    [projectId, screeningId, save, store]
  )

  // الموافقة
  const approve = useCallback(
    (recommendations) => {
      if (!screeningId) return Promise.resolve(fail('Screening record not found.'))
      return save(() => screeningService.approve(screeningId, recommendations), store)
    },
    [screeningId, save, fail, store]
  )

  // الرفض
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
    refetch: query.refetch,
    saveDraft,
    submit,
    approve,
    reject,
  }
}
