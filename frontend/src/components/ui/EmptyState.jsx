import { cn } from '@/utils/cn'

/**
 * Empty state (nothing to show yet, or no search result) — one look across the app (D71).
 *
 * @param {Object} props
 * @param {string} [props.icon] - Material Symbols icon name
 * @param {string} props.title
 * @param {React.ReactNode} [props.description]
 * @param {React.ReactNode} [props.action] - e.g. a Button
 * @param {boolean} [props.compact] - Less padding (inside a card or table)
 *
 * @example
 * <EmptyState icon="folder_open" title="No projects found" action={<Button>New project</Button>} />
 */
function EmptyState({ icon = 'inbox', title, description, action, compact = false, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center gap-3',
        compact ? 'py-8 px-4' : 'py-12 px-6',
        className
      )}
    >
      <div className="size-12 rounded-full bg-primary-soft dark:bg-primary/10 flex items-center justify-center">
        <span
          className="material-symbols-outlined text-2xl text-primary dark:text-green-300"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <p className="text-base font-semibold text-text-main dark:text-white">{title}</p>
        {description && (
          <p className="text-sm text-text-secondary dark:text-gray-400">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export default EmptyState
