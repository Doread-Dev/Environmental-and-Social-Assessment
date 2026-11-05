import { useState, useCallback, useMemo } from 'react'
import { Outlet, useParams, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/utils'
import { ROUTES } from '@/routes/routes.config'
import { useWorkspace } from '@/hooks'
import { useSaveConflict } from '@/contexts'
import { GuidanceButton, useCurrentPlace } from '@/components/library'
import ProjectSidebar from './ProjectSidebar'
import MobileMenu from './MobileMenu'
import BrandLogo from './BrandLogo'
import { ArchivedNotice } from '@/components/project'
import { Button, ErrorState, LoadingState } from '@/components/ui'

/**
 * ProjectLayout Component
 * Project workspace layout with project sidebar and content area
 * Used for all project-specific pages (Overview, Screening, Assessment, etc.)
 */

function ProjectLayout() {
  const { projectId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Project, workflow state and allowed actions: one shared query (D31, D33). A refetch after a
  // save keeps the old data on screen, so the page is never replaced by the spinner below.
  const {
    project,
    workflow,
    screening,
    assessment,
    counts,
    allowedActions,
    can,
    isLoading,
    error,
    refetch,
  } = useWorkspace(projectId)
  const { reloadKey } = useSaveConflict()
  const canExport = can('export')
  // The place of the current page (route handle), for its Guidance button (D64 c)
  const place = useCurrentPlace()

  // Check if we're on screening page and get screening status for Export button
  const isScreeningPage = location.pathname.includes('/screening')
  const showScreeningExport =
    isScreeningPage &&
    screening &&
    (screening.status === 'submitted' || screening.status === 'approved')

  // Check if we're on assessment page and get assessment status for Export button
  const isAssessmentPage = location.pathname.includes('/assessment')
  const showAssessmentExport =
    isAssessmentPage &&
    assessment &&
    (assessment.status === 'submitted' || assessment.status === 'approved')

  const isMonitoringDataEntryPage = location.pathname.includes('/monitoring/data-entry')
  // Viewers never export (D28a)
  const showExportButton =
    canExport && (showScreeningExport || showAssessmentExport || isMonitoringDataEntryPage)

  const handleExportClick = () => {
    if (isScreeningPage) {
      // Trigger export event that ScreeningSummaryPage listens to
      window.dispatchEvent(new CustomEvent('screening-export'))
    } else if (isAssessmentPage) {
      // Trigger export event that AssessmentReviewPage listens to
      window.dispatchEvent(new CustomEvent('assessment-export'))
    } else if (isMonitoringDataEntryPage) {
      window.dispatchEvent(new CustomEvent('monitoring-export'))
    }
  }

  // Project with its workflow state, summaries and allowed actions (sidebar, mobile menu, pages)
  const enhancedProject = useMemo(() => {
    if (!project) return null
    return {
      ...project,
      workflow,
      screening,
      assessment,
      allowed_actions: allowedActions,
    }
  }, [project, workflow, screening, assessment, allowedActions])

  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  const handleMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // Error state (a failed background refetch keeps the loaded project on screen)
  if (error && !project) {
    return (
      <ErrorState
        variant="screen"
        title="Failed to Load Project"
        message={error}
        onRetry={refetch}
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.PROJECTS)}>
            Back to Projects
          </Button>
        }
      />
    )
  }

  // Loading state (first load only)
  if (isLoading || !enhancedProject) {
    return <LoadingState message="Loading project..." variant="screen" />
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background dark:bg-background-dark">
      {/* Desktop Project Sidebar */}
      <ProjectSidebar project={enhancedProject} />

      {/* Mobile Menu - Project Variant */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={handleMenuClose}
        variant="project"
        project={enhancedProject}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Project Header */}
        <header
          className={cn(
            'h-16 shrink-0 z-10',
            'bg-surface dark:bg-surface-dark',
            'border-b border-border-default dark:border-border-dark',
            'flex items-center justify-between',
            'px-4 sm:px-6 lg:px-10'
          )}
        >
          {/* Left Section - Mobile Menu Button & Logo */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
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

            {/* Logo & Title */}
            <BrandLogo size="md" className="sm:px-2" textClassName="hidden sm:flex" />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-6">
            <GuidanceButton place={place} />
            {/* Export Excel Button - Only show on Screening Summary page when status is submitted */}
            {showExportButton && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportClick}
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

        {/* Page Content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            'p-4 sm:p-6 lg:p-8',
            'bg-background dark:bg-background-dark',
            'scroll-smooth'
          )}
        >
          <div className="max-w-7xl mx-auto">
            <ArchivedNotice project={enhancedProject} className="mb-6" />
            {/* After a stale-save Reload (D62) the page mounts again from the fresh data */}
            <Outlet key={reloadKey} context={{ project: enhancedProject, workflow, counts, can }} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProjectLayout
