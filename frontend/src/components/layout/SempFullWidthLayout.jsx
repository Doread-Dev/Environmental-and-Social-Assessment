/**
 * SempFullWidthLayout
 * Layout for SEMP tools (Tool 3 & 4) that require full page width without sidebar. Below `lg`
 * (phones and tablets) the header has the same menu button and project menu as ProjectLayout,
 * with the tools' lock / done state from the backend workflow (phase 12a).
 */

import { useCallback, useMemo, useState } from 'react'
import { Outlet, useParams, useNavigate } from 'react-router-dom'
import { useWorkspace } from '@/hooks'
import { useSaveConflict } from '@/contexts'
import { isStepLocked } from '@/utils/workflowSteps'
import { GuidanceButton, useCurrentPlace } from '@/components/library'
import { requestExport, useExportReady } from '@/components/export'
import BrandLogo from './BrandLogo'
import MobileMenu from './MobileMenu'
import { ArchivedNotice } from '@/components/project'
import { Button, EmptyState, LoadingState } from '@/components/ui'
import { ROUTES, getProjectRoute } from '@/routes/routes.config'

export default function SempFullWidthLayout() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  // Same workspace query as the route guard above (no extra request)
  const { project, workflow, screening, assessment, allowedActions, can, isLoading } =
    useWorkspace(projectId)
  const { reloadKey } = useSaveConflict()
  // Tool 3 or Tool 4 (route handle), for its Guidance button (D64 c)
  const place = useCurrentPlace()

  // Tool 3 or 4 answers the export once its rows are loaded; disabled until then (phase 12a)
  const exportReady = useExportReady('semp-export')
  const handleExport = () => {
    // Routes 'activities' (Tool 3) and 'mitigation' (Tool 4) in routes/index.jsx
    const toolType = window.location.pathname.includes('activities') ? 'tool3' : 'tool4'
    requestExport('semp-export', { toolType })
  }

  const handleBack = () => navigate(getProjectRoute(projectId, ROUTES.SEMP))

  // The project menu (phones and tablets), as in ProjectLayout
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const handleMenuToggle = useCallback(() => setIsMobileMenuOpen((open) => !open), [])
  const handleMenuClose = useCallback(() => setIsMobileMenuOpen(false), [])
  const menuProject = useMemo(
    () =>
      project && { ...project, workflow, screening, assessment, allowed_actions: allowedActions },
    [project, workflow, screening, assessment, allowedActions]
  )
  const menu = (
    <MobileMenu
      isOpen={isMobileMenuOpen}
      onClose={handleMenuClose}
      variant="project"
      project={menuProject}
    />
  )
  const menuButton = (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={handleMenuToggle}
        className="flex p-1 rounded-lg text-text-main dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          menu
        </span>
      </button>
    </div>
  )

  if (isLoading) {
    return <LoadingState message="Loading project..." variant="screen" />
  }

  // Gatekeeper: Tools 3 and 4 open once the assessment is approved (backend workflow)
  if (!project || isStepLocked(workflow, 'semp')) {
    return (
      <div className="flex flex-col min-h-screen bg-background dark:bg-background-dark">
        <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-default dark:border-border-dark bg-surface dark:bg-surface-dark px-6 md:px-10 py-3 shadow-sm h-16 shrink-0">
          <div className="flex items-center gap-3 px-2">
            {menuButton}
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
        {menu}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-background-dark">
      {/* Global Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-default dark:border-border-dark bg-surface dark:bg-surface-dark px-4 sm:px-6 md:px-10 py-3 shadow-sm h-16 shrink-0">
        <div className="flex items-center gap-4">
          {menuButton}
          <BrandLogo size="md" className="sm:px-2" textClassName="hidden sm:flex" />
        </div>

        <div className="flex flex-1 justify-end gap-3 sm:gap-6 items-center">
          <GuidanceButton place={place} />
          {can('export') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={!exportReady}
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
      {/* After the header: the menu panel (z-50) must lie above the sticky header (z-50) */}
      {menu}
    </div>
  )
}
