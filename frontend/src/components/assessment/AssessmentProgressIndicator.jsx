/**
 * AssessmentProgressIndicator Component
 * The four workflow steps (Screening → Assessment → SEMP → Monitoring), each marked from the
 * backend step status (D30): done (approved/completed), current, or still to come.
 */

import { cn } from '@/utils/cn'
import { WORKFLOW_STEP_ORDER, isStepDone } from '@/utils/workflowSteps'

const LABELS = {
  screening: 'Screening',
  assessment: 'Assessment',
  semp: 'SEMP',
  monitoring: 'Monitoring',
}

/**
 * @param {Object} props
 * @param {Object} props.workflow - Workflow state from the backend
 * @param {string} [props.currentStep] - The step of this page
 */
export default function AssessmentProgressIndicator({
  workflow,
  currentStep = 'assessment',
  className,
  ...props
}) {
  return (
    <nav
      aria-label="Workflow progress"
      className={cn(
        'flex items-center bg-surface dark:bg-surface-dark px-4 py-3 rounded-xl border border-border-default dark:border-border-dark shadow-sm w-fit max-w-full overflow-x-auto',
        className
      )}
      {...props}
    >
      <ol className="flex items-center gap-2">
        {WORKFLOW_STEP_ORDER.map((step, index) => {
          const isCompleted = isStepDone(workflow, step)
          const isCurrent = step === currentStep && !isCompleted
          const isPending = !isCompleted && !isCurrent

          return (
            <li
              key={step}
              className="flex items-center"
              aria-current={step === currentStep ? 'step' : undefined}
            >
              <div className={cn('flex items-center gap-2', isPending && 'opacity-50')}>
                {isCompleted ? (
                  <span
                    className="material-symbols-outlined text-primary text-lg"
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                ) : (
                  <span
                    className={cn(
                      'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold',
                      isCurrent
                        ? 'bg-primary text-white'
                        : 'bg-border-default dark:bg-white/10 text-text-secondary dark:text-gray-300'
                    )}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                )}
                <span
                  className={cn(
                    'text-xs font-semibold whitespace-nowrap',
                    isCompleted && 'text-text-main dark:text-white',
                    isCurrent && 'font-bold text-primary dark:text-green-300',
                    isPending && 'text-text-secondary dark:text-gray-400'
                  )}
                >
                  {LABELS[step]}
                  {isCompleted && <span className="sr-only"> (done)</span>}
                </span>
              </div>
              {index < WORKFLOW_STEP_ORDER.length - 1 && (
                <div
                  className="w-6 h-px bg-border-default dark:bg-border-dark mx-1"
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
