/**
 * SempStatusBadge Component
 * شارة حالة SEMP
 */

import { cn } from '@/utils/cn'

const statusConfig = {
  not_started: {
    label: 'Not Started',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    textClass: 'text-gray-600 dark:text-gray-400',
    hasIndicator: false
  },
  in_progress: {
    label: 'In Progress',
    bgClass: 'bg-green-50 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    hasIndicator: true // النقطة النابضة
  },
  completed: {
    label: 'Completed',
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
    hasIndicator: false
  }
}

export default function SempStatusBadge({ status, size = 'md' }) {
  const config = statusConfig[status] || statusConfig.not_started

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold uppercase tracking-wider gap-1.5',
        config.bgClass,
        config.textClass,
        sizeClasses[size]
      )}
    >
      {config.hasIndicator && (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75"></span>
          <span className="relative inline-flex size-2 rounded-full bg-green-600"></span>
        </span>
      )}
      {config.label}
    </span>
  )
}
