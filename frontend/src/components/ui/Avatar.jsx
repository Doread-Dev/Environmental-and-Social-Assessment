import { useState } from 'react'
import { cn } from '@/utils/cn'

/**
 * Avatar component with fallback
 *
 * @param {Object} props
 * @param {string} props.src - Image source
 * @param {string} props.alt - Alt text
 * @param {string} props.fallback - Fallback initials (e.g., "JD")
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} props.size
 * @param {'circle'|'square'} props.shape
 * @param {'online'|'offline'|'away'|'busy'} props.status
 *
 * @example
 * <Avatar src="/user.jpg" alt="John Doe" fallback="JD" />
 * <Avatar fallback="AB" size="lg" status="online" />
 */
function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  shape = 'circle',
  status,
  className,
  ...props
}) {
  const [hasError, setHasError] = useState(false)

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  }

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  }

  const shapes = {
    circle: 'rounded-full',
    square: 'rounded-lg',
  }

  const showFallback = !src || hasError

  return (
    <div className={cn('relative inline-flex', className)} {...props}>
      {showFallback ? (
        <div
          className={cn(
            'flex items-center justify-center',
            'bg-primary/10 text-primary font-medium',
            sizes[size],
            shapes[shape]
          )}
        >
          {fallback || <span className="material-symbols-outlined">person</span>}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className={cn('object-cover', sizes[size], shapes[shape])}
        />
      )}

      {/* Status indicator */}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0',
            'border-2 border-white dark:border-surface-dark rounded-full',
            statusSizes[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  )
}

export default Avatar
