/**
 * DocumentSection
 * One section of a project's documents (D64 d): a project-workflow place or "Other". Its files
 * open in the PDF viewer (PDFs) or download (Office); editors upload and delete.
 */
import { useRef } from 'react'
import { Card, Badge, Button, Icon, LoadingSpinner } from '@/components/ui'
import { formatDate } from '@/utils/formatters'
import { formatBytes } from '@/utils/fileRules'
import { isPdf } from '@/utils/saveBlob'

/**
 * @param {Object} props
 * @param {{key: string, label: string}} props.section
 */
export function DocumentSection({
  section,
  files,
  canEdit,
  accept,
  isUploading,
  uploadDisabled,
  onUpload,
  onOpen,
  onDownload,
  onDelete,
}) {
  const inputRef = useRef(null)
  const headingId = `documents-${section.key}`

  const handleChange = (event) => {
    const picked = Array.from(event.target.files ?? [])
    // Reset so the same file can be picked again after an error.
    event.target.value = ''
    if (picked.length > 0) onUpload(picked)
  }

  return (
    <Card>
      <Card.Body>
        <section className="flex flex-col gap-4" aria-labelledby={headingId}>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
              <h3 id={headingId} className="font-bold text-base text-text-main dark:text-white">
                {section.label}
              </h3>
              <Badge variant={files.length > 0 ? 'primary' : 'default'} size="sm">
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </Badge>
            </div>
            {canEdit && (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept={accept}
                  className="hidden"
                  onChange={handleChange}
                  aria-label={`Upload files to ${section.label}`}
                  data-testid={`upload-input-${section.key}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isUploading}
                  disabled={uploadDisabled}
                  leftIcon={<Icon name="upload" />}
                  onClick={() => inputRef.current?.click()}
                  aria-label={`Upload to ${section.label}`}
                >
                  {isUploading ? 'Uploading…' : 'Upload'}
                </Button>
              </>
            )}
          </div>

          {files.length === 0 ? (
            <p className="text-sm text-text-secondary dark:text-gray-400 italic">No files yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-default dark:divide-border-dark border border-border-default dark:border-border-dark rounded-lg">
              {files.map((file) => {
                const pdf = isPdf(file)
                return (
                  <li key={file._id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={
                        pdf
                          ? 'material-symbols-outlined text-red-600 dark:text-red-400'
                          : 'material-symbols-outlined text-text-secondary dark:text-gray-400'
                      }
                      aria-hidden="true"
                    >
                      {pdf ? 'picture_as_pdf' : 'description'}
                    </span>
                    <div className="flex-1 min-w-0">
                      {pdf ? (
                        <button
                          type="button"
                          onClick={() => onOpen(file)}
                          className="block max-w-full text-sm font-medium text-text-main dark:text-white truncate text-left hover:text-primary hover:underline"
                          dir="auto"
                          title={file.original_name}
                        >
                          {file.original_name}
                        </button>
                      ) : (
                        <p
                          className="text-sm font-medium text-text-main dark:text-white truncate text-left"
                          dir="auto"
                          title={file.original_name}
                        >
                          {file.original_name}
                        </p>
                      )}
                      <p className="text-xs text-text-secondary dark:text-gray-400">
                        {formatBytes(file.size)} · {formatDate(file.createdAt)}
                        {file.uploaded_by?.name && ` · ${file.uploaded_by.name}`}
                      </p>
                    </div>
                    {pdf && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpen(file)}
                        aria-label={`Open ${file.original_name}`}
                      >
                        <Icon name="visibility" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(file)}
                      aria-label={`Download ${file.original_name}`}
                    >
                      <Icon name="download" />
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(file)}
                        aria-label={`Delete ${file.original_name}`}
                      >
                        <Icon name="delete" />
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400">
              <LoadingSpinner size="sm" /> Uploading files one by one…
            </div>
          )}
        </section>
      </Card.Body>
    </Card>
  )
}

export default DocumentSection
