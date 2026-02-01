/**
 * useSemp Hook
 * إدارة حالة SEMP (أنشطة الإدارة وخطط التخفيف)
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getManagementActivitiesByProjectId,
  getMitigationPlansByProjectId,
  createEmptyManagementActivity,
  createEmptyMitigationPlan
} from '@/data'

/**
 * Hook لإدارة حالة SEMP
 * @param {string} projectId - معرف المشروع
 */
export function useSemp(projectId) {
  const [managementActivities, setManagementActivities] = useState([])
  const [mitigationPlans, setMitigationPlans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // تحميل البيانات
  useEffect(() => {
    if (!projectId) return

    setIsLoading(true)
    setError(null)

    // Simulate API call
    setTimeout(() => {
      setManagementActivities(getManagementActivitiesByProjectId(projectId))
      setMitigationPlans(getMitigationPlansByProjectId(projectId))
      setIsLoading(false)
    }, 300)
  }, [projectId])

  // ==========================================
  // Management Activities (Tool 3)
  // ==========================================

  /**
   * إضافة صف جديد لأنشطة الإدارة
   */
  const addManagementActivity = useCallback(() => {
    const newRow = createEmptyManagementActivity(projectId)
    setManagementActivities(prev => [...prev, newRow])
    return newRow
  }, [projectId])

  /**
   * تحديث صف في أنشطة الإدارة
   * @param {string} rowId - معرف الصف
   * @param {string} field - اسم الحقل
   * @param {any} value - القيمة الجديدة
   */
  const updateManagementActivity = useCallback((rowId, field, value) => {
    setManagementActivities(prev =>
      prev.map(row =>
        row._id === rowId
          ? { ...row, [field]: value, updatedAt: new Date().toISOString() }
          : row
      )
    )
  }, [])

  /**
   * حذف صف من أنشطة الإدارة
   * @param {string} rowId - معرف الصف
   */
  const deleteManagementActivity = useCallback((rowId) => {
    setManagementActivities(prev => {
      const filtered = prev.filter(row => row._id !== rowId)
      // إعادة ترقيم الصفوف
      return filtered.map((row, index) => ({
        ...row,
        serial_number: index + 1
      }))
    })
  }, [])

  /**
   * حفظ جميع أنشطة الإدارة
   */
  const saveManagementActivities = useCallback(async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      // في الواقع، سيتم إرسال البيانات للـ API
      console.log('Saving management activities:', managementActivities)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [managementActivities])

  // ==========================================
  // Mitigation Plans (Tool 4)
  // ==========================================

  /**
   * إضافة صف جديد لخطط التخفيف
   */
  const addMitigationPlan = useCallback(() => {
    const newRow = createEmptyMitigationPlan(projectId)
    setMitigationPlans(prev => [...prev, newRow])
    return newRow
  }, [projectId])

  /**
   * تحديث صف في خطط التخفيف
   * @param {string} rowId - معرف الصف
   * @param {string} field - اسم الحقل
   * @param {any} value - القيمة الجديدة
   */
  const updateMitigationPlan = useCallback((rowId, field, value) => {
    setMitigationPlans(prev =>
      prev.map(row =>
        row._id === rowId
          ? { ...row, [field]: value, updatedAt: new Date().toISOString() }
          : row
      )
    )
  }, [])

  /**
   * حذف صف من خطط التخفيف
   * @param {string} rowId - معرف الصف
   */
  const deleteMitigationPlan = useCallback((rowId) => {
    setMitigationPlans(prev => {
      const filtered = prev.filter(row => row._id !== rowId)
      return filtered.map((row, index) => ({
        ...row,
        serial_number: index + 1
      }))
    })
  }, [])

  /**
   * حفظ جميع خطط التخفيف
   */
  const saveMitigationPlans = useCallback(async () => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('Saving mitigation plans:', mitigationPlans)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [mitigationPlans])

  // ==========================================
  // حساب حالة SEMP
  // ==========================================

  /**
   * الحصول على حالة Tool 3 (Management Activities)
   */
  const getTool3Status = useCallback(() => {
    if (managementActivities.length === 0) return 'not_started'
    const hasEmptyRows = managementActivities.some(
      row => !row.activity_description?.trim()
    )
    if (hasEmptyRows) return 'in_progress'
    return 'completed'
  }, [managementActivities])

  /**
   * الحصول على حالة Tool 4 (Mitigation Plans)
   */
  const getTool4Status = useCallback(() => {
    if (mitigationPlans.length === 0) return 'not_started'
    const hasEmptyRows = mitigationPlans.some(
      row => !row.output_description?.trim()
    )
    if (hasEmptyRows) return 'in_progress'
    return 'completed'
  }, [mitigationPlans])

  /**
   * الحصول على حالة SEMP الإجمالية
   */
  const getSempStatus = useCallback(() => {
    const tool3 = getTool3Status()
    const tool4 = getTool4Status()

    if (tool3 === 'not_started' && tool4 === 'not_started') return 'pending'
    if (tool3 === 'completed' && tool4 === 'completed') return 'completed'
    return 'in_progress'
  }, [getTool3Status, getTool4Status])

  return {
    // Data
    managementActivities,
    mitigationPlans,
    isLoading,
    isSaving,
    error,

    // Management Activities Actions
    addManagementActivity,
    updateManagementActivity,
    deleteManagementActivity,
    saveManagementActivities,

    // Mitigation Plans Actions
    addMitigationPlan,
    updateMitigationPlan,
    deleteMitigationPlan,
    saveMitigationPlans,

    // Status
    getTool3Status,
    getTool4Status,
    getSempStatus
  }
}
