/**
 * AssessmentProgressIndicator Component
 * مؤشر تقدم التقييم (Screening → Assessment → SEMP)
 */

import { cn } from '@/utils/cn'

const STEPS = [
  { id: 1, label: 'Screening', icon: 'fact_check' },
  { id: 2, label: 'Assessment', icon: 'assignment' },
  { id: 3, label: 'SEMP', icon: 'task_alt' }
]

/**
 * @param {Object} props
 * @param {number} props.currentStep - الخطوة الحالية (1-3)
 * @param {boolean} props.screeningComplete - هل اكتمل الفرز
 * @param {boolean} props.assessmentComplete - هل اكتمل التقييم
 */
export default function AssessmentProgressIndicator({
  currentStep = 2,
  screeningComplete = true,
  assessmentComplete = false,
  className,
  ...props
}) {
  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'pending'
  }

  return (
    <div
      className={cn(
        'flex items-center bg-white dark:bg-surface-dark px-4 py-3 rounded-xl border border-border-default dark:border-border-dark shadow-sm',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.id)
          const isCompleted = status === 'completed' || (step.id === 1 && screeningComplete) || (step.id === 2 && assessmentComplete)
          const isCurrent = status === 'current'
          const isPending = status === 'pending' && !isCompleted

          return (
            <div key={step.id} className="flex items-center">
              {/* Step */}
              <div className={cn('flex items-center gap-2', isPending && 'opacity-40')}>
                {isCompleted ? (
                  <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                ) : isCurrent ? (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold">
                    {step.id}
                  </span>
                ) : (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-white/5 text-gray-500 text-[10px] font-bold">
                    {step.id}
                  </span>
                )}
                <span
                  className={cn(
                    'text-xs font-semibold hidden sm:block',
                    isCompleted && 'text-text-main dark:text-white',
                    isCurrent && 'font-bold text-primary',
                    isPending && 'text-text-secondary'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {/* Connector */}
              {index < STEPS.length - 1 && (
                <div className="w-6 h-px bg-border-default dark:bg-border-dark mx-1"></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

