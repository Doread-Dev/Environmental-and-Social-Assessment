/**
 * ImpactCategoryAccordion Component
 * Accordion قابل للطي لفئة التأثير
 */

import { useState, useMemo } from 'react'
import { cn } from '@/utils/cn'
import { IMPACT_LEVELS, IMPACT_LEVEL_CONFIG } from '@/data/impactQuestions'
import ImpactScoreRow from './ImpactScoreRow'

/**
 * حساب نتيجة الفئة
 */
function calculateCategoryScore(scores, categoryQuestions) {
  const score = {
    negligible: 0,
    low: 0,
    medium: 0,
    high: 0,
    not_applicable: 0,
  }

  // التحقق من أن categoryQuestions موجود وأنه array
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
 * الحصول على أعلى مستوى في الفئة
 * ⚠️ الخوارزمية متوافقة مع backend/documents/Overview.md
 * 
 * القاعدة: المستوى الذي له أعلى عدد هو التأثير الإجمالي
 * في حالة التعادل: الأولوية high > medium > low > negligible
 * not_applicable: فقط إذا كانت كل المستويات الأخرى = 0
 */
function getCategoryHighestLevel(score) {
  // المستويات المرتبة حسب الأولوية (من الأعلى إلى الأدنى)
  const levelsToCheck = ['high', 'medium', 'low', 'negligible']
  
  // البحث عن أعلى عدد
  let maxCount = -1
  levelsToCheck.forEach((level) => {
    if (score[level] > maxCount) {
      maxCount = score[level]
    }
  })
  
  // إذا كانت كل المستويات = 0
  if (maxCount === 0) {
    return score.not_applicable > 0 ? 'not_applicable' : 'negligible'
  }
  
  // في حالة التعادل، اختر الأعلى حسب الأولوية (high > medium > low > negligible)
  // نبحث بالترتيب من high إلى negligible ونأخذ أول مستوى له نفس maxCount
  for (const level of levelsToCheck) {
    if (score[level] === maxCount) {
      return level
    }
  }
  
  return 'negligible'
}

/**
 * @param {Object} props
 * @param {Object} props.category - بيانات الفئة
 * @param {Array} props.scores - نتائج الأسئلة
 * @param {Function} props.onScoreChange - callback للتغيير
 * @param {Function} props.onNoteChange - callback للملاحظة
 * @param {boolean} props.defaultOpen - مفتوح بشكل افتراضي
 * @param {boolean} props.readOnly - وضع القراءة فقط
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

  // حساب نتيجة الفئة
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

  const highestLevel = getCategoryHighestLevel(categoryScore)
  const highestConfig = highestLevel
    ? IMPACT_LEVEL_CONFIG[highestLevel]
    : null

  // حساب النص للـ Badge
  const scoreText = useMemo(() => {
    if (!highestLevel) return 'Score: Pending'
    const count = categoryScore[highestLevel]
    return `Score: ${count} ${highestConfig.label} Risk`
  }, [categoryScore, highestLevel, highestConfig])

  return (
    <details
      className="group bg-white dark:bg-slate-900 rounded-xl border border-[#dbe6df] dark:border-slate-700 shadow-sm overflow-hidden"
      open={isOpen}
      onToggle={(e) => setIsOpen(e.target.open)}
    >
      {/* Summary Header */}
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors select-none sticky top-0 z-10 border-b border-transparent group-open:border-[#dbe6df] dark:group-open:border-slate-700">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex items-center justify-center size-8 rounded-full',
              category.iconBg
            )}
          >
            <span
              className={cn('material-symbols-outlined text-[20px]', category.iconColor)}
            >
              {category.icon}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {category.code}. {category.name}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded border',
              highestConfig
                ? `${highestConfig.bgClass} ${highestConfig.textClass} border-current/20`
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            )}
          >
            {scoreText}
          </span>
          <span className="material-symbols-outlined text-slate-400 transition-transform duration-300 group-open:rotate-180">
            expand_more
          </span>
        </div>
      </summary>

      {/* Content */}
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white">
            <tr>
              <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider w-[35%] border-b border-[#dbe6df] dark:border-slate-700">
                Assessment Question
              </th>
              <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-center w-[15%] border-b border-[#dbe6df] dark:border-slate-700">
                Impact Rating
              </th>
              <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider w-[50%] border-b border-[#dbe6df] dark:border-slate-700">
                Notes / Mitigation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dbe6df] dark:divide-slate-700">
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
          <tfoot className="bg-slate-50 dark:bg-slate-800 border-t border-[#dbe6df] dark:border-slate-700">
            <tr>
              <td className="py-3 px-6" colSpan="3">
                <div className="flex items-center justify-end gap-6 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Category Score:
                  </span>
                  <div className="flex gap-4">
                    {Object.values(IMPACT_LEVELS).map((level) => {
                      const config = IMPACT_LEVEL_CONFIG[level]
                      const count = categoryScore[level] || 0
                      return (
                        <span
                          key={level}
                          className={cn(
                            'flex items-center gap-2 font-medium',
                            count > 0 ? config.textClass : 'text-slate-500 dark:text-slate-400',
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
