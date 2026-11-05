/**
 * AssessmentStartCard Component
 * بطاقة بدء التقييم (في Gateway Page)
 */

import { cn } from '@/utils/cn'
import { Button, StatusBadge } from '@/components/ui'

/**
 * @param {Object} props
 * @param {string} props.status - حالة التقييم (not_started/in_progress/completed)
 * @param {Function} props.onStart - callback عند النقر على Start
 * @param {Function} props.onContinue - callback عند النقر على Continue
 * @param {boolean} [props.canStart] - May the user create the assessment (`assessment.create`)
 * @param {boolean} [props.canEdit] - May the user edit it (`assessment.edit`); viewers only view
 */
export default function AssessmentStartCard({
  status = 'not_started',
  onStart,
  onContinue,
  canStart = true,
  canEdit = true,
  className,
  ...props
}) {
  const statusConfig = {
    not_started: {
      badgeStatus: 'not_started',
      title: 'Begin Assessment Process',
      description:
        'Each project requires one comprehensive environmental assessment to evaluate potential impacts. This tool will guide you through identifying risks before management planning can begin.',
      buttonText: 'Start Environmental Assessment',
      buttonAction: onStart,
    },
    in_progress: {
      badgeStatus: 'in_progress',
      title: canEdit ? 'Continue Assessment Process' : 'Assessment in Progress',
      description: canEdit
        ? 'Your environmental assessment is in progress. Continue where you left off to complete the evaluation.'
        : 'The environmental assessment is in progress.',
      buttonText: canEdit ? 'Continue Assessment' : 'View Assessment',
      buttonAction: onContinue,
    },
    completed: {
      badgeStatus: 'completed',
      title: 'Assessment Completed',
      description:
        'Your environmental assessment has been completed and approved. You can review the results or proceed to SEMP planning.',
      buttonText: 'Review Assessment',
      buttonAction: onContinue,
    },
  }

  const config = statusConfig[status] || statusConfig.not_started

  return (
    <div
      className={cn(
        'bg-surface dark:bg-surface-dark rounded-2xl border border-border-default dark:border-border-dark shadow-sm overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="p-6 lg:p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <StatusBadge status={config.badgeStatus} className="w-fit" />
            <h2 className="text-xl font-bold text-text-main dark:text-white">{config.title}</h2>
            <p className="text-text-secondary dark:text-gray-400 leading-relaxed max-w-xl">
              {config.description}
            </p>
          </div>
        </div>

        {/* Assessment Covers */}
        <div className="bg-background dark:bg-white/5 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-text-main dark:text-white uppercase tracking-wide mb-4">
            This assessment covers:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-primary text-xl mt-0.5"
                aria-hidden="true"
              >
                location_on
              </span>
              <div>
                <p className="text-sm font-medium text-text-main dark:text-white">
                  Site Information
                </p>
                <p className="text-xs text-text-secondary dark:text-gray-400">
                  Geography and coordinates
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-primary text-xl mt-0.5"
                aria-hidden="true"
              >
                gavel
              </span>
              <div>
                <p className="text-sm font-medium text-text-main dark:text-white">
                  Legal Requirements
                </p>
                <p className="text-xs text-text-secondary dark:text-gray-400">
                  Local & national compliance
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-primary text-xl mt-0.5"
                aria-hidden="true"
              >
                landscape
              </span>
              <div>
                <p className="text-sm font-medium text-text-main dark:text-white">
                  Environmental Setting
                </p>
                <p className="text-xs text-text-secondary dark:text-gray-400">
                  Baseline conditions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-primary text-xl mt-0.5"
                aria-hidden="true"
              >
                warning
              </span>
              <div>
                <p className="text-sm font-medium text-text-main dark:text-white">
                  Impact Assessment
                </p>
                <p className="text-xs text-text-secondary dark:text-gray-400">
                  Risk evaluation matrix
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button (a read-only user cannot start the assessment) */}
        {(status !== 'not_started' || canStart) && (
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              onClick={config.buttonAction}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2"
            >
              <span>{config.buttonText}</span>
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                arrow_forward
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
