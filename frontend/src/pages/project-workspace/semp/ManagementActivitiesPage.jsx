/**
 * ManagementActivitiesPage (Tool 3)
 * Matches design from: 17.Management Activities Table.html
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { useManagementActivities } from '@/hooks/useSemp'
import { ManagementActivitiesTable } from '@/components/semp'
import { useUsers } from '@/hooks'
import { useUnsavedChanges } from '@/contexts'
import {
  useToast,
  LoadingState,
  PAGE_TITLE,
  PAGE_DESCRIPTION,
  Button,
  ConfirmDialog,
} from '@/components/ui'

export default function ManagementActivitiesPage() {
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
    rows: managementActivities,
    isLoading,
    isSaving,
    error,
    addRow: addManagementActivity,
    updateRow: updateManagementActivity,
    deleteRow: deleteManagementActivity,
    saveRows: saveManagementActivities,
  } = useManagementActivities(projectId)

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  // Asks before exporting an empty template (in-app dialog, not window.confirm)
  const [confirmEmptyExport, setConfirmEmptyExport] = useState(false)
  const hasInitialized = useRef(false)

  // Auto-create first row if empty on load
  useEffect(() => {
    if (!isLoading && canEdit && managementActivities.length === 0 && !hasInitialized.current) {
      addManagementActivity()
      hasInitialized.current = true
      // We don't set hasUnsavedChanges here to avoid prompting if user leaves immediately
      // knowing it's just an empty auto-generated row.
    } else if (!isLoading && managementActivities.length > 0) {
      hasInitialized.current = true
    }
  }, [isLoading, canEdit, managementActivities, addManagementActivity])

  // Handle export event from SempFullWidthLayout
  useEffect(() => {
    if (!projectId) return

    const handleExportEvent = async (event) => {
      if (event.detail?.toolType === 'tool3') {
        try {
          const exportProject = project
          if (!exportProject) {
            throw new Error('Project data is not available')
          }

          // Filter out placeholder/temporary activities (those with _isNew flag or temp IDs)
          const validActivities = (managementActivities || []).filter((activity) => {
            // Skip activities with temporary IDs (starting with "temp_")
            if (
              activity._id &&
              typeof activity._id === 'string' &&
              activity._id.startsWith('temp_')
            ) {
              return false
            }
            return true
          })

          if (validActivities.length === 0 && !event.detail?.confirmedEmpty) {
            setConfirmEmptyExport(true)
            return
          }

          const { exportTool, exportStatus } = await import('@/utils/excelExport')
          const fileName = await exportTool(
            'tool3',
            { project: exportProject, rows: validActivities },
            exportStatus(workflow, 'tool3')
          )
          toast.success(`Downloaded ${fileName}`)
        } catch (error) {
          console.error('[ManagementActivitiesPage] Export error:', error)
          toast.error(`Failed to export Excel file: ${error.message || 'Unknown error'}`)
        }
      }
    }

    window.addEventListener('semp-export', handleExportEvent)
    return () => {
      window.removeEventListener('semp-export', handleExportEvent)
    }
  }, [project, projectId, workflow, managementActivities, toast])

  // Handlers
  const handleUpdate = (rowId, field, value) => {
    updateManagementActivity(rowId, field, value)
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }

  const handleAddRow = () => {
    addManagementActivity()
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }

  const handleDelete = (rowId) => {
    deleteManagementActivity(rowId)
    setHasUnsavedChanges(true)
    setJustSaved(false)
  }

  const handleSave = async () => {
    const result = await saveManagementActivities()
    if (result.success) {
      setHasUnsavedChanges(false)
      setJustSaved(true)
    }
    return result
  }

  // Leaving with unsaved edits (Back, sidebar, browser Back, refresh) asks Save / Discard / Stay
  // in the shared in-app dialog (D61); the auto-added empty first row alone does not count.
  useUnsavedChanges(canEdit && hasUnsavedChanges, handleSave)

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
    return <LoadingState message="Loading activities..." />
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
            <span>Tool 3</span>
          </div>
          <h1 className={PAGE_TITLE}>Environmental & Social Management</h1>
          <p className={PAGE_DESCRIPTION}>Operational planning and risk mitigation tracking.</p>
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
        <ManagementActivitiesTable
          activities={managementActivities}
          users={activeUsers ?? []}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAddRow={handleAddRow}
          readOnly={!canEdit}
        />
      </div>

      {confirmEmptyExport && (
        <ConfirmDialog
          title="Export an empty template"
          message={<p>No saved activities found. Do you want to export an empty template?</p>}
          confirmLabel="Export"
          confirmIcon="download"
          onConfirm={() => {
            setConfirmEmptyExport(false)
            window.dispatchEvent(
              new CustomEvent('semp-export', {
                detail: { toolType: 'tool3', confirmedEmpty: true },
              })
            )
          }}
          onClose={() => setConfirmEmptyExport(false)}
        />
      )}
    </div>
  )
}
