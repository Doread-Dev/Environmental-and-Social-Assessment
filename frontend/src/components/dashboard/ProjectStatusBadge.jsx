import { Badge } from '@/components/ui'
import { projectStatuses } from '@/utils/workflowStatuses'

/**
 * ProjectStatusBadge - شارة حالة المشروع
 *
 * @param {Object} props
 * @param {string} props.status - الحالة (draft, in_progress, monitoring, needs_action, completed)
 * @param {'sm'|'md'} props.size - الحجم (default: 'md')
 *
 * @example
 * <ProjectStatusBadge status="in_progress" />
 * <ProjectStatusBadge status="completed" size="sm" />
 */
function ProjectStatusBadge({ status, size = 'md', className, ...props }) {
  const statusConfig = projectStatuses[status]

  if (!statusConfig) {
    return null
  }

  // Map status to Badge variant
  const variantMap = {
    draft: 'default',
    in_progress: 'info',
    monitoring: 'info',
    needs_action: 'error',
    completed: 'success',
  }

  const variant = variantMap[status] || 'default'

  return (
    <Badge variant={variant} size={size} className={className} {...props}>
      {statusConfig.label}
    </Badge>
  )
}

export default ProjectStatusBadge
