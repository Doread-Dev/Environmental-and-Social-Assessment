import { createContext, useContext } from 'react'

/** Theme context object (the provider lives in ThemeContext.jsx). */
export const ThemeContext = createContext(undefined)

/**
 * Custom hook to use theme context
 * @returns {Object} Theme context value
 * @throws {Error} If used outside of ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
