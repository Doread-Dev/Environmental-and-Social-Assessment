/**
 * ApprovalSection Component
 * قسم الموافقة والتوصيات
 *
 * Features:
 * - معلومات المعتمد (اسم + منصب)
 * - Textarea للتوصيات
 * - أزرار الموافقة/الرفض مع دعم reject_reason
 */

import { useState } from 'react'
import { Card, Input, Textarea, Button, Icon } from '@/components/ui'
import { currentUser } from '@/data'
import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {string} props.approverName - اسم المعتمد
 * @param {string} props.approverPosition - منصب المعتمد
 * @param {string} props.rejectedBy - اسم من قام بالرفض
 * @param {string} props.rejectedByPosition - منصب من قام بالرفض
 * @param {string} props.recommendations - التوصيات
 * @param {string} props.rejectReason - سبب الرفض
 * @param {Function} props.onRecommendationsChange - callback للتوصيات
 * @param {Function} props.onApprove - callback عند الموافقة
 * @param {Function} props.onReject - callback عند الرفض (يستقبل reject_reason)
 * @param {string} props.status - حالة الفرز الحالية
 * @param {boolean} props.canApprove - هل يمكن للمستخدم الموافقة
 */
function ApprovalSection({
  approverName,
  approverPosition,
  rejectedBy,
  rejectedByPosition,
  recommendations,
  rejectReason,
  onRecommendationsChange,
  onApprove,
  onReject,
  status,
  canApprove = false,
  className,
  ...props
}) {
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReasonInput, setRejectReasonInput] = useState('')

  const isApproved = status === 'approved'
  const isRejected = status === 'rejected'
  const isSubmitted = status === 'submitted'

  // Use current user if approver info not provided
  const displayName = approverName || currentUser.name
  const displayPosition = approverPosition || currentUser.job_title?.title_name || 'Program Manager'

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

  return (
    <Card className={cn(className)} {...props}>
      <Card.Header>
        <Card.Title>Approval and Recommendations</Card.Title>
      </Card.Header>
      <Card.Body className="space-y-4">
        {/* Approver/Rejector Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={isRejected ? 'Rejected By' : 'Approved By'}
            value={isRejected ? rejectedBy || '' : isApproved ? displayName : ''}
            readOnly
            disabled
            leftIcon={<Icon name="person" size="sm" />}
          />
          <Input
            label="Position"
            value={isRejected ? rejectedByPosition || '' : isApproved ? displayPosition : ''}
            readOnly
            disabled
            leftIcon={<Icon name="work" size="sm" />}
          />
        </div>

        {/* Recommendations (for approval) or Reject Reason (for rejection) */}
        {!isRejected && (
          <Textarea
            label="Recommendations / Next Steps"
            placeholder="Enter any specific recommendations for the project team or next steps to be taken."
            value={recommendations || ''}
            onChange={(e) => onRecommendationsChange?.(e.target.value)}
            rows={4}
            disabled={isApproved || !canApprove}
            helperText={
              isApproved
                ? 'These recommendations were provided during approval.'
                : 'Provide recommendations or next steps for the project team.'
            }
          />
        )}

        {/* Reject Reason Input (shown when rejecting) */}
        {showRejectInput && isSubmitted && canApprove && (
          <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <Textarea
              label="Reason for Rejection"
              placeholder="Please provide a reason for rejecting this screening..."
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              rows={3}
              helperText="Explain why this screening is being rejected (optional but recommended)"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancelReject} fullWidth>
                <Icon name="close" size="sm" />
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmReject} fullWidth>
                <Icon name="check" size="sm" />
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons - Only show for submitted status when user can approve */}
        {isSubmitted && canApprove && !showRejectInput && (
          <div className="flex gap-3 pt-4 border-t border-border-default dark:border-border-dark">
            <Button variant="danger" onClick={handleRejectClick} fullWidth>
              <Icon name="close" size="sm" />
              Reject
            </Button>
            <Button variant="primary" onClick={onApprove} fullWidth>
              <Icon name="check" size="sm" />
              Approve & Complete Screening
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {isApproved && (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <Icon name="check_circle" size="md" className="text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Screening has been approved. You can proceed to the next step.
            </p>
          </div>
        )}

        {isRejected && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <Icon name="error" size="md" className="text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
                  Screening has been rejected
                </p>
                {rejectReason && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    <span className="font-medium">Reason:</span> {rejectReason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  )
}

export default ApprovalSection
