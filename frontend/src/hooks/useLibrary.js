/**
 * useLibrary / useLibraryManagement Hooks
 * The reference library (D64 b). `useLibrary({ place })` is the one cached query a Guidance button
 * and the Library page share (queryKeys.library(place)); writes refresh every library query.
 * Library documents don't change workflow state, so nothing else is refreshed.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { libraryService } from '@/services/libraryService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'

const EMPTY = []
// Guidance changes rarely: a tool page reuses the cached list for a while.
const STALE_MS = 5 * 60 * 1000

/**
 * @param {{place?: string|null, enabled?: boolean}} [options] - no place = every document
 */
export function useLibrary({ place = null, enabled = true } = {}) {
  const query = useQuery({
    queryKey: queryKeys.library(place),
    queryFn: () => libraryService.list({ place }),
    staleTime: STALE_MS,
    enabled,
  })

  return {
    documents: query.data ?? EMPTY,
    isLoading: query.isPending && enabled,
    error: query.error ? extractErrorMessage(query.error) : null,
    retry: query.refetch,
  }
}

/** Upload, edit, replace the PDF and delete (needs `manage_library`; the server checks). */
export function useLibraryManagement() {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['library'] })
  const mutation = (mutationFn) => ({ mutationFn, onSuccess: refresh })

  const create = useMutation(mutation((data) => libraryService.create(data)))
  const update = useMutation(mutation(({ id, data }) => libraryService.update(id, data)))
  const replace = useMutation(mutation(({ id, file }) => libraryService.replaceFile(id, file)))
  const remove = useMutation(mutation((id) => libraryService.remove(id)))

  return {
    createDocument: create.mutateAsync,
    updateDocument: (id, data) => update.mutateAsync({ id, data }),
    replaceFile: (id, file) => replace.mutateAsync({ id, file }),
    removeDocument: remove.mutateAsync,
    isSaving: create.isPending || update.isPending,
    replacingId: replace.isPending ? replace.variables?.id : null,
    isRemoving: remove.isPending,
  }
}

export default useLibrary
