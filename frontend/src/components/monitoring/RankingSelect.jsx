/**
 * RankingSelect Component
 * قائمة اختيار Ranking تعتمد على impactLevels
 */

import { Select } from '@/components/ui'
import { IMPACT_LEVEL_CONFIG } from '@/utils/impactLevels'
import { RANKING_HELP } from '@/utils/rankingHelp'

/**
 * @param {Object} props
 * @param {string} props.value - القيمة الحالية (negligible/low/medium/high/not_applicable، أو '' = لم تُختر)
 * @param {Function} props.onChange - دالة التغيير (value) => void؛ null عند اختيار الخيار الفارغ (D69)
 * @param {string} [props.categoryCode] - كود الفئة للسؤال
 * @param {number} [props.questionNumber] - رقم السؤال داخل الفئة
 * @param {boolean} [props.disabled] - معطل
 * @param {string} [props.ariaLabel] - Accessible name (default "Ranking")
 * @param {string} [props.className] - classes إضافية
 */
function RankingSelect({
  value,
  onChange,
  categoryCode,
  questionNumber,
  disabled = false,
  ariaLabel,
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
    <Select
      aria-label={ariaLabel || 'Ranking'}
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      placeholder="Select ranking"
      size="sm"
      className={className}
      selectClassName="font-medium"
    >
      {levels.map((level) => {
        const helpText = getHelpText(level.key)
        return (
          <option key={level.key} value={level.key}>
            {helpText ? `${level.label} (${helpText})` : level.label}
          </option>
        )
      })}
    </Select>
  )
}

export default RankingSelect
