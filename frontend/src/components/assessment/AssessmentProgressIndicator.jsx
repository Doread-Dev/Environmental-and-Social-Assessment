/**
 * AssessmentProgressIndicator Component
 * مؤشر تقدم التقييم (Screening → Assessment → SEMP)
 */

import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {number} props.currentStep - الخطوة الحالية (1-3)
 * @param {boolean} props.screeningComplete - هل اكتمل الفرز
 */
export default function AssessmentProgressIndicator({
  currentStep = 2,
  screeningComplete = true,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'flex items-center bg-white dark:bg-surface-dark px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {/* Step 1: Screening */}
        <div className={cn('flex items-center gap-2', screeningComplete ? '' : 'opacity-60')}>
          <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
          <span className="text-xs font-semibold text-text-main dark:text-white hidden sm:block">
            Screening
          </span>
        </div>
        <div className="w-6 h-px bg-gray-200 dark:bg-gray-600 mx-1"></div>

        {/* Step 2: Assessment */}
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold">
            2
          </span>
          <span className="text-xs font-bold text-primary hidden sm:block">Assessment</span>
        </div>
        <div className="w-6 h-px bg-gray-200 dark:bg-gray-600 mx-1"></div>

        {/* Step 3: SEMP */}
        <div className="flex items-center gap-2 opacity-40">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 text-[10px] font-bold">
            3
          </span>
          <span className="text-xs font-semibold text-text-secondary hidden sm:block">SEMP</span>
        </div>
      </div>
    </div>
  )
}
