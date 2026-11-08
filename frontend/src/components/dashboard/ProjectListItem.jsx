import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui'
import { ScreeningCategoryBadge } from './index'
import { StatusBadge } from '@/components/ui'
import { cn } from '@/utils'
import { getProjectRoute } from '@/routes/routes.config'

/**
 * ProjectListItem - a project in the dashboard list
 *
 * @param {Object} props
 * @param {Object} props.project - The project
 * @param {Function} props.onClick - Click handler (optional)
 *
 * @example
 * <ProjectListItem project={project} />
 */
function ProjectListItem({ project, onClick, className, ...props }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick(project)
    } else {
      navigate(getProjectRoute(project._id, '/app/projects/:projectId/overview'))
    }
  }

  // Overall status computed by the backend (D30)
  const projectStatus = project.workflow?.status || 'draft'
  const categoryCode = project.screening?.category_code

  return (
    <li
      className={cn(
        'group p-3',
        'hover:bg-background dark:hover:bg-white/5',
        'rounded-lg transition-colors cursor-pointer',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded bg-background dark:bg-white/10 flex items-center justify-center text-text-secondary">
            <Icon name={project.icon || 'folder'} className="text-lg" />
          </div>
          <div>
            <h4 dir="auto" className="text-sm font-semibold text-text-main dark:text-white">
              {project.title}
            </h4>
            <p dir="auto" className="text-xs text-text-secondary">
              {project.location}
            </p>
          </div>
        </div>
        <Icon
          name="chevron_right"
          className="text-text-secondary group-hover:text-primary text-lg transition-colors"
        />
      </div>
      <div className="flex gap-2 mt-2 ml-10">
        <StatusBadge status={projectStatus} size="sm" />
        {categoryCode && <ScreeningCategoryBadge category={categoryCode} size="sm" showLabel />}
      </div>
    </li>
  )
}

export default ProjectListItem
