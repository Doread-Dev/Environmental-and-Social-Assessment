/**
 * Toast Component
 * Displays temporary notification messages
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { cn } from '@/utils/cn'

// Toast Context
const ToastContext = createContext(undefined)

/**
 * Toast variants configuration
 */
const TOAST_VARIANTS = {
  success: {
    icon: 'check_circle',
    bgClass: 'bg-green-50 dark:bg-green-900/30',
    textClass: 'text-green-800 dark:text-green-200',
    iconClass: 'text-green-500 dark:text-green-400',
    borderClass: 'border-green-200 dark:border-green-800',
  },
  error: {
    icon: 'error',
    bgClass: 'bg-red-50 dark:bg-red-900/30',
    textClass: 'text-red-800 dark:text-red-200',
    iconClass: 'text-red-500 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800',
  },
  warning: {
    icon: 'warning',
    bgClass: 'bg-amber-50 dark:bg-amber-900/30',
    textClass: 'text-amber-800 dark:text-amber-200',
    iconClass: 'text-amber-500 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800',
  },
  info: {
    icon: 'info',
    bgClass: 'bg-blue-50 dark:bg-blue-900/30',
    textClass: 'text-blue-800 dark:text-blue-200',
    iconClass: 'text-blue-500 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800',
  },
}

/**
 * Single Toast Item
 */
function ToastItem({ id, message, variant = 'info', onClose }) {
  const config = TOAST_VARIANTS[variant] || TOAST_VARIANTS.info

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, 4000)

    return () => clearTimeout(timer)
  }, [id, onClose])

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
        'animate-in slide-in-from-top-5 fade-in duration-300',
        'min-w-[300px] max-w-[400px]',
        config.bgClass,
        config.borderClass
      )}
      role="alert"
    >
      <span className={cn('material-symbols-outlined text-xl', config.iconClass)}>
        {config.icon}
      </span>
      <p className={cn('flex-1 text-sm font-medium', config.textClass)}>{message}</p>
      <button
        onClick={() => onClose(id)}
        className={cn(
          'p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors',
          config.textClass
        )}
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  )
}

/**
 * Toast Container - Renders all active toasts
 */
function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          variant={toast.variant}
          onClose={removeToast}
        />
      ))}
    </div>
  )
}

/**
 * Toast Provider - Wraps app to provide toast functionality
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, variant = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, variant }])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    {
      success: (message) => addToast(message, 'success'),
      error: (message) => addToast(message, 'error'),
      warning: (message) => addToast(message, 'warning'),
      info: (message) => addToast(message, 'info'),
    },
    [addToast]
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * Hook to use toast notifications
 * @returns {{ success: Function, error: Function, warning: Function, info: Function }}
 */
export function useToast() {
  const context = useContext(ToastContext)

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}

export default ToastProvider
