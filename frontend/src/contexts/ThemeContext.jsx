import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { THEME_STORAGE_KEY, THEMES } from '@/utils/constants'

/**
 * Theme Context for managing dark/light mode
 */
const ThemeContext = createContext(undefined)

/**
 * Get initial theme from localStorage.
 * Default is always LIGHT for first-time visitors (no stored preference).
 */
function getInitialTheme() {
  if (typeof window !== 'undefined') {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme && Object.values(THEMES).includes(storedTheme)) {
      return storedTheme
    }
  }
  // First visit or invalid value: default to light mode on every device
  return THEMES.LIGHT
}

/**
 * Get the actual theme (resolving 'system' to light/dark)
 */
function getResolvedTheme(theme) {
  if (theme === THEMES.SYSTEM) {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT
    }
    return THEMES.LIGHT
  }
  return theme
}

/**
 * ThemeProvider Component
 * Provides theme state and toggle functionality to the app
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState(() => getResolvedTheme(getInitialTheme()))

  // Apply theme to document
  const applyTheme = useCallback((newResolvedTheme) => {
    const root = document.documentElement

    // Remove dark class first
    root.classList.remove(THEMES.DARK)

    // Add dark class only if theme is dark
    // For light mode, we don't add any class (default state)
    if (newResolvedTheme === THEMES.DARK) {
      root.classList.add(THEMES.DARK)
    }

    // Update resolved theme state
    setResolvedTheme(newResolvedTheme)
  }, [])

  // Set theme and persist to localStorage
  const setTheme = useCallback(
    (newTheme) => {
      setThemeState(newTheme)
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
      applyTheme(getResolvedTheme(newTheme))
    },
    [applyTheme]
  )

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
    setTheme(newTheme)
  }, [resolvedTheme, setTheme])

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(getResolvedTheme(theme))
  }, [applyTheme, theme])

  // Listen for system theme changes (when theme is 'system')
  useEffect(() => {
    if (theme !== THEMES.SYSTEM) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e) => {
      applyTheme(e.matches ? THEMES.DARK : THEMES.LIGHT)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, applyTheme])

  const value = {
    theme, // The stored theme preference ('light', 'dark', or 'system')
    resolvedTheme, // The actual applied theme ('light' or 'dark')
    setTheme, // Function to set theme
    toggleTheme, // Function to toggle between light/dark
    isDark: resolvedTheme === THEMES.DARK,
    isLight: resolvedTheme === THEMES.LIGHT,
    isSystem: theme === THEMES.SYSTEM,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

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

export default ThemeContext
