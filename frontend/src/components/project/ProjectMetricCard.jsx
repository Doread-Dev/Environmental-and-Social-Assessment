/**
 * ProjectMetricCard Component
 * Project metric card (Risk Level, Activities, Timeframe)
 *
 * Features:
 * - icon at the top with a small label
 * - large value (text-2xl)
 * - small subtitle
 */

import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {string} props.title - Metric title
 * @param {string|number} props.value - Value
 * @param {string} props.subtitle - Subtitle
 * @param {string} props.icon - Icon name
 * @param {string} props.iconBgColor - Icon background
 * @param {string} props.iconColor - Icon colour
 */
function ProjectMetricCard({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'bg-surface dark:bg-surface-dark p-5 rounded-xl border border-border-default dark:border-border-dark shadow-sm flex flex-col gap-3',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        {icon && (
          <div className={cn('p-2 rounded-lg', iconBgColor)}>
            <span className={cn('material-symbols-outlined', iconColor)} aria-hidden="true">
              {icon}
            </span>
          </div>
        )}
        {/* Title Label */}
        <span className="text-xs font-medium text-text-secondary dark:text-gray-400">{title}</span>
      </div>

      {/* Value and Subtitle */}
      <div>
        <h4 className="text-2xl font-bold text-text-main dark:text-white">{value}</h4>
        {subtitle && <p className="text-sm text-text-secondary dark:text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

export default ProjectMetricCard
