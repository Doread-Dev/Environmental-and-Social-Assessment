/**
 * useSemp Hook
 * Manages SEMP state (Management Activities + Mitigation Plans)
 */

import { useState, useEffect, useCallback } from 'react'
import { sempService } from '@/services/sempService'
import { extractErrorMessage } from '@/services/api'

/**
 * Normalize data payload for API requests
 * Converts populated objects to ID strings
 * @param {Object} row - Data row
 * @returns {Object} Normalized payload
 */
function normalizePayload(row) {
  const payload = { ...row }

  // Normalize project to ID string
  if (payload.project && typeof payload.project === 'object') {
    payload.project = payload.project._id || payload.project_id || payload.project
  }

  // Normalize responsible to ID string
  if (payload.responsible && typeof payload.responsible === 'object') {
    payload.responsible = payload.responsible._id || payload.responsible
  }

  return payload
}

/**
 * Normalize API response data for frontend use
 * Converts populated objects to ID strings
 * @param {Array} items - Array of items from API
 * @returns {Array} Normalized items
 */
function normalizeApiResponse(items) {
  return items.map((item) => ({
    ...item,
    project:
      item.project && typeof item.project === 'object'
        ? item.project._id || item.project_id || item.project
        : item.project,
    responsible:
      item.responsible && typeof item.responsible === 'object'
        ? item.responsible._id
        : item.responsible,
  }))
}

/**
 * Hook for managing SEMP state
 * @param {string} projectId - Project ID
 */
