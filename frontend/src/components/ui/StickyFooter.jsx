/**
 * StickyFooter Component
 * Footer fixed to the bottom, for pages in ProjectLayout
 *
 * Its left offset comes from the CSS variable --sidebar-width, so it follows the sidebar width
 * without a hardcoded value
 *
 * Usage:
 * <StickyFooter>
 *   <div>Left content</div>
 *   <div>Right actions</div>
 * </StickyFooter>
 */

import { useEffect } from 'react'
import { cn } from '@/utils/cn'

// Footers on screen: while there is one, the floating Help button (components/help) sits above it
let shown = 0
const FOOTER_HEIGHT = '5rem'

function useLiftFloatingHelp() {
  useEffect(() => {
    shown += 1
    document.documentElement.style.setProperty('--floating-help-bottom', FOOTER_HEIGHT)
    return () => {
      shown -= 1
      if (shown === 0) document.documentElement.style.removeProperty('--floating-help-bottom')
    }
  }, [])
}

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - Footer content
 * @param {string} props.className - Extra classes
 */
export default function StickyFooter({ children, className, ...props }) {
  useLiftFloatingHelp()
  return (
    <div
      className={cn(
        // Fixed positioning at bottom
        'fixed bottom-0 right-0',
        // Height
        'h-20 min-h-[5rem]',
        // Background & Border
        'bg-surface dark:bg-surface-dark',
        'border-t border-border-default dark:border-border-dark',
        // Shadow for visual separation
        'shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]',
        // Z-index to appear above content
        'z-20',
        // Flex for content alignment
        'flex items-center justify-between px-4 sm:px-6 lg:px-8',
        className
      )}
      style={{
        // Use CSS variable for left position - respects sidebar width automatically
        left: 'var(--sidebar-width, 0px)',
      }}
      {...props}
    >
      {children}
    </div>
  )
}
