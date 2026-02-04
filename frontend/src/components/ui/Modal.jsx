import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

/**
 * Modal/Dialog component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {string} props.title - Modal title
 * @param {string} props.description - Modal description
 * @param {string} props.sub_description - Modal description
 * @param {'sm'|'md'|'lg'|'xl'|'full'} props.size - Modal size
 * @param {boolean} props.closeOnOverlay - Close when clicking overlay
 * @param {boolean} props.closeOnEscape - Close on Escape key
 * @param {boolean} props.showCloseButton - Show close button
 *
 * @example
 * <Modal isOpen={isOpen} onClose={close} title="Confirm Action">
 *   <p>Are you sure?</p>
 *   <Modal.Footer>
 *     <Button variant="ghost" onClick={close}>Cancel</Button>
 *     <Button onClick={confirm}>Confirm</Button>
 *   </Modal.Footer>
 * </Modal>
 */
function Modal({
  isOpen,
  onClose,
  title,
  description,
  sub_description,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  children,
}) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
  }

  // Handle Escape key
  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose?.()
      }
    },
    [closeOnEscape, onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      onClose?.()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleOverlayClick}
      />

      {/* Modal content */}
      <div
        className={cn(
          'relative w-full',
          'bg-surface dark:bg-surface-dark',
          'rounded-2xl shadow-xl',
          'border border-border-default dark:border-border-dark',
          'animate-slide-in',
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-border-default dark:border-border-dark">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="mt-4 text-xl font-semibold text-text-main dark:text-white"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-6 text-md text-text-main dark:text-white ">
                  {description}
                </p>
              )}
              {sub_description && (
                <p
                  id="modal-sub_description"
                  className="mt-1 mb-2 text-sm text-text-secondary dark:text-secondary-dark "
                >
                  {sub_description}
                </p>
              )}
            </div>

            {/* {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'p-1 rounded-lg -mr-1',
                  'text-text-muted hover:text-text-main',
                  'dark:text-gray-500 dark:hover:text-white',
                  'hover:bg-background dark:hover:bg-background-dark',
                  'transition-colors'
                )}
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )} */}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-16rem)]">{children}</div>
      </div>
    </div>,
    document.body
  )
}

function ModalFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',

        '-mx-6 -mb-4 px-6 pb-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Modal.Footer = ModalFooter

export default Modal
