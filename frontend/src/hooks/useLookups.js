/**
 * useLookups / useUsers Hooks
 * Reference data from the backend, loaded once per session through the query cache (D31, D33).
 * A page that does not call these hooks does not load the data.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { lookupService } from '@/services/lookupService'
import { userService } from '@/services/userService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'
import { CATEGORY_ICONS } from '@/utils/categoryIcons'
import { IMPACT_LEVELS, IMPACT_LEVEL_CONFIG } from '@/utils/impactLevels'

const EMPTY = []

const byCategory = (items, category) =>
  items.filter((item) => item.category?._id === category._id || item.category === category._id)

/** Impact categories sorted by code, with their icon */
export function sortedCategories(data) {
  if (!data) return EMPTY
  return [...data.impactCategories]
    .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')))
    .map((category) => ({ ...category, ...(CATEGORY_ICONS[category.code] || {}) }))
}

/** Categories with their questions, in the shape the scoring UI and Tool 2 export use */
export function withQuestions(categories, questions) {
  return categories.map((category) => ({
    ...category,
    id: category.code, // Backward compatibility
    questions: byCategory(questions, category).map((q, index) => ({
      id: q._id,
      legacyId: `${category.code}_q${index + 1}`,
      _id: q._id,
      question: q.question_text,
      question_ar: q.question_text_ar,
    })),
  }))
}

/** Categories with their monitoring indicators (Tool 5) */
export function withIndicators(categories, indicators) {
  return categories.map((category) => ({
    ...category,
    id: category.code,
    indicators: byCategory(indicators, category).map((ind, index) => ({
      ...ind,
      id: `indicator_${category.code}_${index + 1}`,
      legacyId: `indicator_${category.code}_${index + 1}`,
      categoryCode: category.code,
    })),
  }))
}

/** Query options of GET /lookups (also for loading it outside a component, e.g. on export) */
export const lookupsQuery = {
  queryKey: queryKeys.lookups,
  queryFn: lookupService.getAll,
  staleTime: Infinity,
}

/**
 * Impact categories (sorted by code, with their icon), questions and indicators, and the places
 * registry (D64 a: where library guidance can appear, with groups and labels — the frontend keeps
 * no copy of it)
 */
export function useLookups() {
  const query = useQuery(lookupsQuery)
  const data = query.data

  const impactCategories = useMemo(() => sortedCategories(data), [data])
  const impactQuestions = data?.impactQuestions ?? EMPTY
  const indicators = data?.indicators ?? EMPTY
  const places = data?.places ?? EMPTY
  const placeGroups = data?.placeGroups ?? EMPTY

  // Each group with its places, in registry order (the place picker, the Library filter)
  const placesByGroup = useMemo(
    () =>
      placeGroups.map((group) => ({
        ...group,
        places: places.filter((place) => place.group === group.key),
      })),
    [places, placeGroups]
  )
  const placeLabels = useMemo(
    () => Object.fromEntries(places.map((place) => [place.key, place.label])),
    [places]
  )

  // Categories with their questions, in the shape the scoring UI uses
  const categoriesWithQuestions = useMemo(
    () => withQuestions(impactCategories, impactQuestions),
    [impactCategories, impactQuestions]
  )

  // Categories with their monitoring indicators
  const categoriesWithIndicators = useMemo(
    () => withIndicators(impactCategories, indicators),
    [impactCategories, indicators]
  )

  return {
    impactCategories,
    impactQuestions,
    indicators,
    jobTitles: data?.jobTitles ?? EMPTY,
    places,
    placesByGroup,
    /** @param {string} key → its label, or the key itself while loading / when unknown */
    placeLabel: (key) => placeLabels[key] ?? key,
    categoriesWithQuestions,
    categoriesWithIndicators,
    isLoading: query.isPending,
    error: query.error ? extractErrorMessage(query.error) : null,
    retry: query.refetch,
    IMPACT_LEVELS,
    IMPACT_LEVEL_CONFIG,
  }
}

/**
 * Users: admins get every account (inactive included), other roles the active users only.
 * `activeUsers` is what the "Responsible" pickers offer (D4).
 */
export function useUsers() {
  const query = useQuery({
    queryKey: queryKeys.users,
    queryFn: userService.getAll,
    staleTime: 5 * 60 * 1000,
  })
  const users = query.data ?? EMPTY
  const activeUsers = useMemo(() => users.filter((user) => user.is_active), [users])

  return {
    users,
    activeUsers,
    isLoading: query.isPending,
    error: query.error ? extractErrorMessage(query.error) : null,
    refetch: query.refetch,
  }
}

export default useLookups
