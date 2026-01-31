/**
 * RiskCategorySelector Component
 * محدد فئة الخطر (القسم 2)
 * مطابق للتصميم الأصلي حرفياً
 * 
 * Features:
 * - Radio buttons للفئات (A-F) مع تصميم خاص
 * - Textarea للتبرير في box منفصل
 * - Validation
 */

import { screeningCategories } from '@/data'
import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {string} props.selectedCategory - الفئة المختارة
 * @param {Function} props.onCategoryChange - callback عند تغيير الفئة
 * @param {string} props.justification - تبرير الاختيار
 * @param {Function} props.onJustificationChange - callback عند تغيير التبرير
 * @param {boolean} props.readOnly - وضع القراءة فقط
 * @param {Object} props.error - رسائل الخطأ
 */
function RiskCategorySelector({
  selectedCategory,
  onCategoryChange,
  justification,
  onJustificationChange,
  readOnly = false,
  error = {},
  className,
  ...props
}) {
  const categories = Object.values(screeningCategories)

  return (
    <div className={cn('', className)} {...props}>
      {/* Category Selection */}
      <div>
        <p className="text-sm text-text-secondary mb-4">
          Indicate the category of environmental risk for this project. Select one.
        </p>

        <div className="space-y-3 mb-6">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.code
            return (
              <label
                key={category.code}
                className={cn(
                  'relative flex items-start p-4 cursor-pointer rounded-lg',
                  'border border-border-default dark:border-border-dark',
                  'hover:bg-gray-50 dark:hover:bg-[#1a3322]',
                  'transition-all',
                  'has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-1 has-[:checked]:ring-primary',
                  readOnly && 'cursor-not-allowed opacity-50'
                )}
              >
                <div className="flex h-6 items-center">
                  <input
                    className="h-4 w-4 border-border-default dark:border-border-dark text-primary focus:ring-primary accent-primary"
                    name="risk-category"
                    type="radio"
                    value={category.code}
                    checked={isSelected}
                    onChange={(e) => onCategoryChange?.(e.target.value)}
                    disabled={readOnly}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <span className="font-bold text-text-main dark:text-white">
                    Category {category.code}
                  </span>
                  <span className="text-text-secondary ml-1">- {category.label}</span>
                </div>
              </label>
            )
          })}
        </div>

        {error.categoryCode && (
          <p className="text-sm text-red-500 mb-4 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">error</span>
            {error.categoryCode}
          </p>
        )}
      </div>

      {/* Justification Box - مطابق للتصميم الأصلي */}
      {selectedCategory && (
        <div className="mt-6 p-4 bg-gray-50/50 dark:bg-white/5 rounded-lg border border-dashed border-border-default dark:border-border-dark">
          <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
            Category Justification <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-text-secondary mb-3">
            Explain why you selected{' '}
            <span className="font-bold text-primary">Category {selectedCategory}</span>. Be specific
            about the context.
          </p>
          <textarea
            className={cn(
              'w-full rounded-lg border border-border-default dark:border-border-dark',
              'bg-white dark:bg-[#102216]',
              'text-text-main dark:text-white',
              'focus:ring-primary focus:border-primary',
              'px-3 py-2.5 text-sm',
              error.categoryReason && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              readOnly && 'cursor-not-allowed opacity-50'
            )}
            placeholder="Provide justification..."
            rows={3}
            value={justification || ''}
            onChange={(e) => onJustificationChange?.(e.target.value)}
            disabled={readOnly}
          />
          {error.categoryReason && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-base">error</span>
              {error.categoryReason}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default RiskCategorySelector
