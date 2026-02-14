import { useState, useEffect, useCallback } from 'react'
import { screeningService } from '@/services'
import { extractErrorMessage } from '@/services/api'

/**
 * Hook لإدارة حالة الفرز
 * @param {string} projectId - معرف المشروع
 */
export function useScreening(projectId) {
  const [screening, setScreening] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const loadData = useCallback(() => {
    if (!projectId) return Promise.resolve()
    setIsLoading(true)
    setError(null)
    setScreening(null)
    return screeningService
      .getByProject(projectId)
      .then((data) => {
        setScreening(data)
      })
      .catch((err) => {
        setError(extractErrorMessage(err))
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [projectId])

  const refetch = useCallback(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!projectId) return
    let isMounted = true
    loadData()
      .then(() => {})
      .catch(() => {})
      .finally(() => {})
    return () => {
      isMounted = false
    }
  }, [projectId, loadData])

  // حفظ كمسودة
  const saveDraft = useCallback(async (data) => {
    setIsSaving(true)
    setError(null)
    try {
      const payload = {
        project: projectId,
        ...data,
        status: 'draft',
      }

      if (!screening?._id) {
        if (!payload.category_code || !payload.category_reason?.trim()) {
          const message = 'Please select a category and provide justification before saving.'
          setError(message)
          return { success: false, error: message }
        }
        const created = await screeningService.create(payload)
        setScreening(created)
        return { success: true, data: created }
      }

      const updated = await screeningService.update(screening._id, payload)
      setScreening(updated)
      return { success: true, data: updated }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [projectId, screening?._id])

  // إرسال للموافقة
  const submit = useCallback(async (data) => {
    setIsSaving(true)
    setError(null)
    try {
      const payload = {
        project: projectId,
        ...data,
        status: 'submitted',
      }

      if (!screening?._id) {
        const created = await screeningService.create(payload)
        setScreening(created)
        return { success: true, data: created }
      }

      const updated = await screeningService.update(screening._id, payload)
      setScreening(updated)
      return { success: true, data: updated }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [projectId, screening?._id])

  // الموافقة
  const approve = useCallback(async (recommendations) => {
    setIsSaving(true)
    setError(null)
    try {
      if (!screening?._id) {
        const message = 'Screening record not found.'
        setError(message)
        return { success: false, error: message }
      }
      const updated = await screeningService.approve(screening._id, recommendations)
      setScreening(updated)
      return { success: true, data: updated }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [screening?._id])

  // الرفض
  const reject = useCallback(async (rejectReason) => {
    setIsSaving(true)
    setError(null)
    try {
      if (!screening?._id) {
        const message = 'Screening record not found.'
        setError(message)
        return { success: false, error: message }
      }
      const updated = await screeningService.reject(
        screening._id,
        rejectReason === undefined ? '' : rejectReason
      )
      setScreening(updated)
      return { success: true, data: updated }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [screening?._id])

  return {
    screening,
    isLoading,
    isSaving,
    error,
    refetch,
    saveDraft,
    submit,
    approve,
    reject,
  }
}
