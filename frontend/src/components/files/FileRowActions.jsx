/**
 * FileRowActions Component
 * أزرار تحميل/حذف ملف
 */

import { useState } from 'react'
import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {Object} props.file - بيانات الملف
 * @param {Function} props.onDownload - دالة التحميل
 * @param {Function} props.onDelete - دالة الحذف
 */
function FileRowActions({ file, onDownload, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(file._id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Download Button */}
      <button
        type="button"
        onClick={() => onDownload(file)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
        title="Download file"
      >
        <span className="material-symbols-outlined text-lg">download</span>
      </button>

      {/* Delete Button */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className={cn(
          'p-2 rounded-lg text-text-secondary dark:text-gray-400 transition-colors',
          isDeleting
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
        )}
        title="Delete file"
      >
        <span className="material-symbols-outlined text-lg">
          {isDeleting ? 'hourglass_empty' : 'delete'}
        </span>
      </button>
    </div>
  )
}

export default FileRowActions
