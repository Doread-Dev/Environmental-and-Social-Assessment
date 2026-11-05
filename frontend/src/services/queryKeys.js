/**
 * Query keys, one per resource (D33)
 *
 * Every useQuery in the app takes its key from here so that mutations can refresh exactly what
 * they changed.
 */

export const queryKeys = {
  me: ['me'],
  lookups: ['lookups'],
  users: ['users'],
  dashboard: ['dashboard'],
  projects: ['projects'],
  // Under the ['projects'] prefix, so every project-list invalidation refreshes it too
  archivedProjects: ['projects', 'archived'],
  workspace: (projectId) => ['workspace', projectId],
  screening: (projectId) => ['screening', projectId],
  assessment: (projectId) => ['assessment', projectId],
  management: (projectId) => ['management', projectId],
  mitigation: (projectId) => ['mitigation', projectId],
  monitoring: (projectId) => ['monitoring', projectId],
  files: (projectId, area) => ['files', projectId, area],
  // Reference library (D64): every document, or those linked to one place. Writes refresh
  // ['library'] (all of them).
  library: (place = null) => ['library', place ?? 'all'],
  auditLogs: (params) => ['audit-logs', params],
}

/**
 * After a write on a project: refresh its workspace (workflow state, allowed actions) and mark
 * the project list and dashboard stale. Resolves once the active queries have refetched, so a
 * caller that navigates afterwards sees the new state in guards and the sidebar.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} projectId
 */
export function invalidateProjectState(queryClient, projectId) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.workspace(projectId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ])
}
