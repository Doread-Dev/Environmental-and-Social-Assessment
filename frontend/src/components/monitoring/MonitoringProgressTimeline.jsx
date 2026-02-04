/**
 * MonitoringProgressTimeline Component
 * شريط زمني للأرباع السنوية
 */

import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {Object} props.completedQuarters - الأرباع المكتملة {baseline: boolean, Q1: boolean, ...}
 * @param {string} [props.currentQuarter] - الربع الحالي
 * @param {boolean} [props.embedded] - يستخدم داخل كارت بدون غلاف
 */
function MonitoringProgressTimeline({
  completedQuarters = {},
  currentQuarter = 'Q1',
  embedded = false,
}) {
  const quarters = [
    { key: 'baseline', label: 'Baseline', icon: 'flag' },
    { key: 'Q1', label: 'Quarter 1', icon: 'looks_one' },
    { key: 'Q2', label: 'Quarter 2', icon: 'looks_two' },
    { key: 'Q3', label: 'Quarter 3', icon: 'looks_3' },
    { key: 'Q4', label: 'Quarter 4', icon: 'looks_4' },
  ]

  return (
    <div
      className={cn(
        embedded
          ? 'pt-2'
          : 'bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-border-dark p-6'
      )}
    >
      {!embedded && (
        <h3 className="font-bold text-base text-text-main dark:text-white mb-6">
          Monitoring Timeline
        </h3>
      )}

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute top-6 left-0 right-0 w-full h-0.5 bg-border-default dark:bg-border-dark" />

        {/* Progress Line */}
        <div
          className="absolute top-6 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{
            width: `${(Object.values(completedQuarters).filter(Boolean).length / quarters.length) * 100}%`,
          }}
        />

        {/* Quarters */}
        <div className="relative flex justify-around">
          {quarters.map((quarter, index) => {
            const isCompleted = completedQuarters[quarter.key]
            const isCurrent = currentQuarter === quarter.key
            const isPast = index < quarters.findIndex((q) => q.key === currentQuarter)

            return (
              <div key={quarter.key} className="flex flex-col items-center gap-2">
                {/* Icon */}
                <div
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all',
                    isCompleted 
                      ? 'bg-primary border-primary text-white'
                     : isCurrent
                      ?
                      'bg-info border-info text-white'
                      : 'bg-surface dark:bg-surface-dark border-border-default dark:border-border-dark text-text-secondary dark:text-gray-500'
                  )}
                >
                  <span className="flex items-center justify-center material-symbols-outlined text-xl">
                    {isCompleted ? 'check ' : quarter.icon}
                  </span>
                </div>

                {/* Label */}
                <div className="text-center">
                  <p
                    className={cn(
                      'text-xs font-bold',
                      isCompleted 
                        ? 'text-primary'
                        : isCurrent
                        ? 'text-info'
                        : 'text-text-secondary dark:text-gray-400'
                    )}
                  >
                    {quarter.label}
                  </p>
              
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MonitoringProgressTimeline
