/**
 * useHelp / useHelpLanguage Hooks
 * The user guide (phase 14, D78): one cached query per language; the language the user chose,
 * kept per user in this browser.
 */
import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HELP_LANGUAGES, helpService } from '@/services/helpService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'

// The guide changes only with a new release
const STALE_MS = 30 * 60 * 1000

/** @param {'en'|'ar'} lang */
export function useHelp(lang) {
  const query = useQuery({
    queryKey: queryKeys.help(lang),
    queryFn: () => helpService.get(lang),
    staleTime: STALE_MS,
  })
  return {
    guide: query.data ?? null,
    isLoading: query.isPending,
    error: query.error ? extractErrorMessage(query.error) : null,
    retry: query.refetch,
  }
}

const storageKey = (userId) => `esms-help-lang:${userId ?? 'anonymous'}`

const readLanguage = (userId) => {
  try {
    const stored = window.localStorage.getItem(storageKey(userId))
    return HELP_LANGUAGES.includes(stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

/**
 * The guide language of this user (English by default), remembered in localStorage
 * @param {string|undefined} userId
 * @returns {['en'|'ar', (lang: 'en'|'ar') => void]}
 */
export function useHelpLanguage(userId) {
  const [lang, setLangState] = useState(() => readLanguage(userId))
  const setLang = useCallback(
    (next) => {
      setLangState(next)
      try {
        window.localStorage.setItem(storageKey(userId), next)
      } catch {
        // Storage blocked (private window): the choice lasts for this page only
      }
    },
    [userId]
  )
  return [lang, setLang]
}
