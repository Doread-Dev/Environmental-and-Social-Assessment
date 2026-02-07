/**
 * ManagementActivitiesPage (Tool 3)
 * Matches design from: 17.Management Activities Table.html
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSemp } from '@/hooks/useSemp'
import { ManagementActivitiesTable } from '@/components/semp'
import { cn } from '@/utils/cn'
import { userService } from '@/services'

export default function ManagementActivitiesPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const {
    managementActivities,
    isLoading,
    isSaving,
    error,
    addManagementActivity,
    updateManagementActivity,
    deleteManagementActivity,
    saveManagementActivities,
  } = useSemp(projectId)

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const hasInitialized = useRef(false)
  const [users, setUsers] = useState([])
  const [isUsersLoading, setIsUsersLoading] = useState(true)

  // Load users for Responsibility column
  useEffect(() => {
    let cancelled = false

    const loadUsers = async () => {
      try {
        const activeUsers = await userService.getActive()
        if (!cancelled) {
          setUsers(activeUsers)
        }
      } catch (e) {
        // في حال الفشل، نبقي الجدول يعمل بدون القائمة (لن يؤثر على الحفظ)
        if (!cancelled) {
          setUsers([])
        }
      } finally {
        if (!cancelled) {
          setIsUsersLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      cancelled = true
    }
  }, [])

  // Auto-create first row if empty on load
  useEffect(() => {
    if (!isLoading && managementActivities.length === 0 && !hasInitialized.current) {
      addManagementActivity()
      hasInitialized.current = true
      // We don't set hasUnsavedChanges here to avoid prompting if user leaves immediately
      // knowing it's just an empty auto-generated row.
    } else if (!isLoading && managementActivities.length > 0) {
      hasInitialized.current = true
    }
  }, [isLoading, managementActivities, addManagementActivity])

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
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return
      }
    }
    navigate(`/app/projects/${projectId}/semp`)
  }

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading activities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden bg-background dark:bg-background-dark">
      {/* Header Section from Static HTML */}
      <div className="shrink-0 flex flex-wrap justify-between items-end gap-3 px-6 md:px-10 py-6 border-b border-border-default dark:border-border-dark bg-background dark:bg-background-dark">
        <div className="flex min-w-72 flex-col gap-2">
          <div className="flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-lg">build</span>
            <span>Tool 3</span>
          </div>
          <h1 className="text-text-main dark:text-white text-2xl md:text-3xl font-black leading-tight tracking-[-0.033em]">
            Environmental & Social Management
          </h1>
          <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal">
            Operational planning and risk mitigation tracking.
          </p>
        </div>

        <div className="gap-2 flex items-center justify-center">
          <button
            onClick={handleBack}
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-surface-dark border border-border-default dark:border-border-dark hover:bg-gray-50/50 dark:hover:bg-white/3 text-text-main dark:text-white text-sm font-bold transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span>Back</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || (justSaved && !hasUnsavedChanges)} // Disable if already saved to prevent double submitting without changes? Or keep enabled? User said "stays as Saved", implied purely feedback. I'll keep enabled or follow standard UX. Disable on Saved is good UX.
            className={cn(
              'flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 gap-2 text-sm font-bold leading-normal tracking-[0.015em] shadow-md transition-all transform ',
              isSaving
                ? 'bg-primary/70 cursor-wait'
                : justSaved && !hasUnsavedChanges
                  ? 'bg-green-600 hover:bg-green-700 text-white border border-transparent'
                  : 'bg-primary hover:bg-green-500 text-primary-content'
            )}
          >
            {saveBtn.spinner ? (
              <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-lg">{saveBtn.icon}</span>
            )}
            <span className="truncate">{saveBtn.text}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 md:mx-10 mt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">
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
          users={users}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAddRow={handleAddRow}
        />
      </div>
    </div>
  )
}
