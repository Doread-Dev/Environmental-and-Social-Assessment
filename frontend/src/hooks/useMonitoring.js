/**
 * useMonitoring Hook
 * إدارة بيانات المراقبة السنوية (Tool 5)
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getMonitoringRecordsByProjectId, createEmptyMonitoringRecord } from '@/data'
import { useLookups } from '@/contexts'

/**
 * Hook لإدارة بيانات المراقبة
 */
export function useMonitoring(projectId) {
  const {
    impactCategories,
    categoriesWithIndicators,
    isLoading: lookupsLoading,
  } = useLookups()
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const recordMap = useMemo(() => {
    return new Map(records.map((record) => [record.indicator, record]))
  }, [records])

  /**
   * تحميل سجلات المراقبة للمشروع
   */
  useEffect(() => {
    const loadMonitoringData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // محاكاة API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        const projectRecords = getMonitoringRecordsByProjectId(projectId)
        setRecords(projectRecords)
      } catch (err) {
        setError('Failed to load monitoring data')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      loadMonitoringData()
    }
  }, [projectId])

  /**
   * تحديث قيمة ربع سنوية
   */
  const updateQuarterScore = useCallback(
    (recordId, quarter, value, indicatorId) => {
      setRecords((prev) => {
        const existing = prev.find((record) => record._id === recordId)
        if (existing) {
          return prev.map((record) => {
            if (record._id === recordId) {
              return {
                ...record,
                isNew: false,
                scores: {
                  ...record.scores,
                  [quarter]: value,
                },
              }
            }
            return record
          })
        }

        if (!indicatorId) {
          return prev
        }

        const newRecord = {
          ...createEmptyMonitoringRecord(projectId, indicatorId),
          _id: recordId,
          isNew: false,
          scores: {
            baseline: '',
            Q1: '',
            Q2: '',
            Q3: '',
            Q4: '',
            [quarter]: value,
          },
        }

        return [...prev, newRecord]
      })
    },
    [projectId]
  )

  /**
   * تحديث حقل في السجل
   */
  const updateRecordField = useCallback(
    (recordId, field, value, indicatorId) => {
      setRecords((prev) => {
        const existing = prev.find((record) => record._id === recordId)
        if (existing) {
          return prev.map((record) => {
            if (record._id === recordId) {
              return {
                ...record,
                isNew: false,
                [field]: value,
              }
            }
            return record
          })
        }

        if (!indicatorId) {
          return prev
        }

        const newRecord = {
          ...createEmptyMonitoringRecord(projectId, indicatorId),
          _id: recordId,
          isNew: false,
          [field]: value,
        }

        return [...prev, newRecord]
      })
    },
    [projectId]
  )

  /**
   * إضافة سجل جديد
   */
  const addRecord = useCallback(
    (indicatorId) => {
      const newRecord = createEmptyMonitoringRecord(projectId, indicatorId)
      setRecords((prev) => [...prev, newRecord])
      return newRecord
    },
    [projectId]
  )

  /**
   * حفظ جميع السجلات
   */
  const saveAllRecords = useCallback(async () => {
    try {
      setIsSaving(true)
      setError(null)

      // محاكاة API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // eslint-disable-next-line no-console
      console.info('Saved monitoring records:', records)

      return { success: true }
    } catch (err) {
      setError('Failed to save monitoring data')
      console.error(err)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [records])

  /**
   * الحصول على إحصائيات المراقبة لجميع الفئات
   */
  const getCategoryDataInternal = useCallback(
    (categoryCode) => {
      const category = categoriesWithIndicators.find(
        (cat) => cat.code === categoryCode || cat.id === categoryCode
      )
      const indicators = category?.indicators || []

      return indicators.map((indicator) => {
        const record = recordMap.get(indicator.id)
        return {
          indicator,
          record: record || createEmptyMonitoringRecord(projectId, indicator.id),
        }
      })
    },
    [categoriesWithIndicators, projectId, recordMap]
  )

  const getAllCategoryStats = useCallback(() => {
    const isRecordComplete = (record) => {
      if (!record || record.isNew) return false
      if (record.ranking && record.ranking !== 'not_applicable') return true
      return Boolean(
        record.scores?.baseline ||
        record.scores?.Q1 ||
        record.scores?.Q2 ||
        record.scores?.Q3 ||
        record.scores?.Q4 ||
        record.total ||
        record.final_assessment ||
        record.note
      )
    }

    return impactCategories.map((category) => {
      const data = getCategoryDataInternal(category.code)
      const completedCount = data.filter((d) => isRecordComplete(d.record)).length
      const totalCount = data.length

      return {
        ...category,
        stats: {
          completed: completedCount,
          total: totalCount,
          percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
          status:
            completedCount === 0
              ? 'Not Started'
              : completedCount === totalCount
                ? 'Complete'
                : 'In Progress',
        },
      }
    })
  }, [impactCategories, getCategoryDataInternal])

  /**
   * الحصول على بيانات فئة معينة مع السجلات
   */
  const getCategoryData = useCallback(
    (categoryCode) => getCategoryDataInternal(categoryCode),
    [getCategoryDataInternal]
  )

  return {
    records,
    isLoading: isLoading || lookupsLoading,
    isSaving,
    error,
    updateQuarterScore,
    updateRecordField,
    addRecord,
    saveAllRecords,
    getAllCategoryStats,
    getCategoryData,
  }
}
