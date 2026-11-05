import { cn } from '@/utils/cn'
import Button from './Button'

/**
 * Error state with a retry button (D71). Pass the message from `extractErrorMessage`.
 *
 * @param {Object} props
 * @param {string} [props.title]
 * @param {React.ReactNode} [props.message]
 * @param {Function} [props.onRetry] - Shows "Try again"
 * @param {React.ReactNode} [props.actions] - Extra buttons next to "Try again"
 * @param {'page'|'section'|'screen'} [props.variant]
 *
 * @example
 * if (error) return <ErrorState title="Failed to load projects" message={error} onRetry={refetch} />
 */
function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  actions,
  variant = 'page',
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center gap-3 px-6',
        variant === 'screen' && 'min-h-screen bg-background dark:bg-background-dark',
        variant === 'page' && 'min-h-[400px] py-12',
        variant === 'section' && 'py-10',
        className
      )}
    >
      <div className="size-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <span
          className="material-symbols-outlined text-2xl text-red-600 dark:text-red-400"
          aria-hidden="true"
        >
          error
        </span>
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <p className="text-base font-semibold text-text-main dark:text-white">{title}</p>
        {message && <p className="text-sm text-text-secondary dark:text-gray-400">{message}</p>}
      </div>
      {(onRetry || actions) && (
        <div className="flex flex-wrap justify-center gap-3 mt-1">
          {actions}
          {onRetry && (
            <Button
              size="sm"
              leftIcon={
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  refresh
                </span>
              }
              onClick={() => onRetry()}
            >
              Try again
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default ErrorState
