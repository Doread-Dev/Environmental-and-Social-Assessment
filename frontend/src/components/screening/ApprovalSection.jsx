/**
 * ApprovalSection Component
 * قسم الموافقة والتوصيات
 * 
 * Features:
 * - معلومات المعتمد (اسم + منصب)
 * - Textarea للتوصيات
 * - أزرار الموافقة/الرفض
 */

import { Card, Input, Textarea, Button, Icon } from '@/components/ui'
import { currentUser } from '@/data'
import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {string} props.approverName - اسم المعتمد
 * @param {string} props.approverPosition - منصب المعتمد
 * @param {string} props.recommendations - التوصيات
 * @param {Function} props.onRecommendationsChange - callback للتوصيات
 * @param {Function} props.onApprove - callback عند الموافقة
 * @param {Function} props.onReject - callback عند الرفض
 * @param {string} props.status - حالة الفرز الحالية
 * @param {boolean} props.canApprove - هل يمكن للمستخدم الموافقة
 */
function ApprovalSection({
  approverName,
  approverPosition,
  recommendations,
  onRecommendationsChange,
  onApprove,
  onReject,
  status,
  canApprove = false,
  className,
  ...props
}) {
  const isApproved = status === 'approved'
  const isRejected = status === 'rejected'
  const isSubmitted = status === 'submitted'
  const isPending = isSubmitted && canApprove

  // Use current user if approver info not provided
  const displayName = approverName || currentUser.name
  const displayPosition = approverPosition || currentUser.job_title?.title_name || 'Program Manager'

  return (
    <Card className={cn(className)} {...props}>
      <Card.Header>
        <Card.Title>Approval and Recommendations</Card.Title>
      </Card.Header>
      <Card.Body className="space-y-4">
        {/* Approver Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Approved By"
            value={isApproved ? displayName : ''}
            readOnly
            disabled
            leftIcon={<Icon name="person" size="sm" />}
          />
          <Input
            label="Position"
            value={isApproved ? displayPosition : ''}
            readOnly
            disabled
            leftIcon={<Icon name="work" size="sm" />}
          />
        </div>

        {/* Recommendations */}
        <Textarea
          label="Recommendations / Next Steps"
          placeholder="Enter any specific recommendations for the project team or next steps to be taken."
          value={recommendations || ''}
          onChange={(e) => onRecommendationsChange?.(e.target.value)}
          rows={4}
          disabled={isApproved || isRejected || !canApprove}
          helperText={
            isApproved || isRejected
              ? 'These recommendations were provided during approval.'
              : 'Provide recommendations or next steps for the project team.'
          }
        />

        {/* Action Buttons - Only show for submitted status when user can approve */}
        {isSubmitted && canApprove && (
          <div className="flex gap-3 pt-4 border-t border-border-default dark:border-border-dark">
            <Button variant="danger" onClick={onReject} fullWidth>
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
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <Icon name="error" size="md" className="text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">
              Screening has been rejected. Please review and update the screening form.
            </p>
          </div>
        )}
      </Card.Body>
    </Card>
  )
}

export default ApprovalSection
