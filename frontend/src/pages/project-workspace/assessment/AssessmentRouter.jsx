/**
 * AssessmentRouter
 * مكون توجيه ذكي لصفحات التقييم
 */

import { useParams } from 'react-router-dom'
import { useAssessment, useProjectContext } from '@/hooks'
import { isStepLocked } from '@/utils/workflowSteps'
import AssessmentGatewayPage from './AssessmentGatewayPage'
import AssessmentReviewPage from './AssessmentReviewPage'
import { LoadingState } from '@/components/ui'

/**
 * Assessment Workflow Flow:
 *
 * 1. /assessment → AssessmentRouter يفحص الحالة:
 *    - screening.status !== 'approved' → يعرض رسالة "Complete Screening First"
 *    - لا يوجد assessment → AssessmentGatewayPage
 *    - status = 'draft' → AssessmentGatewayPage (يعرض Continue button)
 *    - status = 'submitted' أو 'rejected' أو 'approved' → AssessmentReviewPage
 *
 * 2. /assessment/metadata → AssessmentMetadataPage
 * 3. /assessment/methods → AssessmentMethodsPage
 * 4. /assessment/scoring → AssessmentScoringPage
 * 5. /assessment/review → AssessmentReviewPage (للعرض/الموافقة)
 */
export default function AssessmentRouter() {
  const { projectId } = useParams()
  const { workflow } = useProjectContext()
  const { assessment, isLoading } = useAssessment(projectId)

  if (isLoading) {
    return <LoadingState message="Loading assessment..." />
  }

  // Tool 2 stays locked until the screening is approved (backend workflow)
  if (isStepLocked(workflow, 'assessment')) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-surface dark:bg-surface-dark rounded-xl border border-border-default dark:border-border-dark p-8 text-center">
          <span
            className="material-symbols-outlined text-6xl text-text-disabled mb-4"
            aria-hidden="true"
          >
            lock
          </span>
          <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">
            Complete Screening First
          </h2>
          <p className="text-text-secondary mb-4">
            Please complete and approve the Screening process before starting the Environmental
            Assessment.
          </p>
        </div>
      </div>
    )
  }

  // تحديد الصفحة المناسبة
  if (!assessment || !assessment._id) {
    return <AssessmentGatewayPage />
  }

  if (
    assessment.status === 'submitted' ||
    assessment.status === 'approved' ||
    assessment.status === 'rejected'
  ) {
    return <AssessmentReviewPage />
  }

  // draft - يعرض Gateway للمتابعة
  return <AssessmentGatewayPage />
}
