/**
 * ScreeningRouter Component
 * يوجه المستخدم للصفحة المناسبة حسب حالة Screening
 *
 * المنطق:
 * - لا يوجد screening أو draft → ScreeningFormPage
 * - submitted → ScreeningSummaryPage (مع Approve/Reject)
 * - rejected → ScreeningSummaryPage (مع Edit button)
 * - approved → ScreeningSummaryPage (مع Print button)
 */

import { useParams, useSearchParams } from 'react-router-dom'
import { useScreening } from '@/hooks'
import ScreeningFormPage from './ScreeningFormPage'
import ScreeningSummaryPage from './ScreeningSummaryPage'
import { LoadingState } from '@/components/ui'

function ScreeningRouter() {
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const { screening, isLoading } = useScreening(projectId)

  // Check if we're in edit mode (from rejected status)
  const isEditMode = searchParams.get('edit') === 'true'

  // Show loading state
  if (isLoading) {
    return <LoadingState message="Loading..." />
  }

  // Determine which page to show based on status
  const status = screening?.status || null

  // If no screening exists or status is draft → show Form
  if (!screening || status === 'draft') {
    return <ScreeningFormPage />
  }

  // If edit mode is requested (from rejected status) → show Form
  if (isEditMode && status === 'rejected') {
    return <ScreeningFormPage />
  }

  // For all other statuses (submitted, rejected, approved) → show Summary
  return <ScreeningSummaryPage />
}

export default ScreeningRouter
