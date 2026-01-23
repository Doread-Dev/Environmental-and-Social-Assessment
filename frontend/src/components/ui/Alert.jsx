import { useState } from 'react'
import { cn } from '@/utils/cn'

/**
 * Alert/Banner component for notifications
 *
 * @param {Object} props
 * @param {'info'|'success'|'warning'|'error'} props.variant
 * @param {string} props.title - Alert title
 * @param {boolean} props.dismissible - Allow dismiss
 * @param {Function} props.onDismiss - Dismiss callback
 * @param {React.ReactNode} props.icon - Custom icon
 * @param {React.ReactNode} props.action - Action button
 *
 * @example
 * <Alert variant="success" title="Success!" dismissible>
 *   Your changes have been saved.
 * </Alert>
 */
function Alert({
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  icon,
  action,
  className,
  children,
  ...props
}) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-800 dark:text-blue-300',
      text: 'text-blue-700 dark:text-blue-300',
      defaultIcon: 'info',
    },
    success: {
      container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-800 dark:text-green-300',
      text: 'text-green-700 dark:text-green-300',
      defaultIcon: 'check_circle',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-800 dark:text-yellow-300',
      text: 'text-yellow-700 dark:text-yellow-300',
      defaultIcon: 'warning',
    },
    error: {
      container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-800 dark:text-red-300',
      text: 'text-red-700 dark:text-red-300',
      defaultIcon: 'error',
    },
  }

  const styles = variants[variant]

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <div
      role="alert"
      className={cn('flex gap-3 p-4 rounded-lg border', styles.container, className)}
      {...props}
    >
      {/* Icon */}
      <span className={cn('material-symbols-outlined text-xl flex-shrink-0', styles.icon)}>
        {icon || styles.defaultIcon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && <h4 className={cn('font-semibold', styles.title)}>{title}</h4>}
        {children && (
          <p className={cn('text-sm', title && 'mt-1', styles.text)}>{children}</p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5',
            'transition-colors',
            styles.icon
          )}
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      )}
    </div>
  )
}

export default Alert
