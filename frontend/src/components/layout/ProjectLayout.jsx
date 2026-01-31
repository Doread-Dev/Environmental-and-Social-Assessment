import { useState, useCallback, useEffect } from 'react'
import { Outlet, useParams, useLocation } from 'react-router-dom'
import { cn } from '@/utils'
import { mockProjects, getScreeningByProjectId, getAssessmentByProjectId } from '@/data'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Check if we're on screening page and get screening status for Export button
  const isScreeningPage = location.pathname.includes('/screening')
  const screening = projectId && isScreeningPage ? getScreeningByProjectId(projectId) : null
  const showScreeningExport = isScreeningPage && (screening?.status === 'submitted' || screening?.status === 'approved' || screening?.status === 'rejected')
  
  // Check if we're on assessment page and get assessment status for Export button
  const isAssessmentPage = location.pathname.includes('/assessment')
  const assessment = projectId && isAssessmentPage ? getAssessmentByProjectId(projectId) : null
  const showAssessmentExport = isAssessmentPage && (assessment?.status === 'submitted' || assessment?.status === 'approved' || assessment?.status === 'rejected')
  
  const showExportButton = showScreeningExport || showAssessmentExport
  
  const handleExportClick = () => {
    if (isScreeningPage) {
      // Trigger export event that ScreeningSummaryPage listens to
      window.dispatchEvent(new CustomEvent('screening-export'))
    } else if (isAssessmentPage) {
      // Trigger export event that AssessmentReviewPage listens to
      window.dispatchEvent(new CustomEvent('assessment-export'))
    }
  }

  // Fetch project data from mockProjects
  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true)

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Find project from mockProjects
      const foundProject = mockProjects.find((p) => p._id === projectId)

      if (foundProject) {
        setProject(foundProject)
      } else {
        // Fallback: create minimal project object
        console.warn('Project not found:', projectId)
        setProject({
          _id: projectId,
          title: 'Unknown Project',
          location: 'N/A',
          status: 'draft',
          workflow: {
            screening: { status: 'pending', tool: 1 },
            assessment: { status: 'pending', tool: 2 },
            semp: { status: 'pending', tools: [3, 4] },
            monitoring: { status: 'pending', tool: 5 },
          },
        })
      }

      setIsLoading(false)
    }

    fetchProject()
  }, [projectId])

  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  const handleMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // Loading state
  if (isLoading) {
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
      <ProjectSidebar project={project} />

      {/* Mobile Menu - Project Variant */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={handleMenuClose}
        variant="project"
        project={project}
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
            <Outlet context={{ project }} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProjectLayout
