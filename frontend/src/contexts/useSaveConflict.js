import { createContext, useContext } from 'react'

/**
 * Stale-save context (D62, D73); the provider lives in SaveConflictContext.jsx.
 * - `showConflict({ projectId, queryKeys })`: open the "Someone else changed this" dialog;
 *   Reload refetches those queries and the project's workspace.
 * - `reloadKey`: changes after a Reload; the project layouts key their page on it, so the page
 *   mounts again from the fresh data (forms, local drafts and the versions they hold).
 * Without a provider (e.g. a hook test) `showConflict` is null and the save shows the message as
 * a plain error.
 */
export const SaveConflictContext = createContext({ showConflict: null, reloadKey: 0 })

export function useSaveConflict() {
  return useContext(SaveConflictContext)
}
