import { useState, useEffect, useCallback } from 'react'
import { getScreeningByProjectId, createEmptyScreening } from '@/data'

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

    // Simulate API call
    setTimeout(() => {
      const existingScreening = getScreeningByProjectId(projectId)
      setScreening(existingScreening || createEmptyScreening(projectId))
      setIsLoading(false)
    }, 300)
  }, [projectId])

  // حفظ كمسودة
  const saveDraft = useCallback(
    async (data) => {
      setIsSaving(true)
      setError(null)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))
        setScreening((prev) => ({
          ...prev,
          ...data,
          status: 'draft',
          updatedAt: new Date().toISOString(),
        }))
        return { success: true }
      } catch (err) {
        const errorMessage = err.message || 'Failed to save draft'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsSaving(false)
      }
    },
    []
  )

  // إرسال للموافقة
  const submit = useCallback(
    async (data) => {
      setIsSaving(true)
      setError(null)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))
        setScreening((prev) => ({
          ...prev,
          ...data,
          status: 'submitted',
          screening_date: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
        return { success: true }
      } catch (err) {
        const errorMessage = err.message || 'Failed to submit screening'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsSaving(false)
      }
    },
    []
  )

  // الموافقة
  const approve = useCallback(
    async (recommendations) => {
      setIsSaving(true)
      setError(null)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))
        setScreening((prev) => ({
          ...prev,
          status: 'approved',
          recommendations,
          approved_by: 'current_user_id', // سيتم استبداله بـ AuthContext
          updatedAt: new Date().toISOString(),
        }))
        return { success: true }
      } catch (err) {
        const errorMessage = err.message || 'Failed to approve screening'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsSaving(false)
      }
    },
    []
  )

  // الرفض
  const reject = useCallback(
    async (rejectReason) => {
      setIsSaving(true)
      setError(null)
      try {
        // Simulate API call
        // في الواقع، سيتم إرسال: { reject_reason: rejectReason }
        // والباك اند سيحفظ reject_by تلقائياً من req.user._id
        await new Promise((resolve) => setTimeout(resolve, 500))
        setScreening((prev) => ({
          ...prev,
          status: 'rejected',
          reject_reason: rejectReason || null,
          reject_by: 'current_user_id', // سيتم استبداله بـ AuthContext
          updatedAt: new Date().toISOString(),
        }))
        return { success: true }
      } catch (err) {
        const errorMessage = err.message || 'Failed to reject screening'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsSaving(false)
      }
    },
    []
  )

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
