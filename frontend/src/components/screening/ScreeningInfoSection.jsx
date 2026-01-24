/**
 * ScreeningInfoSection Component
 * قسم معلومات الفرز (القسم 1)
 * مطابق للتصميم الأصلي حرفياً
 * 
 * Features:
 * - اسم المسؤول ومنصبه (read-only من بيانات المستخدم الحالي)
 * - تاريخ الفرز (قابل للتعديل)
 */

import { currentUser } from '@/data'
import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {string} props.officerName - اسم المسؤول
 * @param {string} props.officerPosition - منصب المسؤول
 * @param {string} props.screeningDate - تاريخ الفرز
 * @param {Function} props.onDateChange - callback عند تغيير التاريخ
 * @param {boolean} props.readOnly - وضع القراءة فقط
 * @param {string} props.error - رسالة الخطأ
 */
function ScreeningInfoSection({
  officerName,
  officerPosition,
  screeningDate,
  onDateChange,
  readOnly = false,
  error,
  className,
  ...props
}) {
  // Use current user if not provided
  const displayName = officerName || currentUser.name
  const displayPosition = officerPosition || currentUser.job_title?.title_name || 'Program Officer'

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-6', className)} {...props}>
      {/* Officer Name */}
      <div className="col-span-1">
        <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
          Program Officer Name <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full bg-gray-50 dark:bg-gray-800 border border-border-default dark:border-gray-700 rounded-lg px-4 py-2.5 text-text-main dark:text-white text-sm focus:outline-none cursor-not-allowed font-medium"
          readOnly
          type="text"
          value={displayName}
        />
      </div>

      {/* Officer Position */}
      <div className="col-span-1">
        <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
          Program Officer Position <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full bg-gray-50 dark:bg-gray-800 border border-border-default dark:border-gray-700 rounded-lg px-4 py-2.5 text-text-main dark:text-white text-sm focus:outline-none cursor-not-allowed font-medium"
          readOnly
          type="text"
          value={displayPosition}
        />
      </div>

      {/* Screening Date */}
      <div className="col-span-1 md:col-span-2">
        <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
          Screening Date <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            className={cn(
              'w-full rounded-lg border border-border-color dark:border-gray-600',
              'bg-white dark:bg-[#102216]',
              'text-text-main dark:text-white',
              'focus:ring-primary focus:border-primary',
              'px-3 py-2.5 text-sm',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
            type="date"
            value={screeningDate || ''}
            onChange={(e) => onDateChange?.(e.target.value)}
            disabled={readOnly}
          />
        </div>
        {error && (
          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

export default ScreeningInfoSection
