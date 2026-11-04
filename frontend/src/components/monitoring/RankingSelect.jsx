/**
 * RankingSelect Component
 * قائمة اختيار Ranking تعتمد على impactLevels
 */

import { cn } from '@/utils/cn'
import { IMPACT_LEVEL_CONFIG } from '@/utils/impactLevels'
import { RANKING_HELP } from '@/utils/rankingHelp'

/**
 * @param {Object} props
 * @param {string} props.value - القيمة الحالية (negligible/low/medium/high/not_applicable، أو '' = لم تُختر)
 * @param {Function} props.onChange - دالة التغيير (value) => void؛ null عند اختيار الخيار الفارغ (D69)
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
  const levelKeys = ['not_applicable', 'negligible', 'low', 'medium', 'high']
  const levels = levelKeys
    .map((key) => IMPACT_LEVEL_CONFIG[key] && { ...IMPACT_LEVEL_CONFIG[key], key })
    .filter(Boolean)

  const getHelpText = (levelKey) => {
    if (!categoryCode || !questionNumber) return ''
    return RANKING_HELP[categoryCode]?.[questionNumber]?.[levelKey] || ''
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      className={cn(
        'w-full rounded-lg border border-border-default dark:border-border-dark',
        'bg-white dark:bg-background-dark text-text-main dark:text-white',
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
        'px-3 py-2 text-sm font-medium',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50/50 dark:disabled:bg-white/5',
        className
      )}
    >
      <option value="">Select ranking</option>
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
