/**
 * SempFullWidthLayout
 * Layout for SEMP tools (Tool 3 & 4) that require full page width without sidebar
 */

import { useState, useEffect } from 'react'
import { Outlet, useParams, useNavigate } from 'react-router-dom'
import { projectService } from '@/services'
import { useAssessment } from '@/hooks'

export default function SempFullWidthLayout() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const { assessment, isLoading: assessmentLoading } = useAssessment(projectId)

  useEffect(() => {
    // Load project from API
    const fetchProject = async () => {
      if (!projectId) return
      setIsLoading(true)
      try {
        const data = await projectService.getById(projectId)
        setProject(data)
      } catch (err) {
        console.error('Failed to load project:', err)
        setProject({ _id: projectId, title: 'Unknown Project' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchProject()
  }, [projectId])

  const handleExport = () => {
    // Determine which tool is active from route
    const path = window.location.pathname
    const toolType = path.includes('management') ? 'tool3' : 'tool4'
    console.log('[SempFullWidthLayout] Dispatching export event:', {
      toolType,
      path,
      project: project ? 'available' : 'missing',
    })
    window.dispatchEvent(
      new CustomEvent('semp-export', {
        detail: { toolType, project }, // Pass project in event detail as backup
      })
    )
  }

  const handleBack = () => {
    // Navigate back to SEMP overview
    navigate(`/app/projects/${projectId}/semp`)
  }

  if (isLoading || assessmentLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background dark:bg-background-dark">
        <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // Gatekeeper: Check if Assessment is Approved
  if (assessment?.status !== 'approved') {
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
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-default dark:border-border-dark bg-surface dark:bg-surface-dark px-6 md:px-10 py-3 shadow-sm h-16 shrink-0">
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

        <div className="flex flex-1 justify-end gap-6 items-center">
          <button
            onClick={handleExport}
            disabled={!project}
            className="flex items-center justify-center gap-2 rounded-lg h-9 px-4 bg-white dark:bg-surface-dark border border-border-default dark:border-border-dark text-text-secondary dark:text-gray-300 text-sm font-medium shadow-sm hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Export Excel
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        <Outlet context={{ project }} />
      </main>
    </div>
  )
}
