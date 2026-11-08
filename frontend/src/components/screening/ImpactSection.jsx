/**
 * ImpactSection Component
 * Potential impacts (section 3)
 *
 * Features:
 * - negative impacts text area with a warning icon
 * - positive impacts text area with a check_circle icon
 */

import { cn } from '@/utils/cn'
import { Textarea } from '@/components/ui'

/**
 * @param {Object} props
 * @param {string} props.negativeImpacts - Negative impacts
 * @param {string} props.positiveImpacts - Positive impacts
 * @param {Function} props.onNegativeChange - Called when the negative impacts change
 * @param {Function} props.onPositiveChange - Called when the positive impacts change
 * @param {boolean} props.readOnly - Read-only mode
 * @param {Object} props.errors - Error messages
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
