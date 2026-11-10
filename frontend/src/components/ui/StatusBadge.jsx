import Badge from './Badge'
import { getStatusBadge } from '@/utils/statusBadges'

/**
 * The status pill of the app (D71): workflow steps, screening/assessment records, projects,
 * SEMP tables and archived projects all use it, so a status looks the same on every screen.
 *
 * @param {Object} props
 * @param {string} props.status - Status key (see utils/statusBadges.js)
 * @param {string} [props.label] - Text instead of the default label of the status
 * @param {'sm'|'md'|'lg'} [props.size]
 *
 * @example
 * <StatusBadge status={workflow.steps.screening.status} />
 */
function StatusBadge({ status, label, size = 'md', className, ...props }) {
  const config = getStatusBadge(status)
  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={!config.icon}
      icon={
        config.icon ? (
          <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden="true">
            {config.icon}
          </span>
        ) : undefined
      }
      className={className}
      data-status={status}
      {...props}
    >
      {label || config.label}
    </Badge>
  )
}

export default StatusBadge
