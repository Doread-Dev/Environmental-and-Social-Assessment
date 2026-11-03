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

/**
 * Impact categories (sorted by code, with their icon), questions and indicators
 */
export function useLookups() {
  const query = useQuery({
    queryKey: queryKeys.lookups,
    queryFn: lookupService.getAll,
    staleTime: Infinity,
  })
  const data = query.data

  const impactCategories = useMemo(() => {
    if (!data) return EMPTY
    return [...data.impactCategories]
      .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')))
      .map((category) => ({ ...category, ...(CATEGORY_ICONS[category.code] || {}) }))
  }, [data])
  const impactQuestions = data?.impactQuestions ?? EMPTY
  const indicators = data?.indicators ?? EMPTY

  // Categories with their questions, in the shape the scoring UI uses
  const categoriesWithQuestions = useMemo(
    () =>
      impactCategories.map((category) => ({
        ...category,
        id: category.code, // Backward compatibility
        questions: byCategory(impactQuestions, category).map((q, index) => ({
          id: q._id,
          legacyId: `${category.code}_q${index + 1}`,
          _id: q._id,
          question: q.question_text,
          question_ar: q.question_text_ar,
        })),
      })),
    [impactCategories, impactQuestions]
  )

  // Categories with their monitoring indicators
  const categoriesWithIndicators = useMemo(
    () =>
      impactCategories.map((category) => ({
        ...category,
        id: category.code,
        indicators: byCategory(indicators, category).map((ind, index) => ({
          ...ind,
          id: `indicator_${category.code}_${index + 1}`,
          legacyId: `indicator_${category.code}_${index + 1}`,
          categoryCode: category.code,
        })),
      })),
    [impactCategories, indicators]
  )

  return {
    impactCategories,
    impactQuestions,
    indicators,
    jobTitles: data?.jobTitles ?? EMPTY,
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
 * All users (every signed-in role may list them), e.g. for the "Responsible" pickers
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
