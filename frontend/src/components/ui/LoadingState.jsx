import { cn } from '@/utils/cn'
import LoadingSpinner from './LoadingSpinner'

/**
 * Loading state of a page, section or route (D71): one spinner and one message style.
 *
 * @param {Object} props
 * @param {string} [props.message] - Text under the spinner
 * @param {'page'|'section'|'screen'} [props.variant] - `screen`: full viewport (route guards);
 *   `page`: a page body; `section`: inside a card or table
 *
 * @example
 * if (isLoading) return <LoadingState message="Loading dashboard..." />
 */
function LoadingState({ message = 'Loading...', variant = 'page', className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center',
        variant === 'screen' && 'min-h-screen bg-background dark:bg-background-dark',
        variant === 'page' && 'min-h-[400px] py-12',
        variant === 'section' && 'py-12',
        className
      )}
    >
      <LoadingSpinner size="xl" className="text-primary" />
      <p className="text-sm text-text-secondary dark:text-gray-400">{message}</p>
    </div>
  )
}

export default LoadingState
