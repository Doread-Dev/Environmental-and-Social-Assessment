/**
 * AssessmentStartCard Component
 * بطاقة بدء التقييم (في Gateway Page)
 */

import { cn } from '@/utils/cn'
import { Button } from '@/components/ui'

/**
 * @param {Object} props
 * @param {string} props.status - حالة التقييم (not_started/in_progress/completed)
 * @param {Function} props.onStart - callback عند النقر على Start
 * @param {Function} props.onContinue - callback عند النقر على Continue
 */
export default function AssessmentStartCard({
  status = 'not_started',
  onStart,
  onContinue,
  className,
  ...props
}) {
  const statusConfig = {
    not_started: {
      badge: 'Not Started',
      badgeClass: 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-300',
      title: 'Begin Assessment Process',
      description:
        'Each project requires one comprehensive environmental assessment to evaluate potential impacts. This tool will guide you through identifying risks before management planning can begin.',
      buttonText: 'Start Environmental Assessment',
      buttonAction: onStart
    },
    in_progress: {
      badge: 'In Progress',
      badgeClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      title: 'Continue Assessment Process',
      description:
        'Your environmental assessment is in progress. Continue where you left off to complete the evaluation.',
      buttonText: 'Continue Assessment',
      buttonAction: onContinue
    },
    completed: {
      badge: 'Completed',
      badgeClass: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      title: 'Assessment Completed',
      description:
        'Your environmental assessment has been completed and approved. You can review the results or proceed to SEMP planning.',
      buttonText: 'Review Assessment',
      buttonAction: onContinue
    }
  }

  const config = statusConfig[status] || statusConfig.not_started

  return (
    <div
      className={cn(
        'bg-white dark:bg-surface-dark rounded-2xl border border-border-default dark:border-border-dark shadow-sm overflow-hidden relative group',
        className
      )}
      {...props}
    >
      <div className="absolute top-0 left-0 w-2 h-full bg-border-default dark:bg-border-dark"></div>
      <div className="p-8 lg:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit',
                config.badgeClass
              )}
            >
              {config.badge}
            </span>
            <h2 className="text-2xl font-bold text-text-main dark:text-white">
              {config.title}
            </h2>
            <p className="text-text-secondary leading-relaxed max-w-xl">{config.description}</p>
          </div>
          <div className="hidden sm:flex bg-gray-50/50 dark:bg-white/5 p-3 rounded-full shrink-0">
            <span className="material-symbols-outlined text-gray-400 text-4xl">
              assignment_add
            </span>
          </div>
        </div>

        {/* Assessment Covers */}
        <div className="bg-gray-50/50 dark:bg-white/5 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-text-main dark:text-white uppercase tracking-wide mb-4">
            This assessment covers:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                location_on
              </span>
              <div>
                <p className="text-sm font-medium text-text-main dark:text-white">
                  Site Information
                </p>
                <p className="text-xs text-text-secondary">Geography and coordinates</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">gavel</span>
              <div>
                <p className="text-sm font-medium text-text-main dark:text-white">
                  Legal Requirements
                </p>
                <p className="text-xs text-text-secondary">Local & national compliance</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                landscape
              </span>
              <div>
                <p className="text-sm font-medium text-text-main dark:text-white">
                  Environmental Setting
                </p>
                <p className="text-xs text-text-secondary">Baseline conditions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">warning</span>
              <div>
                <p className="text-sm font-medium text-text-main dark:text-white">
                  Impact Assessment
                </p>
                <p className="text-xs text-text-secondary">Risk evaluation matrix</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button
            onClick={config.buttonAction}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2"
          >
            <span>{config.buttonText}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
