import { useId } from 'react'
import { cn } from '@/utils'
import { V3_LOCKED_HEADINGS, V3_LOCKED_NAV } from '@/routes/routes.config'

export const V3_LOCKED_TEXT = 'Available in v3'

/**
 * V3LockedButton
 * A v3 module shown as locked (D48, D70): a focusable button with aria-disabled, never a link,
 * with no click handler. Same for every role.
 *
 * @param {Object} props
 * @param {Object} props.item - An entry of V3_LOCKED_NAV
 * @param {'nav'|'card'} props.variant - Sidebar row or the SEMP overview card
 * @param {string} props.className - Additional CSS classes
 */
export function V3LockedButton({ item, variant = 'nav', className }) {
  const id = useId()
  const labelId = `${id}-label`
  const lockId = `${id}-lock`
  const descriptionId = `${id}-description`
  const isCard = variant === 'card'

  return (
    <button
      type="button"
      aria-disabled="true"
      aria-labelledby={labelId}
      aria-describedby={isCard && item.description ? `${lockId} ${descriptionId}` : lockId}
      data-v3-locked={item.id}
      className={cn(
        'w-full text-left cursor-not-allowed',
        'border border-dashed border-border-default dark:border-border-dark',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        isCard
          ? 'flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 p-6 md:p-8 rounded-xl bg-surface dark:bg-surface-dark'
          : 'flex items-center gap-3 px-3 py-2 rounded-lg',
        className
      )}
    >
      <span
        className={cn('flex min-w-0', isCard ? 'items-start gap-4' : 'flex-1 items-center gap-3')}
      >
        <span
          aria-hidden="true"
          className={cn(
            'material-symbols-outlined shrink-0',
            isCard
              ? 'flex items-center justify-center size-12 rounded-full text-2xl bg-primary-soft dark:bg-primary/20 text-primary'
              : 'text-[20px] text-text-secondary dark:text-gray-400'
          )}
        >
          {item.icon}
        </span>
        <span className="flex flex-col min-w-0">
          <span
            id={labelId}
            className={cn(
              isCard
                ? 'text-lg font-bold text-text-main dark:text-white'
                : 'text-sm font-medium leading-snug text-text-secondary dark:text-gray-400'
            )}
          >
            {item.label}
          </span>
          {isCard && item.description && (
            <span
              id={descriptionId}
              className="text-sm text-text-secondary dark:text-gray-400 max-w-xl leading-relaxed"
            >
              {item.description}
            </span>
          )}
          {!isCard && (
            <span id={lockId} className="text-[11px] text-text-secondary dark:text-gray-400">
              {V3_LOCKED_TEXT}
            </span>
          )}
        </span>
      </span>

      {isCard ? (
        <span
          id={lockId}
          className={cn(
            'shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 rounded-lg',
            'text-sm font-bold text-text-secondary dark:text-gray-400',
            'bg-background dark:bg-background-dark',
            'border border-border-default dark:border-border-dark'
          )}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-lg">
            lock
          </span>
          {V3_LOCKED_TEXT}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="material-symbols-outlined shrink-0 text-[18px] text-text-secondary dark:text-gray-400"
        >
          lock
        </span>
      )}
    </button>
  )
}

/**
 * V3LockedSection
 * The locked v3 buttons of one location (V3_LOCKED_LOCATIONS), under its heading if it has one.
 *
 * @param {Object} props
 * @param {string} props.location - A V3_LOCKED_LOCATIONS value
 * @param {'nav'|'card'} props.variant
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.headingClassName - Classes of the heading (to match the sidebar's)
 */
export function V3LockedSection({ location, variant = 'nav', className, headingClassName }) {
  const headingId = useId()
  const items = V3_LOCKED_NAV.filter((item) => item.location === location)
  const heading = V3_LOCKED_HEADINGS[location]
  if (items.length === 0) return null

  return (
    <div
      role="group"
      aria-labelledby={heading ? headingId : undefined}
      className={cn('flex flex-col gap-1', className)}
    >
      {heading && (
        <p
          id={headingId}
          className={cn(
            'text-[10px] font-bold text-text-secondary uppercase tracking-widest px-3 mb-1',
            headingClassName
          )}
        >
          {heading}
        </p>
      )}
      {items.map((item) => (
        <V3LockedButton key={item.id} item={item} variant={variant} />
      ))}
    </div>
  )
}

export default V3LockedSection
