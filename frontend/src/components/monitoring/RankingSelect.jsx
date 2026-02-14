/**
 * RankingSelect Component
 * قائمة اختيار Ranking تعتمد على impactLevels
 */

import { cn } from '@/utils/cn'
import { impactLevels } from '@/data/impactCategories'
import { RANKING_HELP } from '@/data/rankingHelp'

/**
 * @param {Object} props
 * @param {string} props.value - القيمة الحالية (negligible/low/medium/high/not_applicable)
 * @param {Function} props.onChange - دالة التغيير (value) => void
 * @param {string} [props.categoryCode] - كود الفئة للسؤال
 * @param {number} [props.questionNumber] - رقم السؤال داخل الفئة
 * @param {boolean} [props.disabled] - معطل
 * @param {string} [props.className] - classes إضافية
 */
function RankingSelect({
  value,
  onChange,
  categoryCode,
  questionNumber,
  disabled = false,
  className,
}) {
  const levels = [
    impactLevels.not_applicable,
    impactLevels.negligible,
    impactLevels.low,
    impactLevels.medium,
    impactLevels.high,
  ]

  const getHelpText = (levelKey) => {
    if (!categoryCode || !questionNumber) return ''
    return RANKING_HELP[categoryCode]?.[questionNumber]?.[levelKey] || ''
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full rounded-lg border border-border-default dark:border-border-dark',
        'bg-white dark:bg-[#102216] text-text-main dark:text-white',
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
        'px-3 py-2 text-sm font-medium',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50/50 dark:disabled:bg-white/5',
        className
      )}
    >
      {levels.map((level) => {
        const helpText = getHelpText(level.key)
        return (
          <option key={level.key} value={level.key}>
            {helpText ? `${level.label} (${helpText})` : level.label}
          </option>
        )
      })}
    </select>
  )
}

export default RankingSelect
