/**
 * useMonitoring Hook
 * Monitoring data (Tool 5): the saved records are a cached query; edits stay local (one per
 * indicator) until Save, which sends the changed records in one request (D32).
 */
import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { monitoringService } from '@/services/monitoringService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'
import { useLookups } from './useLookups'
import { useProjectSave } from './useProjectSave'
import { responsibleFields } from '@/utils/responsible'

const NO_RECORDS = []
const NO_EDITS = {}
const PLACEHOLDER = 'placeholder_'

const idOf = (value) => (value && typeof value === 'object' ? value._id : value)

// A record that does not exist yet for this indicator (created on Save when edited)
const emptyRecord = (projectId, indicatorId) => ({
  _id: `${PLACEHOLDER}${indicatorId}`,
  project: projectId,
  indicator: indicatorId,
  scores: { baseline: '', Q1: '', Q2: '', Q3: '', Q4: '' },
  total: '',
  final_assessment: '',
  ranking: null,
  responsible: null,
  responsible_text: '',
  note: '',
  isNew: true,
})

// A record as the bulk endpoint takes it (upserted by indicator)
const toPayloadRecord = (record) => ({
  indicator: idOf(record.indicator),
  scores: record.scores || { baseline: '', Q1: '', Q2: '', Q3: '', Q4: '' },
  total: record.total || '',
  final_assessment: record.final_assessment || '',
  ranking: record.ranking || 'not_applicable',
  note: record.note || '',
  ...responsibleFields(record),
})

/**
 * Hook for managing monitoring data
 * @param {string} projectId - Project ID
 */
export function useMonitoring(projectId) {
  const { impactCategories, categoriesWithIndicators, isLoading: lookupsLoading } = useLookups()
  const query = useQuery({
    queryKey: queryKeys.monitoring(projectId),
    queryFn: () => monitoringService.getByProject(projectId),
    enabled: !!projectId,
  })
  const savedRecords = query.data ?? NO_RECORDS
  // Local edits by indicator id
  const [edits, setEdits] = useState(NO_EDITS)
  const { save, isSaving, error, setError, queryClient } = useProjectSave(projectId)

  const savedByIndicator = useMemo(
    () => new Map(savedRecords.map((record) => [idOf(record.indicator), record])),
    [savedRecords]
  )

  // Saved records with the local edits applied, plus edited records not saved yet
  const records = useMemo(() => {
    const merged = savedRecords.map((record) => edits[idOf(record.indicator)] ?? record)
    const added = Object.entries(edits)
      .filter(([indicatorId]) => !savedByIndicator.has(indicatorId))
      .map(([, record]) => record)
    return [...merged, ...added]
  }, [savedRecords, savedByIndicator, edits])

  // Build lookup map: indicator ID → record
  const recordMap = useMemo(
    () => new Map(records.map((record) => [idOf(record.indicator), record])),
    [records]
  )

  // The indicator a change is for: given, from a placeholder id, or from the saved record
  const indicatorOf = useCallback(
    (recordId, indicatorId) => {
      if (indicatorId) return indicatorId
      if (typeof recordId === 'string' && recordId.startsWith(PLACEHOLDER)) {
        return recordId.slice(PLACEHOLDER.length)
      }
      return idOf(records.find((record) => record._id === recordId)?.indicator)
    },
    [records]
  )

  const editRecord = useCallback(
    (recordId, indicatorId, change) => {
      const id = indicatorOf(recordId, indicatorId)
      if (!id || !projectId) return
      setError(null)
      setEdits((prev) => {
        const base = prev[id] ?? savedByIndicator.get(id) ?? emptyRecord(projectId, id)
        return { ...prev, [id]: { ...change(base), _dirty: true } }
      })
    },
    [indicatorOf, projectId, savedByIndicator, setError]
  )

  /**
   * Update a quarter score (local only - sent on Save)
   */
  const updateQuarterScore = useCallback(
    (recordId, quarter, value, indicatorId) =>
      editRecord(recordId, indicatorId, (record) => ({
        ...record,
        scores: { ...record.scores, [quarter]: value },
      })),
    [editRecord]
  )

  /**
   * Update a field on a monitoring record (local only - sent on Save)
   */
  const updateRecordField = useCallback(
    (recordId, field, value, indicatorId) =>
      editRecord(recordId, indicatorId, (record) => ({ ...record, [field]: value })),
    [editRecord]
  )

  /**
   * Save the changed records in one request
   */
  const saveAllRecords = useCallback(async () => {
    const changed = Object.values(edits)
    if (changed.length === 0) return { success: true }
    const result = await save(
      () => monitoringService.save(projectId, changed.map(toPayloadRecord)),
      (saved) => queryClient.setQueryData(queryKeys.monitoring(projectId), saved)
    )
    if (result.success) setEdits(NO_EDITS)
    return result
  }, [edits, save, projectId, queryClient])

  /**
   * Get monitoring data for a specific category
   * @param {string} categoryCode - Category code
   * @returns {Array} Array of { indicator, record } objects
   */
  const getCategoryData = useCallback(
    (categoryCode) => {
      const category = categoriesWithIndicators.find(
        (cat) => cat.code === categoryCode || cat.id === categoryCode
      )
      return (category?.indicators || [])
        .filter((indicator) => indicator._id)
        .map((indicator) => ({
          indicator,
          record: recordMap.get(indicator._id) || emptyRecord(projectId, indicator._id),
        }))
    },
    [categoriesWithIndicators, projectId, recordMap]
  )

  /**
   * Get statistics for all categories (display only: how many indicators have data)
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
      const data = getCategoryData(category.code)
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
  }, [impactCategories, getCategoryData])

  return {
    records,
    isLoading: (!!projectId && query.isPending) || lookupsLoading,
    isSaving,
    hasChanges: edits !== NO_EDITS,
    error: error ?? (query.error ? extractErrorMessage(query.error) : null),
    refetch: query.refetch,
    updateQuarterScore,
    updateRecordField,
    saveAllRecords,
    getAllCategoryStats,
    getCategoryData,
  }
}
