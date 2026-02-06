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

  // تحميل بيانات الفرز
  useEffect(() => {
    if (!projectId) return

    setIsLoading(true)
    setError(null)

    let isMounted = true

    screeningService
      .getByProjectId(projectId)
      .then((data) => {
        if (!isMounted) return
        setScreening(data)
      })
      .catch((err) => {
        if (!isMounted) return
        if (err.response?.status === 404) {
          setScreening(null)
          return
        }
        setError(extractErrorMessage(err))
      })
      .finally(() => {
        if (!isMounted) return
      setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [projectId])

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
    saveDraft,
    submit,
    approve,
    reject,
  }
}
