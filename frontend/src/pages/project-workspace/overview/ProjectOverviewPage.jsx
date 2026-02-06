/**
 * ProjectOverviewPage
 * صفحة نظرة عامة على المشروع
 * مطابق للتصميم الأصلي حرفياً
 *
 * Layout: ProjectLayout (موجود)
 * Route: /app/projects/:projectId/overview
 */

import { useMemo, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ProjectHeader,
  ProjectProgressTimeline,
  ProjectMetricCard,
  ProjectCTACard,
  ProjectSiteCard,
} from '@/components/project'
import { useProjectContext, useSemp } from '@/hooks'
import { getScreeningCategory } from '@/data'
import { calculateDurationMonths, formatDuration } from '@/utils/formatters'
import { getNextAction } from '@/utils/workflowDerivation'
import { projectService } from '@/services/projectService'
import { extractErrorMessage } from '@/services/api'

function ProjectOverviewPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { project: contextProject, setProject: setContextProject, workflow } = useProjectContext()
  const [project, setProject] = useState(contextProject)
  
  // Get Management Activities count from SEMP hook
  const { managementActivities, isLoading: sempLoading } = useSemp(projectId)

  useEffect(() => {
    if (contextProject) {
      setProject(contextProject)
    }
  }, [contextProject])

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-text-secondary dark:text-gray-400">Project not found</p>
        </div>
      </div>
    )
  }

  // workflow is derived from actual entity data (passed from ProjectLayout)
  const currentWorkflow = workflow || project.workflow || {}
  const screening = project.screening || {}
  const nextAction = getNextAction(currentWorkflow)

  // Calculate metrics
  const riskCategory = screening.category_code || 'N/A'
  const riskCategoryInfo = riskCategory !== 'N/A' ? getScreeningCategory(riskCategory) : null
  const riskLabel = riskCategoryInfo ? `Category ${riskCategory}` : 'Not Assigned'
  const riskSubtitle = riskCategoryInfo ? riskCategoryInfo.label : ''

  // Get actual activities count from Tool 3 (Management Activities)
  const activitiesCount = Array.isArray(managementActivities) ? managementActivities.length : 0
  const activitiesSubtitle = 'From Tool 3'

  // Calculate duration
  const durationMonths = calculateDurationMonths(project.start_date, project.end_date)
  const timeframe = formatDuration(durationMonths)

  // Handlers
  const handleEditProject = async (updates) => {
    if (!projectId) return { success: false, error: 'Missing project id.' }
    try {
      const updatedProject = await projectService.update(projectId, updates)
      setProject((prev) => (prev ? { ...prev, ...updatedProject } : updatedProject))
      if (setContextProject) {
        setContextProject((prev) => (prev ? { ...prev, ...updatedProject } : updatedProject))
      }
      return { success: true }
    } catch (err) {
      const message = extractErrorMessage(err)
      return { success: false, error: message }
    }
  }

  const handleNextStep = () => {
    navigate(`/app/projects/${projectId}/${nextAction.path}`)
  }

  const handleMapExpand = () => {
    // TODO: Open map in modal or new page
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Project Header Section (includes header + progress timeline) */}
      <section className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark p-6">
        {/* Header Content */}
        <ProjectHeader project={project} onEdit={handleEditProject} />

        {/* Progress Timeline */}
        <ProjectProgressTimeline workflow={currentWorkflow} />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ProjectMetricCard
              title="Risk Level"
              value={riskLabel}
              subtitle={riskSubtitle}
              icon="warning"
              iconBgColor="bg-yellow-50 dark:bg-yellow-900/20"
              iconColor="text-yellow-600 dark:text-yellow-400"
            />
            <ProjectMetricCard
              title="Activities"
              value={`${activitiesCount} Activities`}
              subtitle={activitiesSubtitle}
              icon="assessment"
              iconBgColor="bg-blue-50 dark:bg-blue-900/20"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <ProjectMetricCard
              title="Timeframe"
              value={timeframe}
              subtitle=""
              icon="event"
              iconBgColor="bg-purple-50 dark:bg-purple-900/20"
              iconColor="text-purple-600 dark:text-purple-400"
            />
          </div>

          {/* CTA Card */}
          <ProjectCTACard
            title={nextAction.title}
            description={nextAction.description}
            buttonText={`Open Tool ${nextAction.tool}`}
            buttonIcon="arrow_forward"
            onClick={handleNextStep}
          />
        </div>

        {/* Right Column (1/3) */}
        <div className="flex flex-col gap-6">
          {/* Site Card */}
          <ProjectSiteCard
            location={project.location}
            areaName="Bukit Barisan Selatan National Park"
            areaSize="245 Hectares"
            mapImageUrl={null}
            onExpand={handleMapExpand}
          />
        </div>
      </div>
    </div>
  )
}

export default ProjectOverviewPage
