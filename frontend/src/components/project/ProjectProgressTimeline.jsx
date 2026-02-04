/**
 * ProjectProgressTimeline Component
 * الجدول الزمني لتقدم المشروع (الخطوات الأربع)
 * مطابق للتصميم الأصلي حرفياً
 *
 * Features:
 * - خط تقدم أفقي في الخلفية
 * - دوائر مع ring-4 ring-white
 * - أيقونات مختلفة حسب الحالة
 */

import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {Object} props.workflow - حالة كل خطوة
 * @param {boolean} props.showLabels - عرض التسميات (default: true)
 * @param {boolean} props.showPercentage - عرض النسبة المئوية (default: true)
 */
function ProjectProgressTimeline({
  workflow,
  showLabels = true,
  showPercentage = true,
  className,
  ...props
}) {
  if (!workflow) return null

  // الخطوات الأربع
  const steps = [
    { id: 'screening', label: 'Screening', tool: 1 },
    { id: 'assessment', label: 'Assessment', tool: 2 },
    { id: 'semp', label: 'SEMP', tool: '3&4' },
    { id: 'monitoring', label: 'Monitoring', tool: 5 },
  ]

  // حساب النسبة المئوية
  function calculateProgress(workflow) {
    const stepKeys = ['screening', 'assessment', 'semp', 'monitoring']
    const completedSteps = stepKeys.filter((step) => {
      const status = workflow[step]?.status
      return status === 'approved' || status === 'completed'
    }).length

    const inProgressSteps = stepKeys.filter((step) => {
      const status = workflow[step]?.status
      // For screening & assessment: submitted, draft, rejected count as in_progress
      if (step === 'screening' || step === 'assessment') {
        return (
          status === 'submitted' ||
          status === 'draft' ||
          status === 'rejected' ||
          status === 'in_progress'
        )
      }
      return status === 'in_progress'
    }).length

    // Calculate percentage based on completed + half of in-progress
    const totalProgress = completedSteps + inProgressSteps * 0.5
    return Math.round((totalProgress / stepKeys.length) * 100)
  }

  const progressPercentage = calculateProgress(workflow)

  // Get step status and render config
  function getStepConfig(stepId, stepTool) {
    const stepData = workflow[stepId] || {}
    let status = stepData.status || 'pending'

    // Completed statuses
    if (status === 'approved' || status === 'completed') {
      return {
        bgColor: 'bg-primary',
        icon: 'check',
        iconColor: 'text-white',
        label: 'Completed',
        labelColor: 'text-primary',
        subtitleColor: 'text-primary',
        showNumber: false,
        opacity: '',
      }
    }

    // Rejected status (for screening & assessment)
    if (status === 'rejected') {
      return {
        bgColor: 'bg-white dark:bg-surface-dark border-2 border-red-500',
        icon: 'priority_high',
        iconColor: 'text-red-500',
        label: 'Rejected',
        labelColor: 'text-red-500 dark:text-red-400',
        subtitleColor: 'text-red-400 dark:text-red-400',
        showNumber: false,
        animated: false,
        opacity: '',
      }
    }

    // Submitted or needs_action status (for screening & assessment) - pending approval/action
    if (status === 'submitted' || status === 'needs_action') {
      return {
        bgColor: 'bg-white dark:bg-surface-dark border-2 border-amber-500',
        icon: status === 'needs_action' ? 'warning' : 'hourglass_top',
        iconColor: 'text-amber-500',
        label: status === 'needs_action' ? 'Needs Action' : 'Pending Approval',
        labelColor: 'text-amber-600 dark:text-amber-400',
        subtitleColor: 'text-amber-500 dark:text-amber-400',
        showNumber: false,
        animated: true,
        opacity: '',
      }
    }

    // In progress or draft status
    if (status === 'in_progress' || status === 'draft') {
      return {
        bgColor: 'bg-white dark:bg-surface-dark border-2 border-primary',
        icon: 'edit_document',
        iconColor: 'text-primary',
        label: status === 'draft' ? 'Draft' : 'In Progress',
        labelColor: 'text-primary dark:text-primary',
        subtitleColor: 'text-primary/80 dark:text-primary/80',
        showNumber: false,
        animated: true,
        opacity: '',
      }
    }

    // pending
    return {
      bgColor: 'bg-gray-100 dark:bg-white/5 border-2 border-border-default dark:border-border-dark',
      icon: null,
      iconColor: 'text-text-secondary',
      label: 'Pending',
      labelColor: 'text-text-main dark:text-white',
      subtitleColor: 'text-text-secondary',
      showNumber: true,
      number: stepTool === '3 & 4' ? null : stepTool, // SEMP لا يظهر رقم
      opacity: 'opacity-50',
    }
  }

  return (
    <div
      className={cn('mt-8 pt-6 border-t border-border-default dark:border-border-dark', className)}
      {...props}
    >
      {/* Header */}
      {showPercentage && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-main dark:text-white">
            Completion Progress
          </h3>
          <span className="text-sm font-medium text-primary dark:text-primary">
            {progressPercentage}%
          </span>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Background Progress Bar - Full width gray bar */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-white/5 -translate-y-1/2 rounded-full z-0"></div>
        {/* Progress Bar - Primary colored portion */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-primary/30 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        ></div>

        {/* Steps */}
        <div className="relative z-10 flex justify-between w-full">
          {steps.map((step) => {
            const config = getStepConfig(step.id, step.tool)

            return (
              <div
                key={step.id}
                className={cn('flex flex-col items-center gap-2 group', config.opacity)}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shadow-sm ring-4 ring-white dark:ring-surface-dark transition-all',
                    config.bgColor,
                    config.animated && 'animate-pulse'
                  )}
                >
                  {config.icon ? (
                    <span className={cn('material-symbols-outlined text-[18px]', config.iconColor)}>
                      {config.icon}
                    </span>
                  ) : (
                    <span className={cn('text-xs font-bold', config.iconColor)}>
                      {config.number || step.tool}
                    </span>
                  )}
                </div>

                {/* Step Label */}
                {showLabels && (
                  <div className="flex flex-col items-center">
                    <span className={cn('text-xs font-bold', config.labelColor)}>{step.label}</span>
                    <span className={cn('text-[10px] font-medium', config.subtitleColor)}>
                      {config.label}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ProjectProgressTimeline
