/**
 * Unsaved-changes guard (D61, D73): one for the whole app, used by every editing page.
 *
 * Pages register with `useUnsavedChanges(isDirty, onSave)`. While one has changes:
 * - every in-app navigation (links, sidebar, Back, the browser's Back) is held by React Router's
 *   `useBlocker` and this in-app dialog asks **Save / Discard / Stay**;
 * - `beforeunload` is registered (refresh, closing the tab), and only then;
 * - `confirmLeave(action)` asks the same before an exit that is not a navigation (sign out).
 * "Save" runs the page's own save and leaves only when it succeeded; a failed save keeps the user
 * on the page with its error (or the stale-save / sign-in dialog). Never `window.confirm`, which
 * some browsers and embedded views suppress.
 *
 * Mounted once inside the router (routes/index.jsx, AppShell).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { Button, Modal } from '@/components/ui'
import { isLeavingAllowed } from '@/utils/leaveGuard'
import { UnsavedChangesContext } from './useUnsavedChanges'

export function UnsavedChangesProvider({ children }) {
  const entries = useRef(new Map())
  const bypass = useRef(false)
  const [hasDirtyPage, setHasDirtyPage] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const dirtyEntries = () => [...entries.current.values()].filter((entry) => entry.isDirty)
  const sync = useCallback(() => setHasDirtyPage(dirtyEntries().length > 0), [])

  const register = useCallback(
    (id, entry) => {
      entries.current.set(id, entry)
      sync()
    },
    [sync]
  )

  const unregister = useCallback(
    (id) => {
      entries.current.delete(id)
      sync()
    },
    [sync]
  )

  // The next navigation is the page's own (after a successful save, or an explicit discard).
  const leaveWithoutAsking = useCallback(() => {
    bypass.current = true
    setTimeout(() => {
      bypass.current = false
    }, 0)
  }, [])

  const shouldBlock = useCallback(({ currentLocation, nextLocation }) => {
    if (bypass.current) {
      bypass.current = false
      return false
    }
    if (dirtyEntries().length === 0) return false
    return (
      currentLocation.pathname !== nextLocation.pathname ||
      currentLocation.search !== nextLocation.search
    )
  }, [])
  const blocker = useBlocker(shouldBlock)

  const confirmLeave = useCallback(
    (action) => {
      if (dirtyEntries().length === 0) {
        leaveWithoutAsking()
        action()
        return
      }
      setPendingAction(() => action)
    },
    [leaveWithoutAsking]
  )

  // Refresh / closing the tab: the browser's own prompt, only while a page has changes.
  useEffect(() => {
    if (!hasDirtyPage) return undefined
    const onBeforeUnload = (event) => {
      if (isLeavingAllowed()) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasDirtyPage])

  const isAsking = blocker.state === 'blocked' || pendingAction !== null
  const canSave = isAsking && dirtyEntries().every((entry) => entry.canSave)

  const stay = useCallback(() => {
    if (blocker.state === 'blocked') blocker.reset()
    setPendingAction(null)
  }, [blocker])

  const leave = useCallback(() => {
    if (blocker.state === 'blocked') blocker.proceed()
    if (pendingAction) {
      leaveWithoutAsking()
      pendingAction()
    }
    setPendingAction(null)
  }, [blocker, pendingAction, leaveWithoutAsking])

  const saveAndLeave = useCallback(async () => {
    setIsSaving(true)
    let saved = true
    for (const entry of dirtyEntries()) {
      try {
        const result = await entry.save()
        if (result?.success === false) saved = false
      } catch {
        saved = false
      }
      if (!saved) break
    }
    setIsSaving(false)
    if (saved) leave()
    else stay()
  }, [leave, stay])

  const value = useMemo(
    () => ({ register, unregister, leaveWithoutAsking, confirmLeave }),
    [register, unregister, leaveWithoutAsking, confirmLeave]
  )

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      {isAsking && (
        <Modal
          isOpen
          onClose={isSaving ? () => {} : stay}
          title="Unsaved changes"
          description="This page has changes that are not saved yet."
          sub_description="Save them before leaving, discard them, or stay on the page."
          size="lg"
        >
          <Modal.Footer className="mt-2 flex-wrap">
            <Button variant="ghost" onClick={stay} disabled={isSaving}>
              Stay
            </Button>
            <Button variant="outline" onClick={leave} disabled={isSaving}>
              Discard changes
            </Button>
            {canSave && (
              <Button variant="primary" onClick={saveAndLeave} isLoading={isSaving}>
                Save
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      )}
    </UnsavedChangesContext.Provider>
  )
}
