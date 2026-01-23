import { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

/**
 * Dropdown menu component
 *
 * @param {Object} props
 * @param {React.ReactNode} props.trigger - Trigger element
 * @param {Array<{label: string, icon?: string, onClick?: Function, divider?: boolean, disabled?: boolean, danger?: boolean}>} props.items
 * @param {'left'|'right'} props.align - Menu alignment
 *
 * @example
 * <Dropdown
 *   trigger={<Button variant="ghost"><Icon name="more_vert" /></Button>}
 *   items={[
 *     { label: 'Edit', icon: 'edit', onClick: handleEdit },
 *     { label: 'Delete', icon: 'delete', onClick: handleDelete },
 *   ]}
 * />
 */
function Dropdown({ trigger, items = [], align = 'right', className }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleItemClick = (item) => {
    if (!item.disabled) {
      item.onClick?.()
      setIsOpen(false)
    }
  }

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {/* Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[180px]',
            'bg-surface dark:bg-surface-dark',
            'border border-border-default dark:border-border-dark',
            'rounded-lg shadow-lg',
            'py-1 animate-slide-in',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, index) =>
            item.divider ? (
              <div
                key={index}
                className="my-1 border-t border-border-default dark:border-border-dark"
              />
            ) : (
              <button
                key={index}
                type="button"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2',
                  'text-sm text-left',
                  'transition-colors',
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed text-text-muted'
                    : 'text-text-main dark:text-white hover:bg-background dark:hover:bg-background-dark',
                  item.danger && !item.disabled && 'text-error hover:bg-error/10'
                )}
              >
                {item.icon && (
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                )}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default Dropdown
