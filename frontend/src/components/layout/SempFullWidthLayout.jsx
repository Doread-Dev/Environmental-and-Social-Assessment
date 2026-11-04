/**
 * SempFullWidthLayout
 * Layout for SEMP tools (Tool 3 & 4) that require full page width without sidebar
 */

import { Outlet, useParams, useNavigate } from 'react-router-dom'
import { useWorkspace } from '@/hooks'
import { isStepLocked } from '@/utils/workflowSteps'
import { GuidanceButton, useCurrentPlace } from '@/components/library'

export default function SempFullWidthLayout() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  // Same workspace query as the route guard above (no extra request)
  const { project, workflow, can, isLoading } = useWorkspace(projectId)
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
    return (
      <div className="flex h-screen items-center justify-center bg-background dark:bg-background-dark">
        <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // Gatekeeper: Tools 3 and 4 open once the assessment is approved (backend workflow)
  if (!project || isStepLocked(workflow, 'semp')) {
    return (
      <div className="flex flex-col min-h-screen bg-background dark:bg-background-dark">
        <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-default dark:border-border-dark bg-surface dark:bg-surface-dark px-6 md:px-10 py-3 shadow-sm h-16 shrink-0">
          <div className="flex items-center gap-3 px-2">
            <button
              onClick={handleBack}
              className="flex items-center mr-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-text-secondary hover:text-text-main transition-colors"
              title="Back to Overview"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div className="flex items-center justify-center size-10 rounded-xl bg-gray-400 text-white">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md bg-white dark:bg-surface-dark p-8 rounded-xl shadow-sm border border-border-default dark:border-border-dark">
            <div className="size-16 rounded-full bg-gray-50/50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-gray-500">lock</span>
            </div>
            <h2 className="text-xl font-bold text-text-main dark:text-white mb-2">
              Restricted Access
            </h2>
            <p className="text-text-secondary dark:text-gray-400 mb-6">
              You cannot access Management Tools until the <strong>Environmental Assessment</strong>{' '}
              (Tool 2) is approved.
            </p>
            <button
              onClick={handleBack}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors"
            >
              Back to Overview
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-background-dark">
      {/* Global Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-default dark:border-border-dark bg-surface dark:bg-surface-dark px-4 sm:px-6 md:px-10 py-3 shadow-sm h-16 shrink-0">
        <div className="flex items-center gap-3 sm:px-2">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-white">
            <span className="material-symbols-outlined text-2xl">eco</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <h1 className="text-lg font-bold leading-tight text-text-main dark:text-white">
              ESMS System
            </h1>
          </div>
        </div>

        <div className="flex flex-1 justify-end gap-3 sm:gap-6 items-center">
          <GuidanceButton place={place} />
          {can('export') && (
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 rounded-lg h-9 px-4 bg-white dark:bg-surface-dark border border-border-default dark:border-border-dark text-text-secondary dark:text-gray-300 text-sm font-medium shadow-sm hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Export Excel
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        <Outlet context={{ project, workflow, can }} />
      </main>
    </div>
  )
}