export function useSemp(projectId) {
  const [managementActivities, setManagementActivities] = useState([])
  const [mitigationPlans, setMitigationPlans] = useState([])
  const [managementDeletedIds, setManagementDeletedIds] = useState([])
  const [mitigationDeletedIds, setMitigationDeletedIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load data from API
  useEffect(() => {
    if (!projectId) return

    let cancelled = false

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch both in parallel
        const [activities, plans] = await Promise.all([
          sempService.getManagementActivities(projectId),
          sempService.getMitigationPlans(projectId),
        ])

        if (!cancelled) {
          // Normalize API responses for frontend use
          setManagementActivities(normalizeApiResponse(activities))
          setMitigationPlans(normalizeApiResponse(plans))
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = extractErrorMessage(err)
          setError(errorMessage)
          console.error('Failed to load SEMP data:', errorMessage)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [projectId])

  // ==========================================
  // Management Activities (Tool 3)
  // ==========================================

  /**
   * Add a new management activity row (local only)
   * لا يتم الإرسال للباك حتى يتم الضغط على زر الحفظ
   */
  const addManagementActivity = useCallback(() => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const newRow = {
      _id: tempId,
      _isNew: true,
      project: projectId,
      serial_number: managementActivities.length + 1,
      activity_description: '',
    }
    setManagementActivities((prev) => [...prev, newRow])
    return newRow
  }, [projectId, managementActivities.length])

  /**
   * Update a management activity field
   * Updates local state immediately, API call on save
   * @param {string} rowId - Activity ID
   * @param {string} field - Field name
   * @param {any} value - New value
   */
  const updateManagementActivity = useCallback((rowId, field, value) => {
    setManagementActivities((prev) =>
      prev.map((row) =>
        row._id === rowId
          ? { ...row, [field]: value, _dirty: true, updatedAt: new Date().toISOString() }
          : row
      )
    )
  }, [])

  /**
   * Delete a management activity (local delete, deferred API)
   * @param {string} rowId - Activity ID
   */
  const deleteManagementActivity = useCallback((rowId) => {
    setManagementActivities((prev) => {
      const target = prev.find((row) => row._id === rowId)

      // إذا كان الصف موجوداً مسبقاً في الباك، نضيفه لقائمة المحذوفين
      if (target && !target._isNew) {
        setManagementDeletedIds((ids) =>
          ids.includes(rowId) ? ids : [...ids, rowId]
        )
      }

      const filtered = prev.filter((row) => row._id !== rowId)
      // إعادة ترقيم الصفوف ووضع علامة dirty للصفوف المعدلة
      return filtered.map((row, index) => {
        const newSerialNumber = index + 1
        // إذا تغير serial_number، نضع علامة dirty
        if (row.serial_number !== newSerialNumber && !row._isNew) {
          return { ...row, serial_number: newSerialNumber, _dirty: true }
        }
        return { ...row, serial_number: newSerialNumber }
      })
    })
  }, [])

  /**
   * Save all management activities changes to API
   * - ينشئ الصفوف الجديدة
   * - يحدّث الصفوف المعدَّلة
   * - يحذف الصفوف التي تم حذفها في الواجهة
   */
  const saveManagementActivities = useCallback(async () => {
    setIsSaving(true)
    setError(null)
    try {
      const newRows = managementActivities.filter((row) => row._isNew)
      const dirtyRows = managementActivities.filter((row) => row._dirty && !row._isNew)

      // Execute delete operations in parallel
      const deletePromises = managementDeletedIds.map((id) =>
        sempService.deleteManagementActivity(id).catch((err) => {
          console.error(`Failed to delete activity ${id}:`, err)
          throw err
        })
      )

      // Execute create operations in parallel
      const createPromises = newRows.map((row) => {
        const { _isNew, _dirty, _id, ...rest } = row
        const payload = normalizePayload(rest)
        return sempService.createManagementActivity(payload).catch((err) => {
          console.error(`Failed to create activity:`, err)
          throw err
        })
      })

      // Execute update operations in parallel
      const updatePromises = dirtyRows.map((row) => {
        const { _dirty, ...rest } = row
        const payload = normalizePayload(rest)
        return sempService.updateManagementActivity(row._id, payload).catch((err) => {
          console.error(`Failed to update activity ${row._id}:`, err)
          throw err
        })
      })

      // Execute all operations in parallel
      await Promise.all([...deletePromises, ...createPromises, ...updatePromises])

      // إعادة تحميل البيانات من الـ API لضمان التزامن وإزالة الفلاگز
      const activities = await sempService.getManagementActivities(projectId)
      setManagementActivities(normalizeApiResponse(activities))
      setManagementDeletedIds([])

      return { success: true }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [managementActivities, managementDeletedIds, projectId])

  // ==========================================
  // Mitigation Plans (Tool 4)
  // ==========================================

  /**
   * Add a new mitigation plan row (local only)
   * لا يتم الإرسال للباك حتى يتم الضغط على زر الحفظ
   */
  const addMitigationPlan = useCallback(() => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const newRow = {
      _id: tempId,
      _isNew: true,
      project: projectId,
      serial_number: mitigationPlans.length + 1,
      output_description: '',
    }
    setMitigationPlans((prev) => [...prev, newRow])
    return newRow
  }, [projectId, mitigationPlans.length])

  /**
   * Update a mitigation plan field
   * Updates local state immediately, API call on save
   * @param {string} rowId - Plan ID
   * @param {string} field - Field name
   * @param {any} value - New value
   */
  const updateMitigationPlan = useCallback((rowId, field, value) => {
    setMitigationPlans((prev) =>
      prev.map((row) =>
        row._id === rowId
          ? { ...row, [field]: value, _dirty: true, updatedAt: new Date().toISOString() }
          : row
      )
    )
  }, [])

  /**
   * Delete a mitigation plan (local delete, deferred API)
   * @param {string} rowId - Plan ID
   */
  const deleteMitigationPlan = useCallback((rowId) => {
    setMitigationPlans((prev) => {
      const target = prev.find((row) => row._id === rowId)

      if (target && !target._isNew) {
        setMitigationDeletedIds((ids) =>
          ids.includes(rowId) ? ids : [...ids, rowId]
        )
      }

      const filtered = prev.filter((row) => row._id !== rowId)
      // إعادة ترقيم الصفوف ووضع علامة dirty للصفوف المعدلة
      return filtered.map((row, index) => {
        const newSerialNumber = index + 1
        // إذا تغير serial_number، نضع علامة dirty
        if (row.serial_number !== newSerialNumber && !row._isNew) {
          return { ...row, serial_number: newSerialNumber, _dirty: true }
        }
        return { ...row, serial_number: newSerialNumber }
      })
    })
  }, [])

  /**
   * Save all mitigation plans changes to API
   * - ينشئ الصفوف الجديدة
   * - يحدّث الصفوف المعدَّلة
   * - يحذف الصفوف التي تم حذفها في الواجهة
   */
  const saveMitigationPlans = useCallback(async () => {
    setIsSaving(true)
    setError(null)
    try {
      const newRows = mitigationPlans.filter((row) => row._isNew)
      const dirtyRows = mitigationPlans.filter((row) => row._dirty && !row._isNew)

      // Execute delete operations in parallel
      const deletePromises = mitigationDeletedIds.map((id) =>
        sempService.deleteMitigationPlan(id).catch((err) => {
          console.error(`Failed to delete plan ${id}:`, err)
          throw err
        })
      )

      // Execute create operations in parallel
      const createPromises = newRows.map((row) => {
        const { _isNew, _dirty, _id, ...rest } = row
        const payload = normalizePayload(rest)
        return sempService.createMitigationPlan(payload).catch((err) => {
          console.error(`Failed to create plan:`, err)
          throw err
        })
      })

      // Execute update operations in parallel
      const updatePromises = dirtyRows.map((row) => {
        const { _dirty, ...rest } = row
        const payload = normalizePayload(rest)
        return sempService.updateMitigationPlan(row._id, payload).catch((err) => {
          console.error(`Failed to update plan ${row._id}:`, err)
          throw err
        })
      })

      // Execute all operations in parallel
      await Promise.all([...deletePromises, ...createPromises, ...updatePromises])

      // إعادة تحميل البيانات من الـ API لضمان التزامن وإزالة الفلاگز
      const plans = await sempService.getMitigationPlans(projectId)
      setMitigationPlans(normalizeApiResponse(plans))
      setMitigationDeletedIds([])

      return { success: true }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [mitigationPlans, mitigationDeletedIds, projectId])

  // ==========================================
  // Status Calculations
  // ==========================================

  /**
   * Get Tool 3 (Management Activities) status
   */
  const getTool3Status = useCallback(() => {
    if (managementActivities.length === 0) return 'not_started'
    const hasEmptyRows = managementActivities.some((row) => !row.activity_description?.trim())
    if (hasEmptyRows) return 'in_progress'
    return 'completed'
  }, [managementActivities])

  /**
   * Get Tool 4 (Mitigation Plans) status
   */
  const getTool4Status = useCallback(() => {
    if (mitigationPlans.length === 0) return 'not_started'
    const hasEmptyRows = mitigationPlans.some((row) => !row.output_description?.trim())
    if (hasEmptyRows) return 'in_progress'
    return 'completed'
  }, [mitigationPlans])

  /**
   * Get overall SEMP status
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
    getSempStatus,
  }
}
