/**
 * useAuditLogs Hook
 * One page of the critical-actions log (D65, admin). The previous page stays on screen while the
 * next one loads.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { auditLogService } from '@/services/auditLogService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'

/**
 * @param {{page: number, limit: number, action?: string}} params
 */
export function useAuditLogs({ page, limit, action = '' }) {
  const params = { page, limit, action }
  const query = useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () => auditLogService.list(params),
    placeholderData: keepPreviousData,
  })

  return {
    entries: query.data?.items ?? [],
    pagination: query.data?.pagination ?? { page, limit, total: 0, pages: 1 },
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: query.error ? extractErrorMessage(query.error) : null,
    refetch: query.refetch,
  }
}

export default useAuditLogs
