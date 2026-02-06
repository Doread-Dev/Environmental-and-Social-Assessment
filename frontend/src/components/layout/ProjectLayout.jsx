import { useState, useCallback, useEffect, useMemo } from 'react'
import { Outlet, useParams, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/utils'
import { projectService } from '@/services/projectService'
import { extractErrorMessage } from '@/services/api'
import { ROUTES } from '@/routes/routes.config'
import { useWorkflow } from '@/hooks'
import ProjectSidebar from './ProjectSidebar'
import MobileMenu from './MobileMenu'

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
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get workflow data from hook (derives from actual entities)
  const {
    workflow,
    screening,
    assessment,
    isLoading: workflowLoading,
  } = useWorkflow(projectId)

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
  const showExportButton = showScreeningExport || showAssessmentExport || isMonitoringDataEntryPage

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

  // Fetch project data from API
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return
      setIsLoading(true)
      setError(null)

      try {
        const projectData = await projectService.getById(projectId)
        setProject(projectData)
      } catch (err) {
        const errorMessage = extractErrorMessage(err)
        setError(errorMessage)
        // eslint-disable-next-line no-console
        console.error('Failed to load project:', errorMessage)
      }

      setIsLoading(false)
    }

    fetchProject()
  }, [projectId])

  // Enhanced project with workflow (memoized)
  const enhancedProject = useMemo(() => {
    if (!project) return null
    return {
      ...project,
      workflow,
      screening,
      assessment,
    }
  }, [project, workflow, screening, assessment])

  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  const handleMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // Error state
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
              error
            </span>
          </div>
          <h2 className="text-xl font-bold text-text-main dark:text-white">
            Failed to Load Project
          </h2>
          <p className="text-text-secondary dark:text-gray-400">{error}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => navigate(ROUTES.PROJECTS)}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-main dark:hover:text-white transition-colors"
            >
              Back to Projects
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state (project loading or workflow loading)
  if (isLoading || (project && workflowLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading project...</p>
        </div>
      </div>
    )
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
            'px-6 lg:px-10'
          )}
        >
          {/* Left Section - Mobile Menu Button & Logo */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={handleMenuToggle}
                className="text-text-main dark:text-white"
                aria-label="Toggle menu"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>

            {/* Logo & Title */}
            <div className="flex items-center gap-3 px-2">
              <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-white">
                <span className="material-symbols-outlined text-2xl">eco</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold leading-tight text-text-main dark:text-white">
                  ESMS System
                </h1>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            {/* Export Excel Button - Only show on Screening Summary page when status is submitted */}
            {showExportButton && (
              <button
                onClick={handleExportClick}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export Excel
              </button>
            )}
            <button
              className="text-text-secondary hover:text-text-main dark:hover:text-white transition-colors"
              aria-label="Help"
            >
              <span className="material-symbols-outlined">help</span>
            </button>
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
            <Outlet context={{ project: enhancedProject, setProject, workflow }} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProjectLayout
