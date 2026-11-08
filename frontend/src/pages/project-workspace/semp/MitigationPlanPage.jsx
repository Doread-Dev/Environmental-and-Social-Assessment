/**
 * MitigationPlanPage (Tool 4)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/services/queryKeys'
import { UnsavedExportDialog, useExportHandler } from '@/components/export'
import { useMitigationPlans } from '@/hooks/useSemp'
import { MitigationPlanTable } from '@/components/semp'
import { useUsers } from '@/hooks'
import { useUnsavedChanges } from '@/contexts'
import { useToast, LoadingState, PAGE_TITLE, PAGE_DESCRIPTION, Button } from '@/components/ui'

export default function MitigationPlanPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const outletContext = useOutletContext()
  // From SempFullWidthLayout (workspace query)
  const project = outletContext?.project || null
  const workflow = outletContext?.workflow
  const canEdit = outletContext?.can?.('semp.edit') ?? false
  const { activeUsers } = useUsers()

  const {
    rows: mitigationPlans,
    isLoading,
    isSaving,
    error,
    addRow: addMitigationPlan,
    updateRow: updateMitigationPlan,
    deleteRow: deleteMitigationPlan,
    saveRows: saveMitigationPlans,
  } = useMitigationPlans(projectId)

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  // Export with unsaved edits: save first (D74 3)
  const [confirmUnsavedExport, setConfirmUnsavedExport] = useState(false)
  const [isSavingForExport, setIsSavingForExport] = useState(false)
  const queryClient = useQueryClient()
  const hasInitialized = useRef(false)

  // Auto-create first row if empty on load
  useEffect(() => {
    if (!isLoading && canEdit && mitigationPlans.length === 0 && !hasInitialized.current) {
      addMitigationPlan()
      hasInitialized.current = true
    } else if (!isLoading && mitigationPlans.length > 0) {
      hasInitialized.current = true
    }
  }, [isLoading, canEdit, mitigationPlans, addMitigationPlan])

  // The file always holds what is saved (D74 3): the cached table and the current workflow status
  const exportSaved = useCallback(async () => {
    try {
      if (!project) throw new Error('Project data is not available')
      const rows = queryClient.getQueryData(queryKeys.mitigation(projectId))?.rows ?? []
      const current = queryClient.getQueryData(queryKeys.workspace(projectId))?.workflow
      const { exportTool, exportStatus } = await import('@/utils/excelExport')
      const fileName = await exportTool(
        'tool4',
        { project, rows },
        exportStatus(current ?? workflow, 'tool4')
      )
      toast.success(`Downloaded ${fileName}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(`Failed to export Excel file: ${error.message || 'Unknown error'}`)
    }
  }, [project, projectId, queryClient, workflow, toast])

  // The header's Export Excel (SempFullWidthLayout), once the rows are loaded: with unsaved edits,
  // ask to save first
  useExportHandler(
    'semp-export',
    (event) => {
      if (event.detail?.toolType !== 'tool4') return
      if (canEdit && hasUnsavedChanges) setConfirmUnsavedExport(true)
      else exportSaved()
    },
    !isLoading
  )

  // Handlers
  const handleUpdate = (rowId, field, value) => {
    updateMitigationPlan(rowId, field, value)
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }

  const handleAddRow = () => {
    addMitigationPlan()
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }

  const handleDelete = (rowId) => {
    deleteMitigationPlan(rowId)
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }

  const handleSave = async () => {
    const result = await saveMitigationPlans()
    if (result.success) {
      setHasUnsavedChanges(false)
      setJustSaved(true)
    }
    return result
  }

  // Leaving with unsaved edits (Back, sidebar, browser Back, refresh) asks Save / Discard / Stay
  // in the shared in-app dialog (D61); the auto-added empty first row alone does not count.
  useUnsavedChanges(canEdit && hasUnsavedChanges, handleSave)

  // "Save and export": a failed save (its error, or the stale dialog) exports nothing
  const saveAndExport = async () => {
    setIsSavingForExport(true)
    const result = await handleSave()
    setIsSavingForExport(false)
    setConfirmUnsavedExport(false)
    if (result.success) await exportSaved()
  }

  const handleBack = () => navigate(`/app/projects/${projectId}/semp`)

  // Determine button label and icon based on state
  const getSaveButtonContent = () => {
    if (isSaving) {
      return { icon: null, text: 'Saving...', spinner: true }
    }
    if (justSaved && !hasUnsavedChanges) {
      return { icon: 'check', text: 'Saved', spinner: false }
    }
    return { icon: 'save', text: 'Save', spinner: false }
  }

  const saveBtn = getSaveButtonContent()

  if (isLoading) {
    return <LoadingState message="Loading mitigation plans..." />
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden bg-background dark:bg-background-dark">
      {/* Header Section from Static HTML */}
      <div className="shrink-0 flex flex-wrap justify-between items-end gap-3 px-6 md:px-10 py-6 border-b border-border-default dark:border-border-dark bg-background dark:bg-background-dark">
        <div className="flex min-w-72 flex-col gap-2">
          <div className="flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              build
            </span>
            <span>Tool 4</span>
          </div>
          <h1 className={PAGE_TITLE}>Impact Mitigation & Enhancement Plan</h1>
          <p className={PAGE_DESCRIPTION}>Mitigation, monitoring, and responsibilities tracking.</p>
        </div>

        <div className="gap-2 flex items-center justify-center">
          <Button variant="secondary" onClick={handleBack}>
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              arrow_back
            </span>
            <span>Back</span>
          </Button>

          {canEdit && (
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving || (justSaved && !hasUnsavedChanges)}
              isLoading={isSaving}
              leftIcon={
                saveBtn.icon ? (
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">
                    {saveBtn.icon}
                  </span>
                ) : undefined
              }
            >
              {saveBtn.text}
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 md:mx-10 mt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl"
                aria-hidden="true"
              >
                error
              </span>
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-300 font-medium text-sm">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="px-4 md:px-10 pb-10 pt-4 w-full flex-1 flex flex-col overflow-hidden relative">
        <MitigationPlanTable
          plans={mitigationPlans}
          users={activeUsers ?? []}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAddRow={handleAddRow}
          readOnly={!canEdit}
        />
      </div>

      {confirmUnsavedExport && (
        <UnsavedExportDialog
          isSaving={isSavingForExport}
          onSaveAndExport={saveAndExport}
          onClose={() => setConfirmUnsavedExport(false)}
        />
      )}
    </div>
  )
}
