/**
 * AssessmentApprovalSection Component
 * قسم الموافقة على التقييم
 * مع دعم reject_reason workflow
 */

import { useState } from 'react'
import { Button, Textarea, LoadingSpinner } from '@/components/ui'

/**
 * @param {Object} props
 * @param {string} props.approverName - اسم المعتمد
 * @param {string} props.approverPosition - منصب المعتمد
 * @param {string} props.rejectedBy - اسم من قام بالرفض
 * @param {string} props.rejectedByPosition - منصب من قام بالرفض
 * @param {string} props.recommendations - التوصيات
 * @param {string} props.rejectReason - سبب الرفض
 * @param {Function} props.onRecommendationsChange - callback للتوصيات
 * @param {Function} props.onApprove - callback للموافقة
 * @param {Function} props.onReject - callback للرفض (يستقبل reject_reason)
 * @param {Function} props.onEdit - callback للتعديل
 * @param {string} props.status - حالة التقييم
 * @param {boolean} props.canApprove - هل يمكن الموافقة
 */
export default function AssessmentApprovalSection({
  approverName,
  approverPosition,
  rejectedBy,
  rejectedByPosition,
  recommendations = '',
  rejectReason,
  onRecommendationsChange,
  onApprove,
  onReject,
  onEdit,
  status,
  canApprove = false,
  isSaving = false,
}) {
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReasonInput, setRejectReasonInput] = useState('')

  const handleApprove = () => {
    onApprove?.(recommendations)
  }

  const handleRejectClick = () => {
    setShowRejectInput(true)
  }

  const handleConfirmReject = () => {
    onReject?.(rejectReasonInput)
    setShowRejectInput(false)
    setRejectReasonInput('')
  }

  const handleCancelReject = () => {
    setShowRejectInput(false)
    setRejectReasonInput('')
  }

  if (status === 'approved') {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">
            check_circle
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">
              Assessment Approved
            </h3>
            {approverName && (
              <p className="text-sm text-green-700 dark:text-green-400">
                Approved by: {approverName}
                {approverPosition && ` (${approverPosition})`}
              </p>
            )}
            {recommendations && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                  Recommendations:
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 whitespace-pre-wrap">
                  {recommendations}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">
            cancel
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-2">
              Assessment Rejected
            </h3>
            {rejectedBy && (
              <p className="text-sm text-red-700 dark:text-red-400">
                Rejected by: {rejectedBy}
                {rejectedByPosition && ` (${rejectedByPosition})`}
              </p>
            )}
            {rejectReason && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                  Reason for Rejection:
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">
                  {rejectReason}
                </p>
              </div>
            )}
            {onEdit && (
              <Button onClick={onEdit} variant="outline" className="mt-4">
                Edit Assessment
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (status === 'submitted' && canApprove) {
    return (
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-default dark:border-border-dark p-6">
        <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Review & Approval</h3>

        <div className="space-y-4">
          {/* Recommendations for Approval */}
          {!showRejectInput && (
            <div>
              <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
                Recommendations (Optional)
              </label>
              <Textarea
                value={recommendations}
                onChange={(e) => onRecommendationsChange?.(e.target.value)}
                placeholder="Add any recommendations or notes..."
                rows={4}
              />
            </div>
          )}

          {/* Reject Reason Input (shown when rejecting) */}
          {showRejectInput && (
            <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <label className="block text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                  Reason for Rejection
                </label>
                <Textarea
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="Please provide a reason for rejecting this assessment..."
                  rows={3}
                  helperText="Explain why this assessment is being rejected (optional but recommended)"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCancelReject}
                  variant="outline"
                  disabled={isSaving}
                  className="flex-1"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmReject}
                  variant="danger"
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check</span>
                      Confirm Rejection
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showRejectInput && (
            <div className="flex gap-4">
              <Button onClick={handleApprove} disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Approving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Approve Assessment
                  </>
                )}
              </Button>
              <Button
                onClick={handleRejectClick}
                variant="danger"
                disabled={isSaving}
                className="flex-1"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
                Reject Assessment
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
