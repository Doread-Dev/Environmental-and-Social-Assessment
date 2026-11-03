import { cn } from '@/utils'
import { workflowStepStatuses } from '@/utils/workflowStatuses'

/**
 * WorkflowProgressBar - شريط تقدم سير العمل (S/A/M/R)
 *
 * @param {Object} props
 * @param {Object} props.progress - workflow state from the backend (`workflow.steps` is read)
 * @param {boolean} props.showLabels - عرض التسميات (default: true)
 * @param {'sm'|'md'} props.size - الحجم (default: 'md')
 *
 * @example
 * <WorkflowProgressBar
 *   progress={project.workflow}
 * />
 */
function WorkflowProgressBar({ progress, showLabels = true, size = 'md', className, ...props }) {
  const steps = [
    { key: 'screening', label: 'Scr', fullLabel: 'Screening' },
    { key: 'assessment', label: 'Ass', fullLabel: 'Assessment' },
    { key: 'semp', label: 'SEMP', fullLabel: 'SEMP' },
    { key: 'monitoring', label: 'Mon', fullLabel: 'Monitoring' },
  ]

  const getStatusColor = (status) => {
    const statusConfig = workflowStepStatuses[status] || workflowStepStatuses.not_started
    return statusConfig.color || 'bg-gray-200 dark:bg-border-dark'
  }

  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2'
  const labelSize = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      {/* Progress Bar */}
      <div className={cn('flex gap-2', barHeight)}>
        {steps.map((step) => {
          const status = progress?.steps?.[step.key]?.status || 'not_started'
          const color = getStatusColor(status)

          return (
            <div
              key={step.key}
              className={cn('flex-1 rounded-full transition-colors', color)}
              title={`${step.fullLabel}: ${workflowStepStatuses[status]?.label ?? status}`}
            />
          )
        })}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-center gap-4 text-text-secondary dark:text-gray-400">
          {steps.map((step) => (
            <span key={step.key} className={cn('font-medium uppercase tracking-wider', labelSize)}>
              {step.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default WorkflowProgressBar
