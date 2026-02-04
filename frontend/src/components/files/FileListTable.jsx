/**
 * FileListTable Component
 * جدول عرض الملفات
 */

import { cn } from '@/utils/cn'
import { formatFileSize } from '@/data'
import FileRowActions from './FileRowActions'

/**
 * @param {Object} props
 * @param {Array} props.files - قائمة الملفات
 * @param {Function} props.onDownload - دالة التحميل
 * @param {Function} props.onDelete - دالة الحذف
 */
function FileListTable({ files = [], onDownload, onDelete }) {
  if (files.length === 0) {
    return (
      <div className="p-8 text-center">
        <span className="material-symbols-outlined text-5xl text-text-secondary dark:text-gray-500 mb-3 block">
          description_off
        </span>
        <p className="text-text-secondary dark:text-gray-400">No files available</p>
      </div>
    )
  }

  // File type icon mapping
  const getFileIcon = (fileType) => {
    const iconMap = {
      pdf: { icon: 'picture_as_pdf', color: 'text-red-600' },
      doc: { icon: 'description', color: 'text-blue-600' },
      docx: { icon: 'description', color: 'text-blue-600' },
      xls: { icon: 'table_chart', color: 'text-green-600' },
      xlsx: { icon: 'table_chart', color: 'text-green-600' },
      jpg: { icon: 'image', color: 'text-purple-600' },
      jpeg: { icon: 'image', color: 'text-purple-600' },
      png: { icon: 'image', color: 'text-purple-600' },
      zip: { icon: 'folder_zip', color: 'text-yellow-600' },
    }
    return iconMap[fileType?.toLowerCase()] || { icon: 'insert_drive_file', color: 'text-gray-600' }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default dark:border-border-dark bg-gray-50/50 dark:bg-white/5">
            <th className="px-4 py-3 text-left text-xs font-bold text-text-main dark:text-white uppercase tracking-wider">
              File Name
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-text-main dark:text-white uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold text-text-main dark:text-white uppercase tracking-wider">
              Size
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-text-main dark:text-white uppercase tracking-wider">
              Uploaded By
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-text-main dark:text-white uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-text-main dark:text-white uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const fileIconData = getFileIcon(file.file_type)
            return (
              <tr
                key={file._id}
                className="border-b border-border-default dark:border-border-dark hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
              >
                {/* File Name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={cn('material-symbols-outlined text-xl', fileIconData.color)}>
                      {fileIconData.icon}
                    </span>
                    <span className="text-sm text-text-main dark:text-white font-medium">
                      {file.file_name}
                    </span>
                  </div>
                </td>

                {/* Type */}
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 rounded-md bg-gray-50/50 dark:bg-white/5 text-xs font-medium text-text-main dark:text-white uppercase">
                    {file.file_type}
                  </span>
                </td>

                {/* Size */}
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-text-secondary dark:text-gray-400">
                    {formatFileSize(file.file_size)}
                  </span>
                </td>

                {/* Uploaded By */}
                <td className="px-4 py-3">
                  <span className="text-sm text-text-secondary dark:text-gray-400">
                    User #{file.uploaded_by.slice(-3)}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3">
                  <span className="text-sm text-text-secondary dark:text-gray-400">
                    {new Date(file.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    <FileRowActions file={file} onDownload={onDownload} onDelete={onDelete} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default FileListTable
