/**
 * Impact Categories - Basic Data
 * Deprecated: use useLookups() for live data
 */

// Re-export from context for constants
export { IMPACT_LEVELS, IMPACT_LEVEL_CONFIG } from '@/contexts/LookupContext'

// Legacy export for impactLevels (maps to IMPACT_LEVEL_CONFIG)
export const impactLevels = {
  negligible: { key: 'negligible', label: 'Negligible', value: 0 },
  low: { key: 'low', label: 'Low', value: 1 },
  medium: { key: 'medium', label: 'Medium', value: 2 },
  high: { key: 'high', label: 'High', value: 3 },
  not_applicable: { key: 'not_applicable', label: 'N/A', value: -1 },
}

/**
 * @deprecated Use useLookups().impactCategories instead
 */
export const impactCategories = []
