/**
 * ScreeningInfoSection Component
 * Screening details (section 1)
 *
 * Features:
 * - officer name and position (read-only, from the current user)
 * - screening date (editable)
 */

import { useAuth, ROLE_LABELS } from '@/contexts'
import { cn } from '@/utils/cn'
import { Input } from '@/components/ui'

/**
 * @param {Object} props
 * @param {string} props.officerName - Officer name
 * @param {string} props.officerPosition - Officer position
 * @param {string} props.screeningDate - Screening date
 * @param {Function} props.onDateChange - Called when the date changes
 * @param {boolean} props.readOnly - Read-only mode
 * @param {string} props.error - Error message
 */
function ScreeningInfoSection({
  officerName,
  officerPosition,
  screeningDate,
  onDateChange,
  readOnly = false,
  error,
  className,
  ...props
}) {
  const { user } = useAuth()

  // Use current user if not provided
  const displayName = officerName || user?.name || 'N/A'
  const displayPosition =
    officerPosition ||
    user?.job_title?.title_name ||
    (user?.role ? ROLE_LABELS[user.role] : null) ||
    'Program Officer'

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-6', className)} {...props}>
      {/* Officer Name (read-only: the signed-in or recorded officer) */}
      <Input
        label="Program Officer Name"
        required
        readOnly
        type="text"
        value={displayName}
        inputClassName="font-medium"
      />

      {/* Officer Position */}
      <Input
        label="Program Officer Position"
        required
        readOnly
        type="text"
        value={displayPosition}
        inputClassName="font-medium"
      />

      {/* Screening Date */}
      <Input
        className="md:col-span-2"
        label="Screening Date"
        required
        type="date"
        value={screeningDate || ''}
        onChange={(e) => onDateChange?.(e.target.value)}
        disabled={readOnly}
        error={error}
      />
    </div>
  )
}

export default ScreeningInfoSection
