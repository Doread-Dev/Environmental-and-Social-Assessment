/**
 * ImpactScoreRow Component
 * صف تقييم تأثير واحد
 */

import { cn } from '@/utils/cn'
import { IMPACT_LEVELS, IMPACT_LEVEL_CONFIG } from '@/data/impactQuestions'
import { Select, Textarea } from '@/components/ui'

/**
 * @param {Object} props
 * @param {Object} props.question - السؤال
 * @param {Object} props.score - النتيجة الحالية
 * @param {Function} props.onScoreChange - callback للتغيير
 * @param {Function} props.onNoteChange - callback للملاحظة
 * @param {boolean} props.readOnly - وضع القراءة فقط
 */
export default function ImpactScoreRow({
  question,
  score,
  onScoreChange,
  onNoteChange,
  readOnly = false,
}) {
  const currentLevel = score?.level || ''

  const handleLevelChange = (value) => {
    onScoreChange?.(question.id, value)
  }

  const handleNoteChange = (value) => {
    onNoteChange?.(question.id, value)
  }

  const levelOptions = [
    { value: '', label: 'Select...' },
    { value: IMPACT_LEVELS.NEGLIGIBLE, label: 'Negligible' },
    { value: IMPACT_LEVELS.LOW, label: 'Low' },
    { value: IMPACT_LEVELS.MEDIUM, label: 'Medium' },
    { value: IMPACT_LEVELS.HIGH, label: 'High' },
    { value: IMPACT_LEVELS.NOT_APPLICABLE, label: 'N/A' },
  ]

  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
      {/* Question */}
      <td className="py-4 px-6">
        <p className="text-sm text-text-main dark:text-white">{question.question}</p>
      </td>

      {/* Impact Rating */}
      <td className="py-4 px-6 text-center">
        {readOnly ? (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
              currentLevel && IMPACT_LEVEL_CONFIG[currentLevel]
                ? `${IMPACT_LEVEL_CONFIG[currentLevel].bgClass} ${IMPACT_LEVEL_CONFIG[currentLevel].textClass}`
                : 'bg-gray-100 dark:bg-white/5 text-text-secondary dark:text-gray-400'
            )}
          >
            {currentLevel ? IMPACT_LEVEL_CONFIG[currentLevel].label : 'Not Set'}
          </span>
        ) : (
          <Select
            value={currentLevel}
            onChange={(e) => handleLevelChange(e.target.value)}
            options={levelOptions}
            className="min-w-[120px]"
          />
        )}
      </td>

      {/* Notes */}
      <td className="py-4 px-6">
        {readOnly ? (
          <p className="text-sm text-text-secondary dark:text-gray-400">{score?.note || '-'}</p>
        ) : (
          <Textarea
            value={score?.note || ''}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Add notes or mitigation measures..."
            rows={2}
            className="text-sm"
          />
        )}
      </td>
    </tr>
  )
}
