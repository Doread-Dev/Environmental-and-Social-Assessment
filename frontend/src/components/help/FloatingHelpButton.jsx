import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui'
import { getHelpRoute } from '@/routes/routes.config'
import { helpSectionsFor } from '@/routes/helpSections'
import { cn } from '@/utils/cn'

/**
 * FloatingHelpButton - opens the user guide at the current page's section (phase 14, D78)
 *
 * One round button, fixed in the bottom-right corner of every page that has guide sections
 * (routes/helpSections.js): mounted once in each layout, never per page. Not on sign-in, the
 * forced password change (owner, D22: Help waits for the new password) or the Help page itself. It sits below dialogs, side panels, the mobile menu and toasts (z-30), and
 * above a page's save bar: StickyFooter raises `--floating-help-bottom` while it is shown. Leaving
 * goes through the unsaved-changes guard like any other navigation.
 */
export function FloatingHelpButton() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const sections = helpSectionsFor(pathname)
  if (!sections) return null

  return (
    <button
      type="button"
      data-floating-help
      data-print="hide"
      aria-label="Help for this page"
      title="Help for this page"
      onClick={() => navigate(getHelpRoute(sections))}
      className={cn(
        'fixed z-30 right-4 sm:right-6',
        'bottom-[calc(var(--floating-help-bottom,0px)+1rem)] sm:bottom-[calc(var(--floating-help-bottom,0px)+1.5rem)]',
        'size-12 rounded-full flex items-center justify-center',
        'bg-primary text-white shadow-lg hover:bg-primary-hover',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40',
        'transition-colors'
      )}
    >
      <Icon name="help" size="lg" />
    </button>
  )
}

export default FloatingHelpButton
