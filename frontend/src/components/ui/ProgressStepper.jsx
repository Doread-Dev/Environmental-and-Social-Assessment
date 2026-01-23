import { cn } from '@/utils/cn'

/**
 * Progress stepper for multi-step workflows
 *
 * @param {Object} props
 * @param {Array<{id: string, label: string, description?: string, icon?: string}>} props.steps
 * @param {number} props.currentStep - Current step index (0-based)
 * @param {'horizontal'|'vertical'} props.orientation
 * @param {Function} props.onStepClick - Step click handler (optional)
 *
 * @example
 * <ProgressStepper
 *   steps={[
 *     { id: 'screening', label: 'Screening', description: 'Risk assessment' },
 *     { id: 'assessment', label: 'Assessment', description: 'Impact evaluation' },
 *     { id: 'monitoring', label: 'Monitoring', description: 'Track progress' },
 *   ]}
 *   currentStep={1}
 * />
 */
function ProgressStepper({
  steps = [],
  currentStep = 0,
  orientation = 'horizontal',
  onStepClick,
  className,
  ...props
}) {
  const isHorizontal = orientation === 'horizontal'

  return (
    <div
      className={cn('flex', isHorizontal ? 'flex-row items-start' : 'flex-col', className)}
      {...props}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isClickable = onStepClick && (isCompleted || isCurrent)

        return (
          <div
            key={step.id}
            className={cn(
              'flex',
              isHorizontal ? 'flex-1 flex-col items-center' : 'flex-row items-start gap-4'
            )}
          >
            {/* Step indicator */}
            <div className={cn('flex items-center', isHorizontal ? 'w-full' : 'flex-col')}>
              {/* Line before */}
              {index > 0 && (
                <div
                  className={cn(
                    isHorizontal ? 'flex-1 h-0.5' : 'w-0.5 h-8 -mt-8',
                    isCompleted ? 'bg-primary' : 'bg-border-default dark:bg-border-dark'
                  )}
                />
              )}

              {/* Circle */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'relative flex items-center justify-center',
                  'w-10 h-10 rounded-full',
                  'border-2 transition-all duration-200',
                  'flex-shrink-0',
                  isCompleted && 'bg-primary border-primary text-white',
                  isCurrent && 'border-primary bg-primary/10 text-primary',
                  !isCompleted &&
                    !isCurrent &&
                    'border-border-default dark:border-border-dark text-text-muted',
                  isClickable && 'cursor-pointer hover:shadow-md',
                  !isClickable && 'cursor-default'
                )}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-xl">check</span>
                ) : step.icon ? (
                  <span className="material-symbols-outlined text-xl">{step.icon}</span>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </button>

              {/* Line after */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    isHorizontal ? 'flex-1 h-0.5' : 'w-0.5 h-8',
                    isCompleted ? 'bg-primary' : 'bg-border-default dark:bg-border-dark'
                  )}
                />
              )}
            </div>

            {/* Label and description */}
            <div
              className={cn(
                isHorizontal ? 'mt-3 text-center' : 'flex-1 pb-8',
                isHorizontal && index === steps.length - 1 && 'mr-0'
              )}
            >
              <p
                className={cn(
                  'text-sm font-medium',
                  isCurrent || isCompleted
                    ? 'text-text-main dark:text-white'
                    : 'text-text-muted dark:text-gray-500'
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ProgressStepper
