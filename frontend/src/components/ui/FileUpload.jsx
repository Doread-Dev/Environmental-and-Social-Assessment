import { useState, useRef, useCallback } from 'react'
import { cn } from '@/utils/cn'

/**
 * File Upload component with drag and drop
 *
 * @param {Object} props
 * @param {string} props.accept - Accepted file types (e.g., "image/*,.pdf")
 * @param {boolean} props.multiple - Allow multiple files
 * @param {number} props.maxSize - Max file size in bytes
 * @param {number} props.maxFiles - Max number of files
 * @param {Function} props.onUpload - Upload handler (files) => void
 * @param {Function} props.onError - Error handler (error) => void
 * @param {string} props.label - Upload area label
 * @param {string} props.hint - Hint text
 *
 * @example
 * <FileUpload
 *   accept="image/*,.pdf"
 *   multiple
 *   maxSize={5 * 1024 * 1024}
 *   onUpload={(files) => handleFiles(files)}
 * />
 */
function FileUpload({
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  onUpload,
  onError,
  label = 'Upload files',
  hint = 'Drag and drop or click to browse',
  disabled = false,
  className,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState([])
  const inputRef = useRef(null)

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFiles = useCallback(
    (fileList) => {
      const validFiles = []
      const errors = []

      Array.from(fileList).forEach((file) => {
        if (file.size > maxSize) {
          errors.push(`${file.name} exceeds max size of ${formatFileSize(maxSize)}`)
        } else {
          validFiles.push(file)
        }
      })

      if (!multiple && validFiles.length > 1) {
        validFiles.splice(1)
      }

      if (validFiles.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`)
        validFiles.splice(maxFiles)
      }

      return { validFiles, errors }
    },
    [maxSize, maxFiles, multiple]
  )

  const handleFiles = useCallback(
    (fileList) => {
      const { validFiles, errors } = validateFiles(fileList)

      if (errors.length > 0 && onError) {
        onError(errors)
      }

      if (validFiles.length > 0) {
        setFiles(validFiles)
        onUpload?.(validFiles)
      }
    },
    [validateFiles, onUpload, onError]
  )

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  const handleChange = (e) => {
    handleFiles(e.target.files)
  }

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onUpload?.(newFiles)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8',
          'flex flex-col items-center justify-center gap-3',
          'cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border-default dark:border-border-dark hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />

        <span className="material-symbols-outlined text-4xl text-text-muted dark:text-gray-500">
          cloud_upload
        </span>

        <div className="text-center">
          <p className="text-text-main dark:text-white font-medium">{label}</p>
          <p className="text-sm text-text-secondary dark:text-gray-400">{hint}</p>
          <p className="text-xs text-text-muted dark:text-gray-500 mt-1">
            Max size: {formatFileSize(maxSize)}
          </p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                'bg-background dark:bg-surface-dark',
                'border border-border-default dark:border-border-dark'
              )}
            >
              <span className="material-symbols-outlined text-text-muted">description</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-text-secondary dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-error/10 rounded text-text-muted hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload
