import { useOutletContext } from 'react-router-dom'

/**
 * Custom hook to access project data from ProjectLayout context
 * @returns {{ project: Object }} Project context
 */
export function useProjectContext() {
  return useOutletContext()
}
