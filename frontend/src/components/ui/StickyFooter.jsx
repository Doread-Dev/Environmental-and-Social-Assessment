/**
 * StickyFooter Component
 * Footer ملتصق بالأسفل يعمل مع ProjectLayout
 *
 * يستخدم CSS Variable (--sidebar-width) لتحديد المسافة من اليسار تلقائياً
 * مما يجعله يحترم عرض السايد بار بدون hardcoding
 *
 * Usage:
 * <StickyFooter>
 *   <div>Left content</div>
 *   <div>Right actions</div>
 * </StickyFooter>
 */

import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - محتوى الـ Footer
 * @param {string} props.className - classes إضافية
 */
export default function StickyFooter({ children, className, ...props }) {
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
