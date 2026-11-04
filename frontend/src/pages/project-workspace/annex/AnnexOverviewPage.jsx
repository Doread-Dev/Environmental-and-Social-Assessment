/**
 * AnnexOverviewPage
 * Annex A–H of a project with real files (D47): editors upload and delete, every role downloads.
 * Archived projects are read-only (the workspace's allowed actions have no files.edit).
 */
import { useState } from 'react'
import { Alert, Button, Icon, LoadingSpinner, useToast } from '@/components/ui'
import { AnnexCard, DeleteFileModal } from '@/components/annex'
import { useProjectContext, useProjectFiles } from '@/hooks'
import { useAuth } from '@/contexts'
import { extractErrorMessage } from '@/services/api'
import { annexItems } from '@/utils/annexTypes'
import { acceptAttribute, formatBytes } from '@/utils/fileRules'

export default function AnnexOverviewPage() {
  const { project, can } = useProjectContext()
  const { uploadRules } = useAuth()
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

  const canEdit = can('files.edit')

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
    <div className="flex-1 overflow-y-auto bg-background dark:bg-background-dark p-6 md:p-10 lg:p-12">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-border-default dark:border-border-dark pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black tracking-tight font-display">
              Annex
            </h1>
            <p className="text-text-secondary dark:text-gray-400 text-lg font-normal">
              Reference documents and supporting materials
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400">
            <span className="material-symbols-outlined text-base">folder</span>
            <span>
              {files.length} {files.length === 1 ? 'file' : 'files'} in {annexItems.length} annexes
            </span>
          </div>
        </div>

        {project?.archived ? (
          <Alert variant="warning" title="Archived project">
            This project is archived: files can be downloaded but not added or deleted.
          </Alert>
        ) : (
          canEdit &&
          uploadRules && (
            <Alert variant="info" title="Uploading files">
              Allowed: {uploadRules.extensions.map((ext) => `.${ext}`).join(', ')} — up to{' '}
              {formatBytes(uploadRules.max_bytes)} per file. You can pick several files at once.
            </Alert>
          )
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Alert
            variant="error"
            title="Could not load the annex files"
            action={
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Icon name="refresh" />}
                onClick={retry}
              >
                Try again
              </Button>
            }
          >
            {error}
          </Alert>
        ) : (
          <section className="grid grid-cols-1 gap-4" aria-label="Annexes">
            {annexItems.map((annex) => (
              <AnnexCard
                key={annex.category}
                annex={annex}
                files={filesIn(annex.category)}
                canEdit={canEdit}
                accept={acceptAttribute(uploadRules)}
                isUploading={uploadingCategory === annex.category}
                uploadDisabled={!!uploadingCategory}
                onUpload={(picked) => handleUpload(annex.category, picked)}
                onDownload={handleDownload}
                onDelete={setToDelete}
              />
            ))}
          </section>
        )}
      </div>

      {toDelete && (
        <DeleteFileModal
          file={toDelete}
          isDeleting={isRemoving}
          onConfirm={handleDelete}
          onClose={() => !isRemoving && setToDelete(null)}
        />
      )}
    </div>
  )
}
