/**
 * ImpactSummarySection Component
 * قسم ملخص التأثيرات (Negative/Positive)
 */

import { Textarea } from '@/components/ui'

/**
 * @param {Object} props
 * @param {string} props.negativeImpact - التأثيرات السلبية
 * @param {string} props.positiveImpact - التأثيرات الإيجابية
 * @param {Function} props.onNegativeChange - callback للسلبية
 * @param {Function} props.onPositiveChange - callback للإيجابية
 * @param {boolean} props.readOnly - وضع القراءة فقط
 * @param {Object} props.errors - رسائل الخطأ
 */
export default function ImpactSummarySection({
  negativeImpact = '',
  positiveImpact = '',
  onNegativeChange,
  onPositiveChange,
  readOnly = false,
  errors = {}
}) {
  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-default dark:border-border-dark shadow-sm p-6 flex flex-col gap-6">
      <div className="flex items-center gap-2 border-b border-border-default dark:border-border-dark pb-4">
        <span className="material-symbols-outlined text-text-secondary">balance</span>
        <h3 className="text-lg font-bold text-text-main dark:text-white">
          Potential Impacts Summary
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Negative Impact */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">remove_circle</span>
            Potential Negative Impact {!readOnly && <span className="text-red-500">*</span>}
          </label>
          {readOnly ? (
            <p className="text-sm text-text-secondary dark:text-gray-400 whitespace-pre-wrap min-h-[120px] p-4 bg-gray-50/50 dark:bg-white/5 rounded-lg">
              {negativeImpact || '-'}
            </p>
          ) : (
            <Textarea
              value={negativeImpact}
              onChange={(e) => onNegativeChange?.(e.target.value)}
              placeholder="Describe the potential negative consequences of the project..."
              rows={5}
              className="min-h-[120px]"
              error={errors.negativeImpact}
            />
          )}
        </div>

        {/* Positive Impact */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Potential Positive Impact {!readOnly && <span className="text-red-500">*</span>}
          </label>
          {readOnly ? (
            <p className="text-sm text-text-secondary dark:text-gray-400 whitespace-pre-wrap min-h-[120px] p-4 bg-gray-50/50 dark:bg-white/5 rounded-lg">
              {positiveImpact || '-'}
            </p>
          ) : (
            <Textarea
              value={positiveImpact}
              onChange={(e) => onPositiveChange?.(e.target.value)}
              placeholder="Describe the expected positive outcomes and benefits..."
              rows={5}
              className="min-h-[120px]"
              error={errors.positiveImpact}
            />
          )}
        </div>
      </div>
    </div>
  )
}
