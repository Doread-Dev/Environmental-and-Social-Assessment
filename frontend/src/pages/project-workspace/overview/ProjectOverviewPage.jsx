/**
 * ProjectOverviewPage
 * صفحة نظرة عامة على المشروع
 * مطابق للتصميم الأصلي حرفياً
 *
 * Layout: ProjectLayout (موجود)
 * Route: /app/projects/:projectId/overview
 */

import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ProjectHeader,
  ProjectProgressTimeline,
  ProjectMetricCard,
  ProjectCTACard,
  ProjectSiteCard,
} from '@/components/project'
import { useProjectContext } from '@/hooks'
import { mockProjects, getScreeningCategory } from '@/data'
import { calculateDurationMonths, formatDuration } from '@/utils/formatters'

/**
 * حساب الإجراء التالي بناءً على workflow
 */
function getNextAction(workflow) {
  if (!workflow) {
    return {
      tool: 1,
      path: 'screening',
      title: 'Start Screening',
      description: 'Begin the environmental screening process for this project.',
    }
  }

  // --- Screening Logic ---
  if (workflow.screening?.status === 'draft' || workflow.screening?.status === 'pending') {
    return {
      tool: 1,
      path: 'screening',
      title: 'Complete Screening',
      description: 'Complete the environmental screening form to categorize project risk.',
    }
  }

  if (workflow.screening?.status === 'rejected') {
    return {
      tool: 1,
      path: 'screening',
      title: 'Revise Screening',
      description: 'Your screening was rejected. Please review feedback and resubmit.',
    }
  }

  if (workflow.screening?.status === 'submitted' || workflow.screening?.status === 'needs_action') {
    return {
      tool: 1,
      path: 'screening',
      title: 'Review Screening',
      description: 'The screening requires your attention. Please review and update.',
    }
  }

  // --- Assessment Logic (after screening is approved) ---
  const assessmentStatus = workflow.assessment?.status

  if (!assessmentStatus || assessmentStatus === 'pending') {
    return {
      tool: 2,
      path: 'assessment',
      title: 'Start Assessment',
      description: 'Begin the environmental impact assessment process.',
    }
  }

  if (assessmentStatus === 'draft' || assessmentStatus === 'in_progress') {
    return {
      tool: 2,
      path: 'assessment',
      title: 'Continue Assessment',
      description: 'Continue working on the environmental impact assessment.',
    }
  }

  if (assessmentStatus === 'rejected') {
    return {
      tool: 2,
      path: 'assessment',
      title: 'Revise Assessment',
      description: 'Your assessment was rejected. Please review feedback and resubmit.',
    }
  }

  if (assessmentStatus === 'submitted') {
    return {
      tool: 2,
      path: 'assessment',
      title: 'Review Assessment',
      description: 'The assessment is pending approval. Review the submitted details.',
    }
  }

  // --- SEMP Logic (after assessment is approved) ---
  if (workflow.semp?.status !== 'completed') {
    return {
      tool: 3,
      path: 'semp',
      title: 'Complete Management Plan (SEMP)',
      description:
        'The environmental assessment has been approved. Please proceed with defining mitigation strategies in Tool 3.',
    }
  }

  return {
    tool: 5,
    path: 'monitoring',
    title: 'Start Monitoring',
    description: 'Begin monitoring and reporting environmental indicators.',
  }
}

function ProjectOverviewPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { project: contextProject } = useProjectContext()

  // Get project data from mockProjects
  const project = useMemo(() => {
    if (contextProject && contextProject._id) {
      return mockProjects.find((p) => p._id === contextProject._id) || contextProject
    }
    return mockProjects.find((p) => p._id === projectId) || contextProject
  }, [projectId, contextProject])

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-text-secondary dark:text-gray-400">Project not found</p>
        </div>
      </div>
    )
  }

  const workflow = project.workflow || {}
  const screening = project.screening || {}
  const nextAction = getNextAction(workflow)

  // Calculate metrics
  const riskCategory = screening.category_code || 'N/A'
  const riskCategoryInfo = riskCategory !== 'N/A' ? getScreeningCategory(riskCategory) : null
  const riskLabel = riskCategoryInfo ? `Category ${riskCategory}` : 'Not Assigned'
  const riskSubtitle = riskCategoryInfo ? riskCategoryInfo.label : ''

  // Mock activities count (في الإنتاج سيأتي من API)
  const activitiesCount = 4
  const activitiesSubtitle = 'From Tool 3'

  // Calculate duration
  const durationMonths = calculateDurationMonths(project.start_date, project.end_date)
  const timeframe = formatDuration(durationMonths)

  // Handlers
  const handleEditProject = () => {
    // TODO: Navigate to edit project page - will open modal
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
        <ProjectProgressTimeline workflow={workflow} />
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
