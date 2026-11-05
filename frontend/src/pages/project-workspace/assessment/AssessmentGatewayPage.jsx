/**
 * AssessmentGatewayPage
 * صفحة بوابة التقييم البيئي
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useAssessment, useScreening, useProjectContext } from '@/hooks'
import {
  AssessmentProgressIndicator,
  AssessmentStartCard,
  ProjectContextCard,
} from '@/components/assessment'
import { Button, EmptyState, LoadingState, PageHeader } from '@/components/ui'
import { getProjectRoute, ROUTES } from '@/routes/routes.config'
import { getStepStatus } from '@/utils/workflowSteps'

/**
 * Gateway state from the backend step status (locked until the screening is approved)
 */
function getGatewayStatus(stepStatus) {
  if (stepStatus === 'locked' || stepStatus === 'not_started') return stepStatus
  if (stepStatus === 'approved') return 'completed'
  return 'in_progress'
}

export default function AssessmentGatewayPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project, workflow, can } = useProjectContext()
  const { screening, isLoading: screeningLoading } = useScreening(projectId)
  const { isLoading: assessmentLoading, startAssessment } = useAssessment(projectId)

  const isLoading = screeningLoading || assessmentLoading

  if (isLoading) {
    return <LoadingState message="Loading assessment..." />
  }

  const status = getGatewayStatus(getStepStatus(workflow, 'assessment'))

  // إذا كان التقييم مقفل (Screening غير معتمد)
  if (status === 'locked') {
    return (
      <div className="max-w-4xl mx-auto bg-surface dark:bg-surface-dark rounded-xl border border-border-default dark:border-border-dark shadow-sm">
        <EmptyState
          icon="lock"
          title="Assessment Locked"
          description="Please complete and approve the Screening process before starting the Environmental Assessment."
          action={
            <Button onClick={() => navigate(getProjectRoute(projectId, ROUTES.SCREENING))}>
              Go to Screening
            </Button>
          }
        />
      </div>
    )
  }

  const handleStart = async () => {
    const result = await startAssessment()
    if (result.success) {
      navigate(getProjectRoute(projectId, ROUTES.ASSESSMENT_METADATA))
    }
  }

  const handleContinue = () => {
    // دائماً الانتقال إلى صفحة Metadata بغض النظر عن المرحلة السابقة
    navigate(getProjectRoute(projectId, ROUTES.ASSESSMENT_METADATA))
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Environmental Assessment"
        description="Tool 2 – Site-specific Environmental Assessment"
        actions={<AssessmentProgressIndicator workflow={workflow} currentStep="assessment" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AssessmentStartCard
            status={
              status === 'not_started'
                ? 'not_started'
                : status === 'completed'
                  ? 'completed'
                  : 'in_progress'
            }
            onStart={handleStart}
            onContinue={handleContinue}
            canStart={can('assessment.create')}
            canEdit={can('assessment.edit')}
          />
        </div>

        <div className="flex flex-col gap-6">
          <ProjectContextCard project={project} screening={screening} />
        </div>
      </div>
    </div>
  )
}
