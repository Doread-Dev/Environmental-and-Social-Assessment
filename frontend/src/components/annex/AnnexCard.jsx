/**
 * AnnexCard
 * One annex (A–H): its files with download, and — for editors — upload and delete.
 */
import { useRef } from 'react'
import { Card, Badge, Button, Icon, LoadingSpinner } from '@/components/ui'
import { formatDate } from '@/utils/formatters'
import { formatBytes } from '@/utils/fileRules'

export function AnnexCard({
  annex,
  files,
  canEdit,
  accept,
  isUploading,
  uploadDisabled,
  onUpload,
  onDownload,
  onDelete,
}) {
  const inputRef = useRef(null)

  const handleChange = (event) => {
    const picked = Array.from(event.target.files ?? [])
    // Reset so the same file can be picked again after an error.
    event.target.value = ''
    if (picked.length > 0) onUpload(picked)
  }

  return (
    <Card>
      <Card.Body>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary font-bold text-lg flex-shrink-0">
              {annex.letter}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-bold text-base text-text-main dark:text-white">
                  {annex.title}
                </h3>
                <Badge variant={files.length > 0 ? 'primary' : 'default'} size="sm">
                  {files.length} {files.length === 1 ? 'file' : 'files'}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary dark:text-gray-400">{annex.description}</p>
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
                  aria-label={`Upload files to ${annex.title}`}
                  data-testid={`upload-input-${annex.category}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isUploading}
                  disabled={uploadDisabled}
                  leftIcon={<Icon name="upload" />}
                  onClick={() => inputRef.current?.click()}
                >
                  {isUploading ? 'Uploading…' : 'Upload'}
                </Button>
              </>
            )}
          </div>

          {files.length === 0 ? (
            <p className="text-sm text-text-secondary dark:text-gray-400 italic pl-16">
              No files yet.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-default dark:divide-border-dark border border-border-default dark:border-border-dark rounded-lg">
              {files.map((file) => (
                <li key={file._id} className="flex items-center gap-3 px-4 py-3">
                  <span className="material-symbols-outlined text-text-secondary dark:text-gray-400">
                    description
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-text-main dark:text-white truncate text-left"
                      dir="auto"
                      title={file.original_name}
                    >
                      {file.original_name}
                    </p>
                    <p className="text-xs text-text-secondary dark:text-gray-400">
                      {formatBytes(file.size)} · {formatDate(file.createdAt)}
                      {file.uploaded_by?.name && ` · ${file.uploaded_by.name}`}
                    </p>
                  </div>
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
              ))}
            </ul>
          )}
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400 pl-16">
              <LoadingSpinner size="sm" /> Uploading files one by one…
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  )
}

export default AnnexCard
