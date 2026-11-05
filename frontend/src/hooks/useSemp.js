/**
 * SEMP table hooks: Management Activities (Tool 3) and Mitigation Plan (Tool 4)
 *
 * The saved table is a cached query; edits stay local until Save, which sends the whole table in
 * one request (D32): rows with `_id` are updated, new rows created, rows removed here deleted.
 * The save carries the table revision the edits started from (D62): if someone else saved the
 * table meanwhile, the backend answers 409 and nothing is overwritten (no merge).
 */

import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sempService } from '@/services/sempService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'
import { responsibleFields } from '@/utils/responsible'
import { useProjectSave } from './useProjectSave'

const NO_ROWS = []
const NOT_LOADED = { rows: NO_ROWS, version: undefined }

// A table row as the bulk endpoint takes it: ids instead of populated objects, no local flags,
// no temporary id on new rows.
function toPayloadRow(row) {
  const { _id, _isNew, project: _project, responsible: _responsible, ...fields } = row
  return { ...fields, ...(!_isNew && { _id }), ...responsibleFields(row) }
}

/**
 * @param {Object} config
 * @param {string} config.projectId
 * @param {Array} config.queryKey
 * @param {Function} config.load - (projectId) => Promise<{ rows, version }>
 * @param {Function} config.saveAll - (projectId, rows, version) => Promise<{ rows, version }>
 * @param {string} config.requiredField - Field every row must fill
 * @param {string} config.requiredLabel - Its label in the error message
 */
function useEditableTable({ projectId, queryKey, load, saveAll, requiredField, requiredLabel }) {
  const query = useQuery({
    queryKey,
    queryFn: () => load(projectId),
    enabled: !!projectId,
    // Not behind local edits: a change by someone else is caught at save (409, D62)
    refetchOnReconnect: false,
  })
  const saved = query.data ?? NOT_LOADED
  const savedRows = saved.rows ?? NO_ROWS
  // Local edits and the revision they started from; null = nothing changed since the last load
  // or save
  const [draft, setDraft] = useState(null)
  const rows = draft?.rows ?? savedRows
  const { save, fail, isSaving, error, setError, queryClient } = useProjectSave(projectId, queryKey)

  const edit = useCallback(
    (change) =>
      setDraft((prev) => ({
        version: prev ? prev.version : saved.version,
        rows: change(prev ? prev.rows : savedRows),
      })),
    [saved.version, savedRows]
  )

  /**
   * Add a new row (local only — sent on Save)
   */
  const addRow = useCallback(() => {
    const newRow = {
      _id: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      _isNew: true,
      serial_number: rows.length + 1,
      [requiredField]: '',
    }
    edit((prev) => [...prev, newRow])
    return newRow
  }, [rows.length, requiredField, edit])

  /**
   * Update a field of a row (local only)
   */
  const updateRow = useCallback(
    (rowId, field, value) => {
      setError(null)
      edit((prev) => prev.map((row) => (row._id === rowId ? { ...row, [field]: value } : row)))
    },
    [edit, setError]
  )

  /**
   * Remove a row (local only) and renumber the rest
   */
  const deleteRow = useCallback(
    (rowId) =>
      edit((prev) =>
        prev
          .filter((row) => row._id !== rowId)
          .map((row, index) => ({ ...row, serial_number: index + 1 }))
      ),
    [edit]
  )

  /**
   * Save the whole table in one request
   */
  const saveRows = useCallback(async () => {
    const incomplete = rows.filter((row) => !row[requiredField]?.trim()).length
    if (incomplete > 0) {
      return fail(
        `Please fill in "${requiredLabel}" for all rows before saving. ${incomplete} row(s) are incomplete.`
      )
    }
    const version = draft ? draft.version : saved.version
    const result = await save(
      () => saveAll(projectId, rows.map(toPayloadRow), version),
      (table) => queryClient.setQueryData(queryKey, table)
    )
    if (result.success) setDraft(null)
    return result
  }, [
    rows,
    requiredField,
    requiredLabel,
    fail,
    save,
    saveAll,
    projectId,
    queryClient,
    queryKey,
    draft,
    saved.version,
  ])

  return {
    rows,
    isLoading: !!projectId && query.isPending,
    isSaving,
    hasChanges: draft !== null,
    error: error ?? (query.error ? extractErrorMessage(query.error) : null),
    refetch: query.refetch,
    addRow,
    updateRow,
    deleteRow,
    saveRows,
  }
}

/**
 * Tool 3 table
 * @param {string} projectId
 */
export function useManagementActivities(projectId) {
  return useEditableTable({
    projectId,
    queryKey: queryKeys.management(projectId),
    load: sempService.getManagementActivities,
    saveAll: sempService.saveManagementActivities,
    requiredField: 'activity_description',
    requiredLabel: 'Activity Description',
  })
}

/**
 * Tool 4 table
 * @param {string} projectId
 */
export function useMitigationPlans(projectId) {
  return useEditableTable({
    projectId,
    queryKey: queryKeys.mitigation(projectId),
    load: sempService.getMitigationPlans,
    saveAll: sempService.saveMitigationPlans,
    requiredField: 'output_description',
    requiredLabel: 'Output Description',
  })
}
