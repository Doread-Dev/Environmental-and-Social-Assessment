import { ConfirmDialog } from '@/components/ui'

// One wording for Screening and Assessment (D74 6)
const DECISIONS = {
  approve: {
    title: (tool) => `Approve the ${tool}?`,
    message: (tool) =>
      `The ${tool} is approved with your recommendations and can no longer be edited. The next tool opens for the project team.`,
    confirmLabel: 'Approve',
    confirmIcon: 'verified',
    variant: 'primary',
  },
  reject: {
    title: (tool) => `Reject the ${tool}?`,
    message: (tool) =>
      `The ${tool} goes back to the project team with your reason. They can edit it and submit it again.`,
    confirmLabel: 'Reject',
    confirmIcon: 'close',
    variant: 'danger',
  },
}

/**
 * Confirmation before an approve or a reject (D74 6), the same in both reviewed tools: an in-app
 * ConfirmDialog, the request goes out only after "Approve" / "Reject" in it.
 *
 * @param {Object} props
 * @param {'approve'|'reject'} props.decision
 * @param {'screening'|'assessment'} props.tool
 * @param {boolean} [props.isLoading]
 * @param {Function} props.onConfirm
 * @param {Function} props.onClose
 */
function ReviewDecisionDialog({ decision, tool, isLoading = false, onConfirm, onClose }) {
  const text = DECISIONS[decision]
  return (
    <ConfirmDialog
      title={text.title(tool)}
      message={<p>{text.message(tool)}</p>}
      confirmLabel={text.confirmLabel}
      confirmIcon={text.confirmIcon}
      variant={text.variant}
      isLoading={isLoading}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}

export default ReviewDecisionDialog
