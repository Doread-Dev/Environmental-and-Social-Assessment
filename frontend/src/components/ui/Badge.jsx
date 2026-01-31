import { cn } from '@/utils/cn'

/**
 * Badge component for status indicators
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
function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className,
  children,
  ...props
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    primary: 'bg-primary/10 text-primary dark:bg-primary/20',
  }

  const dotColors = {
    default: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    primary: 'bg-primary',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

export default Badge
