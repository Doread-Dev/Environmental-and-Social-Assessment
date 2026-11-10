import { createContext, useContext } from 'react'

/** Toast context object (the provider lives in Toast.jsx). */
export const ToastContext = createContext(undefined)

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
