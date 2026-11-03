/**
 * TanStack Query client (D33)
 *
 * One cache for the whole app: guards, layouts and pages that ask for the same query key share
 * one request. Mutations refresh what they changed through invalidateProjectState().
 */
import { QueryClient } from '@tanstack/react-query'

// A 4xx answer will not change on retry (bad id, no permission, workflow rule).
function shouldRetry(failureCount, error) {
  const status = error?.response?.status
  if (status >= 400 && status < 500) return false
  return failureCount < 1
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export const queryClient = createQueryClient()

export default queryClient
