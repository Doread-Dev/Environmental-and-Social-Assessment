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
import { Textarea } from '@/components/ui'

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
      <Textarea
        label={
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500 text-lg" aria-hidden="true">
              warning
            </span>
            Potential Negative Impacts
          </span>
        }
        required
        placeholder="Describe any potential adverse effects on the environment..."
        rows={4}
        value={negativeImpacts || ''}
        onChange={(e) => onNegativeChange?.(e.target.value)}
        disabled={readOnly}
        error={errors.potentialNegative}
      />

      {/* Positive Impacts */}
      <Textarea
        label={
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-green-500 text-lg" aria-hidden="true">
              check_circle
            </span>
            Potential Positive Impacts
          </span>
        }
        required
        placeholder="Describe any expected environmental benefits..."
        rows={4}
        value={positiveImpacts || ''}
        onChange={(e) => onPositiveChange?.(e.target.value)}
        disabled={readOnly}
        error={errors.potentialPositive}
      />
    </div>
  )
}

export default ImpactSection
