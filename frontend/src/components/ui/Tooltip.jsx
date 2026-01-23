import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

/**
 * Tooltip component
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.content - Tooltip content
 * @param {'top'|'bottom'|'left'|'right'} props.position - Tooltip position
 * @param {number} props.delay - Show delay in ms
 *
 * @example
 * <Tooltip content="Edit project">
 *   <Button variant="ghost"><Icon name="edit" /></Button>
 * </Tooltip>
 */
function Tooltip({ content, position = 'top', delay = 200, className, children }) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const timeoutRef = useRef(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const scrollX = window.scrollX
        const scrollY = window.scrollY

        let top, left

        switch (position) {
          case 'top':
            top = rect.top + scrollY - 8
            left = rect.left + scrollX + rect.width / 2
            break
          case 'bottom':
            top = rect.bottom + scrollY + 8
            left = rect.left + scrollX + rect.width / 2
            break
          case 'left':
            top = rect.top + scrollY + rect.height / 2
            left = rect.left + scrollX - 8
            break
          case 'right':
            top = rect.top + scrollY + rect.height / 2
            left = rect.right + scrollX + 8
            break
          default:
            top = rect.top + scrollY - 8
            left = rect.left + scrollX + rect.width / 2
        }

        setCoords({ top, left })
        setIsVisible(true)
      }
    }, delay)
  }

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-flex"
      >
        {children}
      </span>

      {isVisible &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
            className={cn(
              'fixed z-50 pointer-events-none',
              'px-3 py-1.5 rounded-lg',
              'bg-gray-900 dark:bg-gray-700 text-white',
              'text-sm font-medium shadow-lg',
              'animate-fade-in',
              positionClasses[position],
              className
            )}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  )
}

export default Tooltip
