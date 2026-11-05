import { ConfirmDialog } from '@/components/ui'

/**
 * Export from Tools 3, 4 or 5 while the page has unsaved edits (D74 3). An export always shows
 * what is saved, so the user can save first: "Save and export" saves, then exports the saved data
 * with its new status; a failed save (stale 409 included) shows its error and exports nothing.
 *
 * @param {Object} props
 * @param {boolean} [props.isSaving]
 * @param {Function} props.onSaveAndExport
 * @param {Function} props.onClose - Cancel
 */
function UnsavedExportDialog({ isSaving = false, onSaveAndExport, onClose }) {
  return (
    <ConfirmDialog
      title="You have unsaved changes"
      message={
        <p>
          The export holds the saved data only. Save your changes first, then the file is exported
          with them.
        </p>
      }
      confirmLabel="Save and export"
      confirmIcon="save"
      cancelLabel="Cancel"
      isLoading={isSaving}
      onConfirm={onSaveAndExport}
      onClose={onClose}
    />
  )
}

export default UnsavedExportDialog
