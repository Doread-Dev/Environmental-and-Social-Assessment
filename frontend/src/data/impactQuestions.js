/**
 * Impact Categories and Questions
 * Deprecated: use useLookups() for live data
 */

// Re-export from context for constants
export { IMPACT_LEVELS, IMPACT_LEVEL_CONFIG } from '@/contexts/LookupContext'

/**
 * @deprecated Use useLookups().categoriesWithQuestions instead
 */
export const impactCategories = []

/**
 * @deprecated Use useLookups().getQuestionsByCategory() instead
 */
export function getQuestionsByCategory() {
  console.warn('getQuestionsByCategory is deprecated. Use useLookups() hook instead.')
  return []
}

/**
 * @deprecated Use useLookups().getTotalQuestionCount instead
 */
export function getTotalQuestionCount() {
  console.warn('getTotalQuestionCount is deprecated. Use useLookups() hook instead.')
  return 50
}

/**
 * @deprecated Use useLookups().getCategoryById() instead
 */
export function getCategoryByCode() {
  console.warn('getCategoryByCode is deprecated. Use useLookups() hook instead.')
  return null
}
