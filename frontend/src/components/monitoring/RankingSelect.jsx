/**
 * RankingSelect Component
 * Ranking select, built from impactLevels
 */

import { Select } from '@/components/ui'
import { IMPACT_LEVEL_CONFIG } from '@/utils/impactLevels'
import { RANKING_HELP } from '@/utils/rankingHelp'

/**
 * @param {Object} props
 * @param {string} props.value - Current value (negligible / low / medium / high / not_applicable, or '' = not picked)
 * @param {Function} props.onChange - (value) => void; null when the empty option is picked (D69)
 * @param {string} [props.categoryCode] - The question's category code
 * @param {number} [props.questionNumber] - Question number within the category
 * @param {boolean} [props.disabled] - Disabled
 * @param {string} [props.ariaLabel] - Accessible name (default "Ranking")
 * @param {string} [props.className] - Extra classes
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
