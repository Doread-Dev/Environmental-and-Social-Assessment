/**
 * ProjectDetailsCard Component
 * بطاقة تفاصيل المشروع
 * Real project data only: location, component, start and end date.
 * Empty values show "Not specified".
 */

import { cn } from '@/utils/cn'
import { formatDateFull } from '@/utils/formatters'

const NOT_SPECIFIED = 'Not specified'

const textOrEmpty = (value) => (value && value.trim() ? value : NOT_SPECIFIED)
const dateOrEmpty = (value) => (value ? formatDateFull(value) : NOT_SPECIFIED)

/**
 * @param {Object} props
 * @param {string} props.location - Project location
 * @param {string} props.component - Project component / activity
 * @param {string} props.startDate - Start date
 * @param {string} props.endDate - End date
 */
function ProjectDetailsCard({ location, component, startDate, endDate, className, ...props }) {
  const rows = [
    { label: 'Location', icon: 'location_on', value: textOrEmpty(location) },
    { label: 'Component / Activity', icon: 'category', value: textOrEmpty(component) },
    { label: 'Start Date', icon: 'event', value: dateOrEmpty(startDate) },
    { label: 'End Date', icon: 'event_available', value: dateOrEmpty(endDate) },
  ]

  return (
    <div
      className={cn(
        'bg-surface dark:bg-surface-dark p-5 rounded-xl border border-border-default dark:border-border-dark shadow-sm flex flex-col gap-4',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <span className="material-symbols-outlined text-primary">info</span>
        </div>
        <h4 className="text-sm font-bold text-text-main dark:text-white">Project Details</h4>
      </div>

      <dl className="flex flex-col divide-y divide-border-default dark:divide-border-dark">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3 py-2">
            <span className="material-symbols-outlined text-[18px] text-text-secondary dark:text-gray-400 mt-0.5">
              {row.icon}
            </span>
            <div className="flex flex-col min-w-0">
              <dt className="text-xs font-medium text-text-secondary dark:text-gray-400">
                {row.label}
              </dt>
              <dd
                className={cn(
                  'text-sm break-words',
                  row.value === NOT_SPECIFIED
                    ? 'text-text-secondary/60 dark:text-gray-500 italic'
                    : 'text-text-main dark:text-white'
                )}
              >
                {row.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default ProjectDetailsCard
