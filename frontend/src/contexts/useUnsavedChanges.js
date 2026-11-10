import { createContext, useCallback, useContext, useEffect, useId, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Unsaved-changes guard (D61, D73); the provider lives in UnsavedChangesContext.jsx.
 * Context value: `register(id, entry)`, `unregister(id)`, `leaveWithoutAsking()` (the next
 * navigation is not blocked) and `confirmLeave(action)` (ask first if a page has changes, then
 * run `action`, e.g. sign out). Null without a provider: the hooks below then do nothing.
 */
export const UnsavedChangesContext = createContext(null)

/**
 * Register an editing page (or an open edit form) with the shared guard.
 *
 * While `isDirty`, leaving the page — any in-app link, Back, the browser's Back, refresh or
 * closing the tab — asks first: Save / Discard / Stay (an in-app dialog; `beforeunload` only while
 * there are changes). `onSave` runs for "Save"; it returns `{ success }` (or a promise of it) and
 * the user leaves only when it succeeded. Without `onSave` the dialog offers Discard / Stay only
 * (e.g. creating a user: its one-time password must be seen on this page, D22).
 *
 * @param {boolean} isDirty - The page has changes that are not saved
 * @param {(() => Promise<{success: boolean}>|{success: boolean}) | null} [onSave]
 * @returns {{ navigateAway: Function }} `navigateAway(to, options)`: navigate without asking, for
 *   the page's own navigation right after a successful save or an explicit discard
 */
export function useUnsavedChanges(isDirty, onSave) {
  const guard = useContext(UnsavedChangesContext)
  const id = useId()
  const navigate = useNavigate()
  const saveRef = useRef(onSave)

  useEffect(() => {
    saveRef.current = onSave
  })

  const canSave = typeof onSave === 'function'
  useEffect(() => {
    guard?.register(id, { isDirty: !!isDirty, canSave, save: () => saveRef.current?.() })
  }, [guard, id, isDirty, canSave])

  useEffect(() => () => guard?.unregister(id), [guard, id])

  const navigateAway = useCallback(
    (to, options) => {
      guard?.leaveWithoutAsking()
      navigate(to, options)
    },
    [guard, navigate]
  )

  return { navigateAway }
}

/**
 * Run an action that leaves the page (e.g. sign out) after asking Save / Discard / Stay when the
 * page has unsaved changes; without changes it runs at once.
 * @returns {(action: () => void) => void}
 */
export function useConfirmLeave() {
  const guard = useContext(UnsavedChangesContext)
  return useCallback((action) => (guard ? guard.confirmLeave(action) : action()), [guard])
}
