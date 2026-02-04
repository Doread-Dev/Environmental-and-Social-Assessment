/**
 * MonitoringCategoryCard Component
 * بطاقة تلخيص فئة المراقبة
 */

import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {string} props.code - كود الفئة (A,B,C,...)
 * @param {string} props.name - اسم الفئة
 * @param {string} [props.rankingKey] - مستوى التصنيف (low/medium/high/etc.)
 * @param {string} [props.rankingLabel] - نص التصنيف المعروض
 */
function MonitoringCategoryCard({
  code,
  name,
  rankingKey = 'not_applicable',
  rankingLabel = 'N/A',
}) {
  const rankingConfig = {
    high: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-800 dark:text-red-300',
      dot: 'bg-red-500',
    },
    medium: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-800 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    low: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-800 dark:text-green-300',
      dot: 'bg-green-500',
    },
    negligible: {
      bg: 'bg-gray-100 dark:bg-white/5',
      text: 'text-gray-700 dark:text-gray-400',
      dot: 'bg-gray-400',
    },
    not_applicable: {
      bg: 'bg-gray-100 dark:bg-white/5',
      text: 'text-gray-700 dark:text-gray-400',
      dot: 'bg-gray-400',
    },
  }

  const currentStatus = rankingConfig[rankingKey] || rankingConfig.not_applicable
  const isInactive = rankingKey === 'not_applicable'
  const iconMap = {
    A: 'air',
    B: 'water_drop',
    C: 'graphic_eq',
    D: 'recycling',
    E: 'speed',
    F: 'science',
    J: 'forest',
    H: 'landscape',
  }
  const icon = iconMap[code] || 'analytics'
  return (
    <div
      className={cn(
        'flex flex-col justify-between p-5 rounded-xl border border-border-default dark:border-border-dark transition-shadow h-full',
        isInactive
          ? 'bg-gray-50/50 dark:bg-background-dark opacity-75'
          : 'bg-white dark:bg-[#152a1d]'
      )}
    >
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              'p-2 rounded-lg',
              isInactive
                ? 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                : 'bg-primary/10 text-primary'
            )}
          >
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <h4
            className={cn(
              'text-base font-bold',
              isInactive ? 'text-gray-600 dark:text-gray-300' : 'text-text-main dark:text-white'
            )}
          >
            {name}
          </h4>
        </div>
        <div className="mb-6" />
      </div>
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', currentStatus.bg, currentStatus.text)}>
        <span className={cn('h-2 w-2 rounded-full', currentStatus.dot)} />
        <span className="text-xs font-bold">{rankingLabel}</span>
      </div>
    </div>
  )
}

export default MonitoringCategoryCard
