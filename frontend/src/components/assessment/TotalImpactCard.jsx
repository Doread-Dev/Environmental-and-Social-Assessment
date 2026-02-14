/**
 * TotalImpactCard Component
 * بطاقة التأثير الإجمالي للمشروع
 */

import { cn } from '@/utils/cn'
import { IMPACT_LEVEL_CONFIG } from '@/contexts/LookupContext'

/**
 * @param {Object} props
 * @param {string} props.impact - مستوى التأثير
 */
export default function TotalImpactCard({ impact = 'negligible' }) {
  const config = IMPACT_LEVEL_CONFIG[impact] || IMPACT_LEVEL_CONFIG.negligible

  const impactLabels = {
    negligible: 'Negligible Risk',
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    not_applicable: 'Not Applicable',
  }

  const impactMessages = {
    negligible: 'Minimal environmental impact expected',
    low: 'Low environmental impact expected',
    medium: 'Moderate environmental impact expected',
    high: 'Requires immediate mitigation plan',
    not_applicable: 'Not applicable to this project',
  }

  const isHigh = impact === 'high'

  return (
    <div className="w-full lg:w-1/3 flex flex-col gap-4">
      <h3 className="text-sm font-bold text-text-secondary dark:text-white uppercase tracking-wider">
        Total Project Impact
      </h3>
      <div
        className={cn(
          'flex-1 flex items-center justify-center rounded-xl border-2 p-6 relative overflow-hidden group',
          isHigh
            ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500'
            : config.bgClass + ' border-current/30'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 transition-colors',
            isHigh
              ? 'bg-red-500/5 group-hover:bg-red-500/10'
              : 'bg-current/5 group-hover:bg-current/10'
          )}
        ></div>
        <div className="flex flex-col items-center text-center relative z-10">
          {isHigh && (
            <span
              className="material-symbols-outlined text-red-500 mb-2"
              style={{ fontSize: '40px' }}
            >
              warning
            </span>
          )}
          <h2 className={cn('text-3xl font-black uppercase tracking-tight', config.textClass)}>
            {impactLabels[impact] || 'Unknown'}
          </h2>
          <p className={cn('text-xs font-medium mt-1', config.textClass)}>
            {impactMessages[impact] || ''}
          </p>
        </div>
      </div>
    </div>
  )
}
