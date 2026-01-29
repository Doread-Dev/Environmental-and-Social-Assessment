/**
 * TotalScoreCard Component
 * بطاقة النتيجة الإجمالية للمشروع
 */

import { cn } from '@/utils/cn'
import { IMPACT_LEVELS, IMPACT_LEVEL_CONFIG } from '@/data/impactQuestions'

/**
 * @param {Object} props
 * @param {Object} props.scores - إجمالي النتائج
 */
export default function TotalScoreCard({ scores = {} }) {
  const scoreItems = [
    {
      level: IMPACT_LEVELS.NEGLIGIBLE,
      count: scores.negligible || 0,
      label: 'Negligible'
    },
    {
      level: IMPACT_LEVELS.LOW,
      count: scores.low || 0,
      label: 'Low'
    },
    {
      level: IMPACT_LEVELS.MEDIUM,
      count: scores.medium || 0,
      label: 'Medium'
    },
    {
      level: IMPACT_LEVELS.HIGH,
      count: scores.high || 0,
      label: 'High'
    },
    {
      level: IMPACT_LEVELS.NOT_APPLICABLE,
      count: scores.not_applicable || 0,
      label: 'N/A'
    }
  ]

  return (
    <div className="flex-1 flex flex-col gap-4">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Total Project Score
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 h-full">
        {scoreItems.map((item) => {
          const config = IMPACT_LEVEL_CONFIG[item.level]
          const isHighlighted = item.count > 0

          return (
            <div
              key={item.level}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-lg border',
                isHighlighted
                  ? item.level === IMPACT_LEVELS.LOW
                    ? 'bg-primary/5 border-primary/20'
                    : item.level === IMPACT_LEVELS.MEDIUM
                    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
                    : item.level === IMPACT_LEVELS.HIGH
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'
              )}
            >
              <span
                className={cn(
                  'text-2xl font-bold',
                  isHighlighted && config ? config.textClass : 'text-slate-400'
                )}
              >
                {item.count}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase mt-1">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
