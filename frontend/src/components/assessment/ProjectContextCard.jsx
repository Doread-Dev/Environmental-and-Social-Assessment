/**
 * ProjectContextCard Component
 * The project card next to the assessment: the shared Project Details card (real project data
 * only, "Not specified" when empty, no title — the sidebar shows it) plus who approved the
 * screening, from the screening or its status history (D16).
 */

import { ProjectDetailsCard } from '@/components/project'
import { getReviewer } from '@/utils/reviewer'

/**
 * @param {Object} props
 * @param {Object} props.project - The project
 * @param {Object} props.screening - The project's screening
 */
export default function ProjectContextCard({ project, screening, className, ...props }) {
  const approver = getReviewer(screening, 'approved')
  const approvedBy = approver
    ? [approver.name, approver.position && `(${approver.position})`].filter(Boolean).join(' ')
    : ''

  return (
    <ProjectDetailsCard
      title="Project Context"
      location={project?.location}
      component={project?.project_component}
      startDate={project?.start_date}
      endDate={project?.end_date}
      extraRows={[{ label: 'Screening approved by', icon: 'verified', value: approvedBy }]}
      className={className}
      {...props}
    />
  )
}
