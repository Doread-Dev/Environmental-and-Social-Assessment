/**
 * useMonitoring Hook
 * Manages monitoring data (Tool 5)
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { monitoringService } from '@/services/monitoringService'
import { extractErrorMessage } from '@/services/api'
import { useLookups } from '@/contexts'

/**
 * Hook for managing monitoring data
 * @param {string} projectId - Project ID
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

  // Build lookup map: indicator ID → record
  const recordMap = useMemo(() => {
    return new Map(records.map((record) => {
      // Handle both populated and non-populated indicator field
      const indicatorId = typeof record.indicator === 'object'
        ? record.indicator._id
        : record.indicator
      return [indicatorId, record]
    }))
  }, [records])

  /**
   * Load monitoring records from API
   */
  useEffect(() => {
    if (!projectId) return

    let cancelled = false

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await monitoringService.getByProject(projectId)
        if (!cancelled) {
          setRecords(data)
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = extractErrorMessage(err)
          setError(errorMessage)
          console.error('Failed to load monitoring data:', errorMessage)
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

  /**
   * Update a quarter score
   * Only updates local state - no API calls until Save button is clicked
   */
  const updateQuarterScore = useCallback(
    (recordId, quarter, value, indicatorId) => {
      setError(null)

      // Check if recordId is a placeholder (starts with "placeholder_")
      const isPlaceholder = typeof recordId === 'string' && recordId.startsWith('placeholder_')
      
      // If placeholder, extract indicatorId from recordId or use provided indicatorId
      const actualIndicatorId = isPlaceholder 
        ? (indicatorId || recordId.replace('placeholder_', ''))
        : null

      // Check if this is an existing record (not a placeholder)
      const existing = !isPlaceholder ? records.find((r) => r._id === recordId) : null

      if (existing) {
        // Update local state immediately
        setRecords((prev) =>
          prev.map((record) => {
            if (record._id === recordId) {
              return {
                ...record,
                scores: {
                  ...record.scores,
                  [quarter]: value,
                },
                _dirty: true,
              }
            }
            return record
          })
        )
      } else if (actualIndicatorId && projectId) {
        // No existing record - create local placeholder record (no API call)
        setRecords((prev) => {
          // Check if placeholder already exists
          const existingPlaceholder = prev.find(
            (r) => r._id === `placeholder_${actualIndicatorId}`
          )
          if (existingPlaceholder) {
            return prev.map((record) => {
              if (record._id === `placeholder_${actualIndicatorId}`) {
                return {
                  ...record,
                  scores: {
                    ...record.scores,
                    [quarter]: value,
                  },
                  _dirty: true,
                }
              }
              return record
            })
          }
          
          // Create new placeholder record
          return [
            ...prev,
            {
              _id: `placeholder_${actualIndicatorId}`,
              project: projectId,
              indicator: actualIndicatorId,
              scores: {
                baseline: '',
                Q1: '',
                Q2: '',
                Q3: '',
                Q4: '',
                [quarter]: value,
              },
              total: '',
              final_assessment: '',
              ranking: null,
              responsible: null,
              note: '',
              isNew: true,
              _dirty: true,
            },
          ]
        })
      }
    },
    [projectId, records]
  )

  /**
   * Update a field on a monitoring record
   * Only updates local state - no API calls until Save button is clicked
   */
  const updateRecordField = useCallback(
    (recordId, field, value, indicatorId) => {
      setError(null)

      // Check if recordId is a placeholder (starts with "placeholder_")
      const isPlaceholder = typeof recordId === 'string' && recordId.startsWith('placeholder_')
      
      // If placeholder, extract indicatorId from recordId or use provided indicatorId
      const actualIndicatorId = isPlaceholder 
        ? (indicatorId || recordId.replace('placeholder_', ''))
        : null

      // Check if this is an existing record (not a placeholder)
      const existing = !isPlaceholder ? records.find((r) => r._id === recordId) : null

      if (existing) {
        // Update local state
        setRecords((prev) =>
          prev.map((record) => {
            if (record._id === recordId) {
              return {
                ...record,
                [field]: value,
                _dirty: true,
              }
            }
            return record
          })
        )
      } else if (actualIndicatorId && projectId) {
        // No existing record - create local placeholder record (no API call)
        setRecords((prev) => {
          // Check if placeholder already exists
          const existingPlaceholder = prev.find(
            (r) => r._id === `placeholder_${actualIndicatorId}`
          )
          if (existingPlaceholder) {
            return prev.map((record) => {
              if (record._id === `placeholder_${actualIndicatorId}`) {
                return {
                  ...record,
                  [field]: value,
                  _dirty: true,
                }
              }
              return record
            })
          }
          
          // Create new placeholder record
          return [
            ...prev,
            {
              _id: `placeholder_${actualIndicatorId}`,
              project: projectId,
              indicator: actualIndicatorId,
              scores: { baseline: '', Q1: '', Q2: '', Q3: '', Q4: '' },
              total: '',
              final_assessment: '',
              ranking: null,
              responsible: null,
              note: '',
              [field]: value,
              isNew: true,
              _dirty: true,
            },
          ]
        })
      }
    },
    [projectId, records]
  )

  /**
   * Add a new record for an indicator (local only - no API call)
   */
  const addRecord = useCallback(
    (indicatorId) => {
      setError(null)
      const newRecord = {
        _id: `placeholder_${indicatorId}`,
        project: projectId,
        indicator: indicatorId,
        scores: { baseline: '', Q1: '', Q2: '', Q3: '', Q4: '' },
        total: '',
        final_assessment: '',
        ranking: null,
        responsible: null,
        note: '',
        isNew: true,
        _dirty: true,
      }
      setRecords((prev) => [...prev, newRecord])
      return newRecord
    },
    [projectId]
  )

  /**
   * Save all records to API
   * Only creates/updates records that have been modified (dirty or placeholders)
   * Uses lazy creation strategy - only creates records when data is entered
   */
  const saveAllRecords = useCallback(async () => {
    setIsSaving(true)
    setError(null)
    try {
      // Separate records into: placeholders (new), dirty (modified), and unchanged
      const placeholderRecords = records.filter((r) => r._id?.startsWith('placeholder_'))
      const dirtyRecords = records.filter(
        (r) => r._dirty && !r._id?.startsWith('placeholder_') && !r.isNew
      )

      // Create new records from placeholders
      const createPromises = placeholderRecords.map(async (record) => {
        const indicatorId =
          typeof record.indicator === 'object' ? record.indicator._id : record.indicator

        if (!indicatorId) {
          console.error('Cannot create monitoring record: missing indicator ID', record)
          return null
        }

        const payload = {
          project: projectId,
          indicator: indicatorId,
          scores: record.scores || { baseline: '', Q1: '', Q2: '', Q3: '', Q4: '' },
          total: record.total || '',
          final_assessment: record.final_assessment || '',
          ranking: record.ranking || 'not_applicable',
          responsible:
            record.responsible && typeof record.responsible === 'object'
              ? record.responsible._id
              : record.responsible && record.responsible !== null && record.responsible !== ''
                ? record.responsible
                : undefined,
          note: record.note || '',
        }

        return monitoringService.create(payload).catch((err) => {
          console.error(`Failed to create monitoring record for indicator ${indicatorId}:`, err)
          throw err
        })
      })

      // Update dirty records
      const updatePromises = dirtyRecords.map(async (record) => {
        const { _dirty, ...data } = record

        // Extract IDs from populated fields
        const recordProjectId =
          typeof data.project === 'object' ? data.project._id : data.project || projectId
        const recordIndicatorId =
          typeof data.indicator === 'object' ? data.indicator._id : data.indicator

        // Validate required fields
        if (!recordProjectId || !recordIndicatorId) {
          console.error('Cannot update monitoring record: missing project or indicator', {
            recordId: record._id,
            recordProjectId,
            recordIndicatorId,
            data,
          })
          return null
        }

        // Full update for all users (including EFP)
        const payload = {
          project: recordProjectId,
          indicator: recordIndicatorId,
          scores: data.scores || { baseline: '', Q1: '', Q2: '', Q3: '', Q4: '' },
          total: data.total || '',
          final_assessment: data.final_assessment || '',
          ranking: data.ranking || 'not_applicable',
          responsible:
            typeof data.responsible === 'object' && data.responsible !== null
              ? data.responsible._id
              : data.responsible &&
                  data.responsible !== null &&
                  data.responsible !== '' &&
                  typeof data.responsible === 'string'
                ? data.responsible
                : undefined,
          note: data.note || '',
        }

        return monitoringService.update(record._id, payload).catch((err) => {
          console.error(`Failed to update record ${record._id}:`, err)
          throw err
        })
      })

      // Execute all operations in parallel
      // Use allSettled to handle partial failures gracefully
      const allPromises = [...createPromises, ...updatePromises]
      const results = await Promise.allSettled(allPromises)

      // Check for failures
      const failures = results.filter((r) => r.status === 'rejected')
      if (failures.length > 0) {
        const errorMessages = failures.map((f) => f.reason?.message || String(f.reason)).join('; ')
        throw new Error(`Failed to save some records: ${errorMessages}`)
      }

      // Filter out null results (skipped records) and extract values
      const validResults = results
        .filter((r) => r.status === 'fulfilled' && r.value !== null)
        .map((r) => r.value)

      // Reload all records from API to get fresh data with populated fields
      // This ensures consistency and removes dirty flags
      const updatedRecords = await monitoringService.getByProject(projectId)
      setRecords(updatedRecords)

      // Dispatch event to notify workflow hook to refetch monitoring data
      window.dispatchEvent(
        new CustomEvent('monitoring-data-updated', {
          detail: { projectId },
        })
      )

      return { success: true }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      console.error('Failed to save monitoring records:', errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [records, projectId])

  /**
   * Get monitoring data for a specific category
   * @param {string} categoryCode - Category code
   * @returns {Array} Array of { indicator, record } objects
   */
  const getCategoryDataInternal = useCallback(
    (categoryCode) => {
      const category = categoriesWithIndicators.find(
        (cat) => cat.code === categoryCode || cat.id === categoryCode
      )
      const indicators = category?.indicators || []

      return indicators
        .filter((indicator) => {
          // Only include indicators with valid IDs
          const indicatorId = indicator._id || indicator.id
          return indicatorId && indicatorId !== 'undefined' && indicatorId !== 'null'
        })
        .map((indicator) => {
          // Use _id (MongoDB ObjectId) as primary, fallback to id for compatibility
          const indicatorId = indicator._id || indicator.id
          const record = recordMap.get(indicatorId)
          return {
            indicator,
            record: record || {
              _id: `placeholder_${indicatorId}`,
              project: projectId,
              indicator: indicatorId,
              scores: { baseline: '', Q1: '', Q2: '', Q3: '', Q4: '' },
              total: '',
              final_assessment: '',
              ranking: null,
              responsible: null,
              note: '',
              isNew: true,
            },
          }
        })
    },
    [categoriesWithIndicators, projectId, recordMap]
  )

  /**
   * Get statistics for all categories
   */
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
   * Get category data (public API)
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
