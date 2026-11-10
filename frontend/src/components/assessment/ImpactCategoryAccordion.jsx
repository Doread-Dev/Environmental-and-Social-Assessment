/**
 * ImpactCategoryAccordion Component
 * Collapsible section of one impact category
 */

import { useState, useMemo } from 'react'
import { cn } from '@/utils/cn'
import { calculateTotalImpact } from '@/utils/impactCalculations'
import { IMPACT_LEVELS, IMPACT_LEVEL_CONFIG } from '@/utils/impactLevels'
import ImpactScoreRow from './ImpactScoreRow'

/**
 * The category's result
 */
function calculateCategoryScore(scores, categoryQuestions) {
  const score = {
    negligible: 0,
    low: 0,
    medium: 0,
    high: 0,
    not_applicable: 0,
  }

  // categoryQuestions may be missing or not an array
  if (!categoryQuestions || !Array.isArray(categoryQuestions)) {
    return score
  }

  categoryQuestions.forEach((q) => {
    const questionScore = scores.find((s) => s.question === q.id)
    if (questionScore?.level && score[questionScore.level] !== undefined) {
      score[questionScore.level]++
    }
  })

  return score
}

/**
 * @param {Object} props
 * @param {Object} props.category - The category
 * @param {Array} props.scores - The question scores
 * @param {Function} props.onScoreChange - Called when a level changes
 * @param {Function} props.onNoteChange - Called when a note changes
 * @param {boolean} props.defaultOpen - Open at first
 * @param {boolean} props.readOnly - Read-only mode
 */
export default function ImpactCategoryAccordion({
  category,
  scores = [],
  onScoreChange,
  onNoteChange,
  defaultOpen = false,
  readOnly = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const categoryScore = useMemo(() => {
    if (!category || !category.questions || !Array.isArray(category.questions)) {
      return {
        negligible: 0,
        low: 0,
        medium: 0,
        high: 0,
        not_applicable: 0,
      }
    }
    return calculateCategoryScore(scores, category.questions)
  }, [scores, category])

  const highestLevel = calculateTotalImpact(categoryScore)
  const highestConfig = highestLevel ? IMPACT_LEVEL_CONFIG[highestLevel] : null

  // Badge text
  const scoreText = useMemo(() => {
    if (!highestLevel) return 'Score: Pending'
    const count = categoryScore[highestLevel]
    return `Score: ${count} ${highestConfig.label} Risk`
  }, [categoryScore, highestLevel, highestConfig])

  return (
    <details
      className="group bg-surface dark:bg-surface-dark rounded-xl border border-border-default dark:border-border-dark shadow-sm overflow-hidden"
      open={isOpen}
      onToggle={(e) => setIsOpen(e.target.open)}
    >
      {/* Summary Header */}
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 bg-surface dark:bg-surface-dark hover:bg-background dark:hover:bg-white/5 transition-colors select-none sticky top-0 z-10 border-b border-transparent group-open:border-border-default dark:group-open:border-border-dark">
        <div className="flex items-center gap-4">
          <div
            className={cn('flex items-center justify-center size-8 rounded-full', category.iconBg)}
          >
            <span
              className={cn('material-symbols-outlined text-[20px]', category.iconColor)}
              aria-hidden="true"
            >
              {category.icon}
            </span>
          </div>
          <h3 className="text-lg font-bold text-text-main dark:text-white">
            {category.code}. {category.name}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded border',
              highestConfig
                ? `${highestConfig.bgClass} ${highestConfig.textClass} border-current/20`
                : 'bg-background dark:bg-white/5 text-text-secondary dark:text-white border-border-default dark:border-border-dark'
            )}
          >
            {scoreText}
          </span>
          <span
            className="material-symbols-outlined text-text-secondary transition-transform duration-300 group-open:rotate-180"
            aria-hidden="true"
          >
            expand_more
          </span>
        </div>
      </summary>

      {/* Content */}
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-background dark:bg-white/5 text-text-main dark:text-white">
            <tr>
              <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider w-[35%] border-b border-border-default dark:border-border-dark">
                Assessment Question
              </th>
              <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-center w-[15%] border-b border-border-default dark:border-border-dark">
                Impact Rating
              </th>
              <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider w-[50%] border-b border-border-default dark:border-border-dark">
                Notes / Mitigation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default dark:divide-border-dark">
            {category?.questions && Array.isArray(category.questions) ? (
              category.questions.map((question) => {
                const questionScore = scores.find((s) => s.question === question.id)
                return (
                  <ImpactScoreRow
                    key={question.id}
                    question={question}
                    score={questionScore}
                    onScoreChange={onScoreChange}
                    onNoteChange={onNoteChange}
                    readOnly={readOnly}
                  />
                )
              })
            ) : (
              <tr>
                <td colSpan="3" className="py-4 px-6 text-center text-text-secondary">
                  No questions available for this category
                </td>
              </tr>
            )}
          </tbody>
          {/* Footer with Category Score */}
          <tfoot className="bg-background dark:bg-white/5 border-t border-border-default dark:border-border-dark">
            <tr>
              <td className="py-3 px-6" colSpan="3">
                <div className="flex items-center justify-end gap-6 text-sm">
                  <span className="text-text-secondary dark:text-gray-400">Category Score:</span>
                  <div className="flex gap-4">
                    {Object.values(IMPACT_LEVELS).map((level) => {
                      const config = IMPACT_LEVEL_CONFIG[level]
                      const count = categoryScore[level] || 0
                      return (
                        <span
                          key={level}
                          className={cn(
                            'flex items-center gap-2 font-medium',
                            count > 0 ? config.textClass : 'text-text-secondary dark:text-gray-400',
                            count > 0 && 'font-bold'
                          )}
                        >
                          <span className={cn('size-2 rounded-full', config.dotClass)}></span>
                          {count} {config.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </details>
  )
}
