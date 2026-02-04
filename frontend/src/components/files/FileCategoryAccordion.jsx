/**
 * FileCategoryAccordion Component
 * أكورديون لتجميع الملفات حسب entity_type
 */

import { useState } from 'react'
import { cn } from '@/utils/cn'
import FileListTable from './FileListTable'

/**
 * @param {Object} props
 * @param {string} props.title - عنوان الفئة
 * @param {string} props.entityType - نوع الكيان (project/screening/assessment/monitoring)
 * @param {Array} props.files - قائمة الملفات
 * @param {Function} props.onDownload - دالة التحميل
 * @param {Function} props.onDelete - دالة الحذف
 * @param {boolean} [props.defaultOpen] - مفتوح افتراضياً
 * @param {string} [props.icon] - أيقونة الفئة
 */
function FileCategoryAccordion({
  title,
  entityType,
  files = [],
  onDownload,
  onDelete,
  defaultOpen = false,
  icon = 'folder',
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const entityTypeConfig = {
    project: {
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    screening: {
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    assessment: {
      color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    monitoring: {
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
  }

  const config = entityTypeConfig[entityType] || entityTypeConfig.project

  return (
    <div className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-lg border-2',
              config.color,
              config.borderColor
            )}
          >
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
          <div className="text-left">
            <h3 className="font-bold text-base text-text-main dark:text-white">{title}</h3>
            <p className="text-sm text-text-secondary dark:text-gray-400 mt-0.5">
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'material-symbols-outlined text-2xl text-text-secondary dark:text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        >
          expand_more
        </span>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="border-t border-border-default dark:border-border-dark">
          {files.length > 0 ? (
            <FileListTable files={files} onDownload={onDownload} onDelete={onDelete} />
          ) : (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-5xl text-text-secondary dark:text-gray-500 mb-3 block">
                folder_open
              </span>
              <p className="text-text-secondary dark:text-gray-400">No files in this category</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FileCategoryAccordion
