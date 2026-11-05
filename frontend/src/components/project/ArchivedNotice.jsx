import { Alert } from '@/components/ui'
import { formatDate } from '@/utils/formatters'

/**
 * Read-only notice on every page of an archived project (D17): who archived it and when.
 * Restoring is done from Settings → Projects (archived projects).
 *
 * @param {Object} props
 * @param {Object} props.project - The workspace project (`archived`, `archived_by`, `archived_at`)
 */
export default function ArchivedNotice({ project, className }) {
  if (!project?.archived) return null
  const by = project.archived_by?.name
  const on = formatDate(project.archived_at)
  return (
    <Alert
      variant="warning"
      title="Archived project — read only"
      icon="inventory_2"
      className={className}
    >
      {['This project was archived', by && `by ${by}`, on && `on ${on}`].filter(Boolean).join(' ')}.
      It can be viewed and exported, but not changed until it is restored.
    </Alert>
  )
}
