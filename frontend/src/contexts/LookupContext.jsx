/**
 * Lookup Context
 * Provides static/reference data throughout the application
 * Fetches data once on mount and caches it
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { lookupService } from '@/services/lookupService'
import { extractErrorMessage } from '@/services/api'
import { useAuth } from './AuthContext'

// Create context
const LookupContext = createContext(undefined)

/**
 * Impact levels configuration (static, doesn't come from API)
 * Used for scoring UI display
 */
export const IMPACT_LEVELS = {
  NEGLIGIBLE: 'negligible',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  NOT_APPLICABLE: 'not_applicable',
}

export const IMPACT_LEVEL_CONFIG = {
  [IMPACT_LEVELS.NEGLIGIBLE]: {
    label: 'Negligible',
    labelAr: 'مهمل',
    value: 0,
    color: 'gray',
    bgClass: 'bg-gray-50/50 dark:bg-white/5',
    textClass: 'text-gray-600 dark:text-gray-400',
    dotClass: 'bg-gray-400',
  },
  [IMPACT_LEVELS.LOW]: {
    label: 'Low',
    labelAr: 'منخفض',
    value: 1,
    color: 'green',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    dotClass: 'bg-primary',
  },
  [IMPACT_LEVELS.MEDIUM]: {
    label: 'Medium',
    labelAr: 'متوسط',
    value: 2,
    color: 'amber',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    dotClass: 'bg-amber-500',
  },
  [IMPACT_LEVELS.HIGH]: {
    label: 'High',
    labelAr: 'عالي',
    value: 3,
    color: 'red',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    dotClass: 'bg-red-500',
  },
  [IMPACT_LEVELS.NOT_APPLICABLE]: {
    label: 'N/A',
    labelAr: 'غير قابل للتطبيق',
    value: -1,
    color: 'gray',
    bgClass: 'bg-gray-50/50 dark:bg-white/5',
    textClass: 'text-gray-500 dark:text-gray-500',
    dotClass: 'bg-gray-300',
  },
}

/**
 * Category icon configuration (static, for UI display)
 */
const CATEGORY_ICONS = {
  A: { icon: 'air', iconColor: 'text-sky-500', iconBg: 'bg-sky-500/10' },
  B: { icon: 'water_drop', iconColor: 'text-blue-500', iconBg: 'bg-blue-500/10' },
  C: { icon: 'volume_up', iconColor: 'text-purple-500', iconBg: 'bg-purple-500/10' },
  D: { icon: 'delete', iconColor: 'text-amber-600', iconBg: 'bg-amber-500/10' },
  E: { icon: 'radio_button_checked', iconColor: 'text-yellow-500', iconBg: 'bg-yellow-500/10' },
  F: { icon: 'warning', iconColor: 'text-red-600', iconBg: 'bg-red-600/10' },
  J: { icon: 'forest', iconColor: 'text-green-600', iconBg: 'bg-green-600/10' },
  H: { icon: 'landscape', iconColor: 'text-orange-600', iconBg: 'bg-orange-600/10' },
}

/**
 * LookupProvider Component
 * Wraps the application to provide lookup data
 */
