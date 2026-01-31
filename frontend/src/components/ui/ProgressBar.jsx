import { cn } from '@/utils/cn'

/**
 * Progress bar component
 *
 * @param {Object} props
 * @param {number} props.value - Current value (0-100)
 * @param {number} props.max - Maximum value
 * @param {'sm'|'md'|'lg'} props.size - Bar height
 * @param {'default'|'success'|'warning'|'error'|'primary'} props.variant
 * @param {boolean} props.showLabel - Show percentage label
 * @param {boolean} props.animated - Animate progress bar
 * @param {string} props.label - Custom label
 *
 * @example
 * <ProgressBar value={75} showLabel />
 * <ProgressBar value={30} variant="warning" size="lg" />
 */
function ProgressBar({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  animated = false,
  label,
  className,
  ...props
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  const variants = {
    default: 'bg-gray-500',
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      {/* Label */}
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm font-medium text-text-main dark:text-white">{label}</span>
          )}
          {showLabel && (
            <span className="text-sm text-text-secondary dark:text-gray-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress track */}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          'bg-gray-200 dark:bg-border-dark',
          sizes[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {/* Progress fill */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            variants[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
