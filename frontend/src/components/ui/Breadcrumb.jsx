import { cn } from '@/utils/cn'

/**
 * Breadcrumb navigation component
 *
 * @param {Object} props
 * @param {Array<{label: string, href?: string, icon?: string}>} props.items
 * @param {string} props.separator - Separator character/icon
 *
 * @example
 * <Breadcrumb items={[
 *   { label: 'Dashboard', href: '/app/dashboard' },
 *   { label: 'Projects', href: '/app/projects' },
 *   { label: 'Project A' }
 * ]} />
 */
function Breadcrumb({ items = [], separator = 'chevron_right', className, ...props }) {
  return (
    <nav aria-label="Breadcrumb" className={className} {...props}>
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-1">
              {/* Separator */}
              {index > 0 && (
                <span className="material-symbols-outlined text-base text-text-muted dark:text-gray-500">
                  {separator}
                </span>
              )}

              {/* Item */}
              {isLast || !item.href ? (
                <span
                  className={cn(
                    'flex items-center gap-1.5',
                    isLast
                      ? 'text-text-main dark:text-white font-medium'
                      : 'text-text-secondary dark:text-gray-400'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && (
                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                  )}
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5',
                    'text-text-secondary dark:text-gray-400',
                    'hover:text-text-main dark:hover:text-white',
                    'transition-colors'
                  )}
                >
                  {item.icon && (
                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                  )}
                  {item.label}
                </a>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