export function LookupProvider({ children }) {
  const { isAuthenticated } = useAuth()

  // State
  const [impactCategories, setImpactCategories] = useState([])
  const [impactQuestions, setImpactQuestions] = useState([])
  const [indicators, setIndicators] = useState([])
  const [jobTitles, setJobTitles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  /**
   * Fetch all lookup data
   */
  const fetchLookups = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await lookupService.getAllLookups()

      const sortedCategories = [...data.impactCategories].sort((a, b) =>
        String(a.code || '').localeCompare(String(b.code || ''))
      )

      // Enhance categories with icon config
      const enhancedCategories = sortedCategories.map((cat) => ({
        ...cat,
        ...(CATEGORY_ICONS[cat.code] || {}),
      }))

      setImpactCategories(enhancedCategories)
      setImpactQuestions(data.impactQuestions)
      setIndicators(data.indicators)
      setJobTitles(data.jobTitles)
      setIsLoaded(true)
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      // eslint-disable-next-line no-console
      console.error('Failed to load lookup data:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  /**
   * Fetch lookups when authenticated
   */
  useEffect(() => {
    if (isAuthenticated && !isLoaded) {
      fetchLookups()
    }
  }, [isAuthenticated, isLoaded, fetchLookups])

  /**
   * Clear lookup data on logout
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setImpactCategories([])
      setImpactQuestions([])
      setIndicators([])
      setJobTitles([])
      setIsLoaded(false)
    }
  }, [isAuthenticated])

  /**
   * Get category by ID or code
   * @param {string} idOrCode - Category _id or code
   * @returns {Object|undefined}
   */
  const getCategoryById = useCallback(
    (idOrCode) => {
      return impactCategories.find((cat) => cat._id === idOrCode || cat.code === idOrCode)
    },
    [impactCategories]
  )

  /**
   * Get questions for a specific category
   * @param {string} categoryIdOrCode - Category _id or code
   * @returns {Array}
   */
  const getQuestionsByCategory = useCallback(
    (categoryIdOrCode) => {
      const category = getCategoryById(categoryIdOrCode)
      if (!category) return []

      return impactQuestions.filter(
        (q) => q.category?._id === category._id || q.category === category._id
      )
    },
    [impactQuestions, getCategoryById]
  )

  /**
   * Get indicators for a specific category
   * @param {string} categoryIdOrCode - Category _id or code
   * @returns {Array}
   */
  const getIndicatorsByCategory = useCallback(
    (categoryIdOrCode) => {
      const category = getCategoryById(categoryIdOrCode)
      if (!category) return []

      return indicators.filter(
        (ind) => ind.category?._id === category._id || ind.category === category._id
      )
    },
    [indicators, getCategoryById]
  )

  /**
   * Get job title by ID
   * @param {string} id - Job title _id
   * @returns {Object|undefined}
   */
  const getJobTitleById = useCallback(
    (id) => {
      return jobTitles.find((jt) => jt._id === id)
    },
    [jobTitles]
  )

  /**
   * Get total question count
   * @returns {number}
   */
  const getTotalQuestionCount = useMemo(() => {
    return impactQuestions.length
  }, [impactQuestions])

  /**
   * Get total indicator count
   * @returns {number}
   */
  const getTotalIndicatorCount = useMemo(() => {
    return indicators.length
  }, [indicators])

  /**
   * Get categories with their questions grouped
   * Transforms API data to match UI structure
   * @returns {Array}
   */
  const categoriesWithQuestions = useMemo(() => {
    return impactCategories.map((category) => {
      const categoryQuestions = impactQuestions.filter(
        (q) => q.category?._id === category._id || q.category === category._id
      )

      return {
        ...category,
        id: category.code, // Backward compatibility
        questions: categoryQuestions.map((q, index) => ({
          id: `${category.code}_q${index + 1}`,
          legacyId: `${category.code}_q${index + 1}`,
          _id: q._id,
          question: q.question_text,
          question_ar: q.question_text_ar,
        })),
      }
    })
  }, [impactCategories, impactQuestions])

  /**
   * Get categories with their indicators grouped
   * @returns {Array}
   */
  const categoriesWithIndicators = useMemo(() => {
    return impactCategories.map((category) => {
      const categoryIndicators = indicators.filter(
        (ind) => ind.category?._id === category._id || ind.category === category._id
      )

      return {
        ...category,
        id: category.code,
        indicators: categoryIndicators.map((ind, index) => ({
          ...ind,
          id: `indicator_${category.code}_${index + 1}`,
          legacyId: `indicator_${category.code}_${index + 1}`,
          categoryCode: category.code,
        })),
      }
    })
  }, [impactCategories, indicators])

  // Context value
  const value = useMemo(
    () => ({
      // Raw data
      impactCategories,
      impactQuestions,
      indicators,
      jobTitles,

      // Derived data
      categoriesWithQuestions,
      categoriesWithIndicators,

      // State
      isLoading,
      error,
      isLoaded,

      // Actions
      refetch: fetchLookups,

      // Helpers
      getCategoryById,
      getQuestionsByCategory,
      getIndicatorsByCategory,
      getJobTitleById,
      getTotalQuestionCount,
      getTotalIndicatorCount,

      // Constants
      IMPACT_LEVELS,
      IMPACT_LEVEL_CONFIG,
    }),
    [
      impactCategories,
      impactQuestions,
      indicators,
      jobTitles,
      categoriesWithQuestions,
      categoriesWithIndicators,
      isLoading,
      error,
      isLoaded,
      fetchLookups,
      getCategoryById,
      getQuestionsByCategory,
      getIndicatorsByCategory,
      getJobTitleById,
      getTotalQuestionCount,
      getTotalIndicatorCount,
    ]
  )

  return <LookupContext.Provider value={value}>{children}</LookupContext.Provider>
}

/**
 * Custom hook to use lookup context
 * @returns {Object} Lookup context value
 * @throws {Error} If used outside of LookupProvider
 */
export function useLookups() {
  const context = useContext(LookupContext)

  if (context === undefined) {
    throw new Error('useLookups must be used within a LookupProvider')
  }

  return context
}

export default LookupContext
