/**
 * ScreeningInfoSection Component
 * قسم معلومات الفرز (القسم 1)
 * مطابق للتصميم الأصلي حرفياً
 *
 * Features:
 * - اسم المسؤول ومنصبه (read-only من بيانات المستخدم الحالي)
 * - تاريخ الفرز (قابل للتعديل)
 */

import { useAuth, ROLE_LABELS } from '@/contexts'
import { cn } from '@/utils/cn'
import { Input } from '@/components/ui'

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
  const { user } = useAuth()

  // Use current user if not provided
  const displayName = officerName || user?.name || 'N/A'
  const displayPosition =
    officerPosition ||
    user?.job_title?.title_name ||
    (user?.role ? ROLE_LABELS[user.role] : null) ||
    'Program Officer'

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-6', className)} {...props}>
      {/* Officer Name (read-only: the signed-in or recorded officer) */}
      <Input
        label="Program Officer Name"
        required
        readOnly
        type="text"
        value={displayName}
        inputClassName="font-medium"
      />

      {/* Officer Position */}
      <Input
        label="Program Officer Position"
        required
        readOnly
        type="text"
        value={displayPosition}
        inputClassName="font-medium"
      />

      {/* Screening Date */}
      <Input
        className="md:col-span-2"
        label="Screening Date"
        required
        type="date"
        value={screeningDate || ''}
        onChange={(e) => onDateChange?.(e.target.value)}
        disabled={readOnly}
        error={error}
      />
    </div>
  )
}

export default ScreeningInfoSection
