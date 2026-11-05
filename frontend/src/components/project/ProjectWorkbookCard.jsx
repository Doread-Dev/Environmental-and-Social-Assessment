/**
 * ProjectWorkbookCard Component
 * "Export project workbook" (D67 b): one Excel file in the official AKF layout with a sheet per
 * tool that has data. Rendered only for users who may export (D28a: never viewers).
 */

import { Button, useToast } from '@/components/ui'
import { useProjectWorkbook } from '@/hooks/useProjectWorkbook'
import { cn } from '@/utils/cn'

const TOOL_LABELS = {
  tool1: 'Tool 1',
  tool2: 'Tool 2',
  tool3: 'Tool 3',
  tool4: 'Tool 4',
  tool5: 'Tool 5',
}

/**
 * @param {Object} props
 * @param {string} props.projectId
 */
function ProjectWorkbookCard({ projectId, className }) {
  const toast = useToast()
  const { exportWorkbook, isExporting, hasData, tools } = useProjectWorkbook(projectId)
  const included = Object.keys(TOOL_LABELS).filter((tool) => tools[tool])

  const handleExport = async () => {
    const result = await exportWorkbook()
    if (result.success) toast.success(`Downloaded ${result.fileName}`)
    else toast.error(result.error || 'Failed to export the project workbook')
  }

  return (
    <div
      className={cn(
        'bg-surface dark:bg-surface-dark p-5 rounded-xl border border-border-default dark:border-border-dark shadow-sm flex flex-col gap-4',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <span className="material-symbols-outlined text-primary">table_view</span>
        </div>
        <h4 className="text-sm font-bold text-text-main dark:text-white">Project workbook</h4>
      </div>
      <p className="text-sm text-text-secondary dark:text-gray-400">
        {hasData
          ? `One Excel file in the official AKF layout: ${included.map((t) => TOOL_LABELS[t]).join(', ')}. Each sheet's printed footer shows that tool's status and the export date.`
          : 'Available once Tool 1 has been started.'}
      </p>
      <Button
        variant="outline"
        fullWidth
        onClick={handleExport}
        disabled={!hasData}
        isLoading={isExporting}
        leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
      >
        Export project workbook
      </Button>
    </div>
  )
}

export default ProjectWorkbookCard
