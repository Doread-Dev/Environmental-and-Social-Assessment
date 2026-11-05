/**
 * SempFullWidthLayout
 * Layout for SEMP tools (Tool 3 & 4) that require full page width without sidebar
 */

import { Outlet, useParams, useNavigate } from 'react-router-dom'
import { useWorkspace } from '@/hooks'
import { useSaveConflict } from '@/contexts'
import { isStepLocked } from '@/utils/workflowSteps'
import { GuidanceButton, useCurrentPlace } from '@/components/library'
import BrandLogo from './BrandLogo'
import { ArchivedNotice } from '@/components/project'
import { Button, EmptyState, LoadingState } from '@/components/ui'

export default function SempFullWidthLayout() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  // Same workspace query as the route guard above (no extra request)
  const { project, workflow, can, isLoading } = useWorkspace(projectId)
  const { reloadKey } = useSaveConflict()
  // Tool 3 or Tool 4 (route handle), for its Guidance button (D64 c)
  const place = useCurrentPlace()

  const handleExport = () => {
    // Determine which tool is active from route
    // Routes are defined as 'activities' (Tool 3) and 'mitigation' (Tool 4) in routes/index.jsx
    const path = window.location.pathname
    const toolType = path.includes('activities') ? 'tool3' : 'tool4'
    window.dispatchEvent(
      new CustomEvent('semp-export', {
        detail: { toolType },
      })
    )
  }

  const handleBack = () => {
    // Navigate back to SEMP overview
    navigate(`/app/projects/${projectId}/semp`)
  }

  if (isLoading) {
    return <LoadingState message="Loading project..." variant="screen" />
  }

  // Gatekeeper: Tools 3 and 4 open once the assessment is approved (backend workflow)
  if (!project || isStepLocked(workflow, 'semp')) {
    return (
      <div className="flex flex-col min-h-screen bg-background dark:bg-background-dark">
        <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-default dark:border-border-dark bg-surface dark:bg-surface-dark px-6 md:px-10 py-3 shadow-sm h-16 shrink-0">
          <div className="flex items-center gap-3 px-2">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center mr-2 p-1 rounded-full hover:bg-background dark:hover:bg-white/5 text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              title="Back to Overview"
              aria-label="Back to Overview"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                arrow_back
              </span>
            </button>
            <div className="flex items-center justify-center size-10 rounded-xl bg-text-disabled text-white">
              <span className="material-symbols-outlined text-2xl" aria-hidden="true">
                lock
              </span>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark">
            <EmptyState
              icon="lock"
              title="Restricted Access"
              description={
                <>
                  You cannot access Management Tools until the{' '}
                  <strong>Environmental Assessment</strong> (Tool 2) is approved.
                </>
              }
              action={<Button onClick={handleBack}>Back to Overview</Button>}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-background-dark">
      {/* Global Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-default dark:border-border-dark bg-surface dark:bg-surface-dark px-4 sm:px-6 md:px-10 py-3 shadow-sm h-16 shrink-0">
        <BrandLogo size="md" className="sm:px-2" textClassName="hidden sm:flex" />

        <div className="flex flex-1 justify-end gap-3 sm:gap-6 items-center">
          <GuidanceButton place={place} />
          {can('export') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              leftIcon={
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  download
                </span>
              }
            >
              Export Excel
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        <ArchivedNotice project={project} className="m-4 mb-0 sm:mx-6 md:mx-10" />
        {/* After a stale-save Reload (D62) the page mounts again from the fresh data */}
        <Outlet key={reloadKey} context={{ project, workflow, can }} />
      </main>
    </div>
  )
}
