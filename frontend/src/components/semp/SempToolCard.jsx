/**
 * SempToolCard Component
 * Updated: Restored button logic to match previous behavior (full width button inside body)
 */

import { cn } from '@/utils/cn'

const toolConfig = {
  3: {
    icon: 'construction',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'Tool 3',
  },
  4: {
    icon: 'shield',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    label: 'Tool 4',
  },
}

export default function SempToolCard({
  toolNumber,
  title,
  description,
  status,
  onAction,
  pulse = false,
  actionLabel,
}) {
  const config = toolConfig[toolNumber] || toolConfig[3]

  // Status Badge Logic
  const renderStatusBadge = () => {
    if (status === 'completed') {
      return (
        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded dark:bg-green-900/30 dark:text-green-400">
          Completed
        </span>
      )
    }
    if (status === 'in_progress') {
      return (
        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded dark:bg-green-900/30 dark:text-green-400">
          In Progress
        </span>
      )
    }
    return (
      <span className="px-2 py-1 bg-gray-50/50 text-text-secondary text-xs font-bold rounded dark:bg-surface-dark dark:text-gray-300">
        Not Started
      </span>
    )
  }

  // Button Label Logic (Restored)
  const getActionLabel = () => {
    if (actionLabel) return actionLabel
    if (status === 'completed') return 'Review & Edit'
    if (status === 'in_progress') return 'Continue Editing'
    return 'Start Tool →'
  }

  return (
    <div className="flex flex-col bg-white dark:bg-surface-dark border border-border-default dark:border-border-dark rounded-xl shadow-sm hover:shadow-md transition-shadow h-full relative overflow-hidden">
      {pulse && (
        <div className="absolute top-0 right-0 p-2">
          <div className="size-2 rounded-full bg-red-500 animate-pulse"></div>
        </div>
      )}

      <div className="p-6 flex flex-col gap-4 h-full">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div
              className={cn('flex items-center p-2.5 rounded-lg', config.iconBg, config.iconColor)}
            >
              <span className="material-symbols-outlined">{config.icon}</span>
            </div>
            <div>
              <p className="text-xs text-text-secondary dark:text-gray-400 font-semibold uppercase tracking-wider">
                {config.label}
              </p>
              <h3 className="text-lg font-bold text-text-main dark:text-white">{title}</h3>
            </div>
          </div>
          {renderStatusBadge()}
        </div>

        {/* Description */}
        <p className="text-text-secondary dark:text-gray-400 text-sm flex-1 leading-relaxed">
          {description}
        </p>

        {/* Action Button (Restored Logic - Inside Body) */}
        <div className="mt-auto pt-2">
          <button
            onClick={onAction}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
              status === 'completed'
                ? 'border border-border-default dark:border-border-dark text-text-main dark:text-white hover:bg-gray-50/50 dark:hover:bg-white/5'
                : 'bg-primary hover:bg-primary-hover text-white shadow-md'
            )}
          >
            {getActionLabel()}
          </button>
        </div>
      </div>

      {/* Footer removed since button is moved back to body */}
    </div>
  )
}
