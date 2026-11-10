import { useId } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import { useOverlay } from './useOverlay'

/**
 * Side panel (drawer) over the right edge of the page. The page behind stays mounted, so nothing
 * typed there is lost. Escape, the close button and a click on the backdrop close it.
 *
 * @param {Object} props
 * @param {Function} props.onClose
 * @param {string} props.title
 * @param {React.ReactNode} [props.subtitle]
 * @param {string} [props.icon] - Material Symbols name shown before the title
 *
 * @example
 * {open && <SidePanel title="Guidance" onClose={() => setOpen(false)}>…</SidePanel>}
 */
function SidePanel({ onClose, title, subtitle, icon, className, children }) {
  const titleId = useId()
  useOverlay(onClose)

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        data-testid="side-panel-backdrop"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative flex flex-col h-full w-full sm:max-w-md',
          'bg-surface dark:bg-surface-dark',
          'border-l border-border-default dark:border-border-dark shadow-xl',
          className
        )}
      >
        <header className="flex items-start gap-3 px-5 py-4 border-b border-border-default dark:border-border-dark">
          {icon && (
            <span className="material-symbols-outlined text-primary mt-0.5" aria-hidden="true">
              {icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-text-main dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-text-secondary dark:text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white hover:bg-background dark:hover:bg-background-dark transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>,
    document.body
  )
}

export default SidePanel
