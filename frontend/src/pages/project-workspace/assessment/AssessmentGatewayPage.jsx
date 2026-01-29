/**
 * AssessmentGatewayPage
 * صفحة بوابة التقييم البيئي
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useAssessment, useScreening, useProjectContext } from '@/hooks'
import {
  AssessmentProgressIndicator,
  AssessmentStartCard,
  ProjectContextCard
} from '@/components/assessment'
import { LoadingSpinner } from '@/components/ui'

/**
 * تحديد حالة التقييم
 */
function getAssessmentStatus(assessment, screening) {
  // لا يمكن بدء التقييم إذا لم يُعتمد الفرز
  if (screening?.status !== 'approved') {
    return 'locked'
  }

  if (!assessment || !assessment._id) {
    return 'not_started'
  }

  if (assessment.status === 'approved') {
    return 'completed'
  }

  return 'in_progress'
}

export default function AssessmentGatewayPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project } = useProjectContext()
  const { screening, isLoading: screeningLoading } = useScreening(projectId)
  const { assessment, methods, consultations, isLoading: assessmentLoading, startAssessment } = useAssessment(projectId)

  const isLoading = screeningLoading || assessmentLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const status = getAssessmentStatus(assessment, screening)

  // إذا كان التقييم مقفل (Screening غير معتمد)
  if (status === 'locked') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-400">lock</span>
            <h2 className="text-2xl font-bold text-text-main dark:text-white">
              Assessment Locked
            </h2>
            <p className="text-text-secondary max-w-md">
              Please complete and approve the Screening process before starting the Environmental
              Assessment.
            </p>
            <button
              onClick={() => navigate(`/app/projects/${projectId}/screening`)}
              className="mt-4 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
            >
              Go to Screening
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleStart = async () => {
    const result = await startAssessment()
    if (result.success) {
      navigate(`/app/projects/${projectId}/assessment/metadata`)
    }
  }

  const handleContinue = () => {
    // دائماً الانتقال إلى صفحة Metadata بغض النظر عن المرحلة السابقة
    navigate(`/app/projects/${projectId}/assessment/metadata`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-text-main dark:text-white">
              Environmental Assessment
            </h1>
            <p className="text-text-secondary mt-1">Tool 2 – Site-specific Environmental Assessment</p>
          </div>
          <AssessmentProgressIndicator
            currentStep={2}
            screeningComplete={screening?.status === 'approved'}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AssessmentStartCard
            status={status === 'not_started' ? 'not_started' : status === 'completed' ? 'completed' : 'in_progress'}
            onStart={handleStart}
            onContinue={handleContinue}
          />
        </div>

        {/* Sidebar (1/3) */}
        <div className="flex flex-col gap-6">
          <ProjectContextCard project={project} screening={screening} />
        </div>
      </div>
    </div>
  )
}
