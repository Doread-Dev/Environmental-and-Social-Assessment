/**
 * Stale saves (D62, D73): one shared dialog for every write of project data.
 *
 * The backend refuses a save made from an old version with 409 `STALE_VERSION`. useProjectSave
 * calls `showConflict`; this dialog says so and offers:
 * - **Reload**: refetches the tool's query and the project's workspace, then mounts the page again
 *   (`reloadKey`) so it shows the other person's changes; what was typed here is dropped.
 * - **Keep editing**: closes the dialog; the typed input stays so the user can copy it.
 * Nothing is merged automatically.
 */
import { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Modal } from '@/components/ui'
import { queryKeys as keys } from '@/services/queryKeys'
import { SaveConflictContext } from './useSaveConflict'

export function SaveConflictProvider({ children }) {
  const queryClient = useQueryClient()
  const [conflict, setConflict] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [isReloading, setIsReloading] = useState(false)

  const showConflict = useCallback(({ projectId, queryKeys = [] }) => {
    setConflict({ projectId, queryKeys })
  }, [])

  const keepEditing = useCallback(() => setConflict(null), [])

  const reload = useCallback(async () => {
    if (!conflict) return
    setIsReloading(true)
    const { projectId, queryKeys } = conflict
    await Promise.allSettled([
      ...queryKeys.filter(Boolean).map((queryKey) => queryClient.refetchQueries({ queryKey })),
      projectId && queryClient.refetchQueries({ queryKey: keys.workspace(projectId) }),
    ])
    queryClient.invalidateQueries({ queryKey: keys.projects })
    queryClient.invalidateQueries({ queryKey: keys.dashboard })
    setIsReloading(false)
    setConflict(null)
    setReloadKey((key) => key + 1)
  }, [conflict, queryClient])

  const value = useMemo(() => ({ showConflict, reloadKey }), [showConflict, reloadKey])

  return (
    <SaveConflictContext.Provider value={value}>
      {children}
      {conflict && (
        <Modal
          isOpen
          onClose={isReloading ? () => {} : keepEditing}
          title="Someone else changed this"
          description="Someone else changed this since you opened it, so your save was not applied."
          sub_description="Reload to see their changes; what you typed here is then replaced. Keep editing to copy your input first."
          size="lg"
        >
          <Modal.Footer className="mt-2">
            <Button variant="ghost" onClick={keepEditing} disabled={isReloading}>
              Keep editing
            </Button>
            <Button variant="primary" onClick={reload} isLoading={isReloading}>
              Reload
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </SaveConflictContext.Provider>
  )
}
