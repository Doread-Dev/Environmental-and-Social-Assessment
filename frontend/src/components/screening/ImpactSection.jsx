/**
 * ImpactSection Component
 * قسم التأثيرات المحتملة (القسم 3)
 * مطابق للتصميم الأصلي حرفياً
 * 
 * Features:
 * - Textarea للتأثيرات السلبية مع أيقونة warning
 * - Textarea للتأثيرات الإيجابية مع أيقونة check_circle
 */

import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {string} props.negativeImpacts - التأثيرات السلبية
 * @param {string} props.positiveImpacts - التأثيرات الإيجابية
 * @param {Function} props.onNegativeChange - callback للتأثيرات السلبية
 * @param {Function} props.onPositiveChange - callback للتأثيرات الإيجابية
 * @param {boolean} props.readOnly - وضع القراءة فقط
 * @param {Object} props.errors - رسائل الخطأ
 */
function ImpactSection({
  negativeImpacts,
  positiveImpacts,
  onNegativeChange,
  onPositiveChange,
  readOnly = false,
  errors = {},
  className,
  ...props
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-6', className)} {...props}>
      {/* Negative Impacts */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-main dark:text-gray-200 mb-2">
          <span className="material-symbols-outlined text-orange-500 text-lg">warning</span>
          Potential Negative Impacts
          <span className="text-red-500">*</span>
        </label>
        <textarea
          className={cn(
            'w-full rounded-lg border',
            'bg-white dark:bg-[#102216]',
            'text-text-main dark:text-white',
            'focus:ring-primary focus:border-primary',
            'px-3 py-2.5 text-sm',
            readOnly && 'cursor-not-allowed opacity-50',
            errors.potentialNegative
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-border-default dark:border-border-dark'
          )}
          placeholder="Describe any potential adverse effects on the environment..."
          rows={4}
          value={negativeImpacts || ''}
          onChange={(e) => onNegativeChange?.(e.target.value)}
          disabled={readOnly}
        />
        {errors.potentialNegative && (
          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">error</span>
            {errors.potentialNegative}
          </p>
        )}
      </div>

      {/* Positive Impacts */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-main dark:text-gray-200 mb-2">
          <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
          Potential Positive Impacts
          <span className="text-red-500">*</span>
        </label>
        <textarea
          className={cn(
            'w-full rounded-lg border',
            'bg-white dark:bg-[#102216]',
            'text-text-main dark:text-white',
            'focus:ring-primary focus:border-primary',
            'px-3 py-2.5 text-sm',
            readOnly && 'cursor-not-allowed opacity-50',
            errors.potentialPositive
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-border-default dark:border-border-dark'
          )}
          placeholder="Describe any expected environmental benefits..."
          rows={4}
          value={positiveImpacts || ''}
          onChange={(e) => onPositiveChange?.(e.target.value)}
          disabled={readOnly}
        />
        {errors.potentialPositive && (
          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">error</span>
            {errors.potentialPositive}
          </p>
        )}
      </div>
    </div>
  )
}

export default ImpactSection
