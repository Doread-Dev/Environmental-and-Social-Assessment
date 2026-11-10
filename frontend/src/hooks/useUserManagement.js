/**
 * useUserManagement Hook
 * Admin user writes (D21, D22): create, edit, deactivate/reactivate, reset password.
 * Each write refreshes the user list (and the signed-in user when they edited themselves).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/userService'
import { queryKeys } from '@/services/queryKeys'
import { useAuth } from '@/contexts'

export function useUserManagement() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  const mutation = useMutation({
    mutationFn: ({ action, id, data }) => {
      if (action === 'create') return userService.create(data)
      if (action === 'update') return userService.update(id, data)
      if (action === 'deactivate') return userService.deactivate(id)
      if (action === 'reactivate') return userService.reactivate(id)
      if (action === 'resetPassword') return userService.resetPassword(id)
      throw new Error(`Unknown user action ${action}`)
    },
    onSuccess: (_result, { id }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users }),
        id && id === currentUser?._id && queryClient.invalidateQueries({ queryKey: queryKeys.me }),
      ]),
  })

  const run = (action) => (id, data) => mutation.mutateAsync({ action, id, data })

  return {
    /** @returns {Promise<{user, temporary_password}>} */
    createUser: (data) => mutation.mutateAsync({ action: 'create', data }),
    updateUser: run('update'),
    deactivateUser: run('deactivate'),
    reactivateUser: run('reactivate'),
    /** @returns {Promise<{user, temporary_password}>} */
    resetPassword: run('resetPassword'),
    isSaving: mutation.isPending,
  }
}

export default useUserManagement
