import { cn } from '@/utils/cn'

/**
 * Badge component for labels and status pills (one look across the app, D71).
 * For workflow / record / project statuses use `StatusBadge`, which picks the variant.
 *
 * @param {Object} props
 * @param {'default'|'success'|'warning'|'error'|'info'|'primary'} props.variant
 * @param {'sm'|'md'|'lg'} props.size
 * @param {boolean} props.dot - Show status dot
 * @param {React.ReactNode} props.icon - Badge icon
 *
 * @example
 * <Badge variant="success">Approved</Badge>
 * <Badge variant="warning" dot>Pending</Badge>
 * <Badge variant="error" icon={<Icon name="error" />}>Failed</Badge>
 */
const BADGE_VARIANTS = {
  default:
    'bg-background text-text-secondary ring-1 ring-inset ring-border-default dark:bg-white/5 dark:text-gray-300 dark:ring-border-dark',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  primary: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-green-300',
}

const DOT_COLORS = {
  default: 'bg-text-secondary dark:bg-white/40',
  success: 'bg-green-600 dark:bg-green-400',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  primary: 'bg-primary',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap',
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.default,
        SIZES[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_COLORS[variant])}
          aria-hidden="true"
        />
      )}
      {icon && (
        <span className="flex-shrink-0 flex" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}

export default Badge
