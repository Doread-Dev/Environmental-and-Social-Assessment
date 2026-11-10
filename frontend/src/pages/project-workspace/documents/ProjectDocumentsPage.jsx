/**
 * ProjectDocumentsPage
 * A project's own files (D47, D64 d), grouped by the project-workflow places (from GET /lookups)
 * and then "Other". PDF + Office: PDFs open in the in-app viewer, Office files download. Editors
 * upload and delete (files.edit); archived projects are read-only.
 */
import { useMemo, useState } from 'react'
import {
  Alert,
  useToast,
  PAGE_TITLE,
  PAGE_DESCRIPTION,
  LoadingState,
  ErrorState,
} from '@/components/ui'
import { DocumentSection } from '@/components/documents'
import { ConfirmDeleteModal, PdfViewer } from '@/components/files'
import { useLookups, useProjectContext, useProjectFiles } from '@/hooks'
import { useAuth } from '@/contexts'
import { extractErrorMessage } from '@/services/api'
import { fileService } from '@/services/fileService'
import { acceptAttribute, formatBytes } from '@/utils/fileRules'

const OTHER = { key: 'other', label: 'Other' }

export default function ProjectDocumentsPage() {
  const { project, can } = useProjectContext()
  const { uploadRules } = useAuth()
  const { placesByGroup, isLoading: placesLoading } = useLookups()
  const toast = useToast()
  const {
    files,
    filesIn,
    isLoading,
    error,
    retry,
    uploadFiles,
    uploadingCategory,
    downloadFile,
    removeFile,
    isRemoving,
  } = useProjectFiles(project?._id)
  const [toDelete, setToDelete] = useState(null)
  const [viewing, setViewing] = useState(null)

  const canEdit = can('files.edit')

  // One section per project-workflow place, then Other
  const sections = useMemo(() => {
    const workflow = placesByGroup.find((group) => group.key === 'project_workflow')
    return [...(workflow?.places ?? []), OTHER]
  }, [placesByGroup])

  const handleUpload = async (category, picked) => {
    const { uploaded, failed } = await uploadFiles(category, picked)
    if (uploaded > 0) toast.success(uploaded === 1 ? 'File uploaded' : `${uploaded} files uploaded`)
    failed.forEach(({ name, error: reason }) => toast.error(`${name}: ${reason}`))
  }

  const handleDownload = async (file) => {
    try {
      await downloadFile(file)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    try {
      await removeFile(toDelete._id)
      toast.success('File deleted')
      setToDelete(null)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background dark:bg-background-dark py-6 sm:p-6 md:p-10 lg:p-12">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-border-default dark:border-border-dark pb-6">
          <div className="flex flex-col gap-2">
            <h1 className={PAGE_TITLE}>Documents</h1>
            <p className={PAGE_DESCRIPTION}>
              This project&apos;s own files, by tool. Organisation guidance is in the Library.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400">
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              folder
            </span>
            <span>
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </span>
          </div>
        </div>

        {/* Archived: the layout shows the read-only notice (ArchivedNotice) */}
        {!project?.archived && canEdit && uploadRules && (
          <Alert variant="info" title="Uploading files">
            Allowed: {uploadRules.extensions.map((ext) => `.${ext}`).join(', ')} — up to{' '}
            {formatBytes(uploadRules.max_bytes)} per file. You can pick several files at once. PDFs
            open in the app; other files download.
          </Alert>
        )}

        {isLoading || placesLoading ? (
          <LoadingState message="Loading documents..." variant="section" />
        ) : error ? (
          <ErrorState
            variant="section"
            title="Could not load the documents"
            message={error}
            onRetry={retry}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4" aria-label="Documents by tool">
            {sections.map((section) => (
              <DocumentSection
                key={section.key}
                section={section}
                files={filesIn(section.key)}
                canEdit={canEdit}
                accept={acceptAttribute(uploadRules)}
                isUploading={uploadingCategory === section.key}
                uploadDisabled={!!uploadingCategory}
                onUpload={(picked) => handleUpload(section.key, picked)}
                onOpen={setViewing}
                onDownload={handleDownload}
                onDelete={setToDelete}
              />
            ))}
          </div>
        )}
      </div>

      {viewing && (
        <PdfViewer
          key={viewing._id}
          title={viewing.original_name}
          fileName={viewing.original_name}
          load={() => fileService.download(viewing._id)}
          onClose={() => setViewing(null)}
        />
      )}
      {toDelete && (
        <ConfirmDeleteModal
          title="Delete file"
          name={toDelete.original_name}
          note="The file is removed for everyone and cannot be recovered."
          isDeleting={isRemoving}
          onConfirm={handleDelete}
          onClose={() => !isRemoving && setToDelete(null)}
        />
      )}
    </div>
  )
}
