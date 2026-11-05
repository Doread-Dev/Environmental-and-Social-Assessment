import { createContext, useContext } from 'react'

/** Auth context object (the provider lives in AuthContext.jsx). */
export const AuthContext = createContext(undefined)

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
