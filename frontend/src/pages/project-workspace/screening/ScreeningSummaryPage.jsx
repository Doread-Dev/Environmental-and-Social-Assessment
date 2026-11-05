/**
 * ScreeningSummaryPage
 * صفحة ملخص الفرز والموافقة
 * مطابق للتصميم الأصلي حرفياً
 *
 * Layout: ProjectLayout
 * Route: /app/projects/:projectId/screening/summary
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Input,
  Textarea,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  useToast,
  PAGE_TITLE,
} from '@/components/ui'
import { useProjectContext, useScreening } from '@/hooks'
import { useAuth } from '@/contexts'
import { getReviewer, positionOf } from '@/utils/reviewer'
import { getScreeningCategory } from '@/utils/screeningDisplay'
import { formatDate } from '@/utils/formatters'
function ScreeningSummaryPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const toast = useToast()
  const { project: contextProject, workflow, can } = useProjectContext()
  const { user: currentUser } = useAuth()
  const {
    screening: hookScreening,
    isLoading: screeningLoading,
    error: screeningError,
    refetch: refetchScreening,
    approve: approveScreening,
    reject: rejectScreening,
  } = useScreening(projectId)

  const screening = hookScreening || null
  const project =
    screening?.project && typeof screening.project === 'object' ? screening.project : contextProject

  // Initialize ALL hooks BEFORE any conditional returns
  const [recommendations, setRecommendations] = useState(screening?.recommendations || '')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReasonInput, setRejectReasonInput] = useState('')

  // Handlers - must be defined before conditional returns
  const handleExport = useCallback(async () => {
    try {
      const { exportTool, exportStatus } = await import('@/utils/excelExport')
      const fileName = await exportTool(
        'tool1',
        { project, screening },
        exportStatus(workflow, 'tool1', screening)
      )
      toast.success(`Downloaded ${fileName}`)
    } catch (error) {
      toast.error('Failed to export Excel file')
      console.error('Export error:', error)
    }
  }, [project, screening, workflow, toast])

  const handleEdit = useCallback(() => {
    // Navigate to form with edit mode - router will show form for rejected status
    navigate(`/app/projects/${projectId}/screening?edit=true`)
  }, [navigate, projectId])

  const handleProceedToAssessment = useCallback(() => {
    navigate(`/app/projects/${projectId}/assessment`)
  }, [navigate, projectId])

  const handleApprove = useCallback(async () => {
    // Recommendations are optional on approval (D56)
    setIsProcessing(true)
    try {
      const result = await approveScreening(recommendations)

      if (result.success) {
        toast.success('Screening approved successfully!')
      } else {
        toast.error(result.error || 'Failed to approve screening. Please try again.')
      }
    } catch {
      toast.error('Failed to approve screening. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [approveScreening, recommendations, toast])

  const handleRejectClick = useCallback(() => {
    setShowRejectInput(true)
  }, [])

  const handleConfirmReject = useCallback(async () => {
    setIsProcessing(true)
    try {
      const result = await rejectScreening(rejectReasonInput)

      if (result.success) {
        setShowRejectInput(false)
        setRejectReasonInput('')
        toast.success('Screening rejected.')
      } else {
        toast.error(result.error || 'Failed to reject screening. Please try again.')
      }
    } catch {
      toast.error('Failed to reject screening. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [rejectScreening, rejectReasonInput, toast])

  const handleCancelReject = useCallback(() => {
    setShowRejectInput(false)
    setRejectReasonInput('')
  }, [])

  // Expose export handler to parent layout via custom event
  useEffect(() => {
    const status = screening?.status || 'draft'
    if (status === 'submitted' || status === 'approved' || status === 'rejected') {
      const handleExportEvent = () => {
        handleExport()
      }
      window.addEventListener('screening-export', handleExportEvent)
      return () => {
        window.removeEventListener('screening-export', handleExportEvent)
      }
    }
  }, [screening?.status, handleExport])

  // Update recommendations when screening changes
  useEffect(() => {
    setRecommendations(screening?.recommendations || '')
  }, [screening?.recommendations])

  // Show error state with Try Again - AFTER all hooks
  if (screeningError) {
    return (
      <ErrorState
        title="Failed to load the screening"
        message={screeningError}
        onRetry={refetchScreening}
      />
    )
  }

  // Show loading state - AFTER all hooks
  if (screeningLoading) {
    return <LoadingState message="Loading screening..." />
  }

  if (!screening) {
    return (
      <EmptyState
        icon="fact_check"
        title="No screening data found for this project."
        action={
          <Button onClick={() => navigate(`/app/projects/${projectId}/screening`)}>
            Start Screening
          </Button>
        }
      />
    )
  }

  // Calculate derived values AFTER conditional returns
  const status = screening.status || 'draft'
  const categoryInfo = getScreeningCategory(screening.category_code)

  // Allowed actions from the backend: specialist/admin, submitted, project not archived (D35)
  const canApproveScreening = can('screening.approve')

  const officer =
    screening?.officer && typeof screening.officer === 'object' ? screening.officer : null
  // Approved / rejected: the reviewer, from the record or its status history (D16).
  // When pending approval and current user can approve: show current user in "Approved By" so approval is linked to them
  const asPerson = (user) => (user ? { name: user.name, position: positionOf(user) } : null)
  const approvalUser =
    status === 'approved'
      ? getReviewer(screening, 'approved')
      : status === 'rejected'
        ? getReviewer(screening, 'rejected')
        : status === 'submitted' && canApproveScreening && currentUser
          ? asPerson(currentUser)
          : asPerson(officer)

  // Parse impacts into list items
  const negativeItems =
    screening.potential_negative
      ?.split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*]\s*/, '')) || []

  const positiveItems =
    screening.potential_positive
      ?.split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*]\s*/, '')) || []

  // Format screening date - لا يظهر في حالة submitted
  const screeningDateFormatted =
    status !== 'submitted' && screening.screening_date ? formatDate(screening.screening_date) : ''

  // Parse project components (split by comma or use project_component field)
  const projectComponents =
    project?.project_component
      ?.split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 3) || []

  return (
    <div className="flex flex-col gap-8">
      {/* Main Container - مطابق للتصميم الأصلي */}
      <form className="flex flex-col gap-8 print-container">
        <div className="max-w-[960px] mx-auto bg-surface dark:bg-surface-dark shadow-sm rounded-xl overflow-hidden min-h-[800px] flex flex-col print-container">
          {/* Header Section */}
          <div className="p-8 pb-4 border-b border-border-default dark:border-border-dark">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className={PAGE_TITLE}>Environmental Integration Screening</h1>
                  <StatusBadge
                    status={status}
                    label={status === 'submitted' ? 'Pending Approval' : undefined}
                  />
                </div>
                <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base">
                  Project: {project?.title || 'N/A'}
                </p>
              </div>
              {screeningDateFormatted && (
                <div className="text-right flex flex-col items-end">
                  <span className="text-xs text-text-secondary dark:text-gray-400 uppercase tracking-wider font-semibold">
                    Screening Date
                  </span>
                  <span className="text-text-main dark:text-white font-medium">
                    {screeningDateFormatted}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Officer Info & Project Components Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-default dark:bg-border-dark">
            {/* Program Officer */}
            <div className="bg-surface dark:bg-surface-dark p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400 mb-1">
                Program Officer
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-background dark:bg-white/5 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-text-secondary dark:text-gray-400 text-sm"
                    aria-hidden="true"
                  >
                    person
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-main dark:text-white">
                    {officer?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-text-secondary dark:text-gray-400">
                    {positionOf(officer) || 'Program Officer'}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Components */}
            <div className="bg-surface dark:bg-surface-dark p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400 mb-1">
                Project Components
              </h3>
              <div className="flex gap-2 flex-wrap">
                {projectComponents.length > 0 ? (
                  projectComponents.map((component, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-background dark:bg-white/5 text-text-main dark:text-gray-200"
                    >
                      {component}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-text-secondary dark:text-gray-400">
                    No components specified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Risk Category Card */}
          {categoryInfo && (
            <div className="p-8">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-900 to-green-950 dark:from-card-dark dark:to-background-dark text-white p-8 shadow-md">
                {/* Background Icon */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="material-symbols-outlined text-[120px]" aria-hidden="true">
                    security
                  </span>
                </div>

                {/* Main Content */}
                <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
                  {/* Category Circle */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center text-yellow-500">
                    <span className="text-2xl font-bold">{screening.category_code}</span>
                  </div>

                  {/* Category Info */}
                  <div className="flex-1">
                    <h2 className="text-lg font-bold mb-1">
                      Category {screening.category_code}: {categoryInfo.label}
                    </h2>
                    <p className="text-green-100 dark:text-gray-300 text-sm leading-relaxed max-w-2xl">
                      {categoryInfo.description}
                    </p>
                  </div>
                </div>

                {/* Justification Section */}
                {screening.category_reason && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="text-xs uppercase tracking-wider text-text-disabled font-semibold mb-2">
                      Justification
                    </h4>
                    <p className="text-sm text-green-50 dark:text-gray-200 italic">
                      "{screening.category_reason}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Impacts Grid */}
          <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Negative Impacts */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border-default dark:border-border-dark">
                <span className="material-symbols-outlined text-orange-500" aria-hidden="true">
                  warning
                </span>
                <h3 className="text-base font-bold text-text-main dark:text-white">
                  Potential Negative Impacts
                </h3>
              </div>
              {negativeItems.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {negativeItems.map((item, index) => (
                    <li
                      key={index}
                      className="flex gap-3 items-start p-3 rounded-lg bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30"
                    >
                      <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></div>
                      <span className="text-sm text-text-main dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-secondary dark:text-gray-400">None specified</p>
              )}
            </div>

            {/* Positive Impacts */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border-default dark:border-border-dark">
                <span className="material-symbols-outlined text-primary" aria-hidden="true">
                  verified
                </span>
                <h3 className="text-base font-bold text-text-main dark:text-white">
                  Potential Positive Impacts
                </h3>
              </div>
              {positiveItems.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {positiveItems.map((item, index) => (
                    <li
                      key={index}
                      className="flex gap-3 items-start p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30"
                    >
                      <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                      <span className="text-sm text-text-main dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-secondary dark:text-gray-400">None specified</p>
              )}
            </div>
          </div>

          {/* Approval Section */}
          <div className="mt-6 mb-6 px-8">
            <section className="bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
              <div className="px-6 py-4 border-b border-border-default dark:border-border-dark bg-background dark:bg-white/5">
                <h3 className="font-bold text-lg text-text-main dark:text-white">
                  Approval and Recommendations
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Approved/Rejected By */}
                <Input
                  label={status === 'rejected' ? 'Rejected By' : 'Approved By'}
                  readOnly
                  type="text"
                  value={approvalUser?.name || 'N/A'}
                  inputClassName="font-medium"
                />

                {/* Position */}
                <Input
                  label="Position"
                  readOnly
                  type="text"
                  value={approvalUser?.position || 'N/A'}
                  inputClassName="font-medium"
                />

                {/* Reject Reason (shown when rejected) */}
                {status === 'rejected' && screening.reject_reason && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                      Reason for Rejection
                    </label>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">
                        {screening.reject_reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recommendations (only shown when not rejected) */}
                {status !== 'rejected' && (
                  <div className="col-span-1 md:col-span-2">
                    <Textarea
                      label="Recommendations / Next Steps"
                      placeholder="Enter any specific recommendations for the project team (optional)..."
                      rows={3}
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                      disabled={
                        status === 'approved' || status === 'rejected' || !canApproveScreening
                      }
                      helperText={
                        status === 'submitted' && canApproveScreening ? 'Optional' : undefined
                      }
                    />
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-auto bg-background dark:bg-white/5 border-t border-border-default dark:border-border-dark p-8">
            <div className="flex flex-col gap-6">
              {/* Action Buttons */}
              {status === 'submitted' && canApproveScreening && (
                <div className="flex justify-end gap-4 no-print">
                  {/* Reject Reason Input (shown when rejecting) */}
                  {showRejectInput && (
                    <div className="w-full space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800 mb-4">
                      <div className="flex flex-col gap-2">
                        <Textarea
                          label="Reason for Rejection"
                          value={rejectReasonInput}
                          onChange={(e) => setRejectReasonInput(e.target.value)}
                          placeholder="Please provide a reason for rejecting this screening..."
                          rows={3}
                          helperText="Explain why this screening is being rejected (optional but recommended)"
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={handleCancelReject}
                          disabled={isProcessing}
                        >
                          <span className="material-symbols-outlined text-lg" aria-hidden="true">
                            close
                          </span>
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          type="button"
                          onClick={handleConfirmReject}
                          disabled={isProcessing}
                        >
                          <span className="material-symbols-outlined text-lg" aria-hidden="true">
                            check
                          </span>
                          {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!showRejectInput && (
                    <>
                      <Button
                        variant="danger"
                        type="button"
                        onClick={handleRejectClick}
                        disabled={isProcessing}
                      >
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">
                          close
                        </span>
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        type="button"
                        onClick={handleApprove}
                        disabled={isProcessing}
                      >
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">
                          verified
                        </span>
                        {isProcessing ? 'Processing...' : 'Approve & Complete Screening'}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {status === 'approved' && (
                <div className="flex justify-end gap-4 no-print">
                  <Button variant="primary" type="button" onClick={handleProceedToAssessment}>
                    Proceed to Assessment
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">
                      arrow_forward
                    </span>
                  </Button>
                </div>
              )}

              {status === 'rejected' && can('screening.edit') && (
                <div className="flex justify-end gap-4 no-print">
                  <Button variant="primary" type="button" onClick={handleEdit}>
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">
                      edit
                    </span>
                    Edit Screening
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ScreeningSummaryPage
