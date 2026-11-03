/**
 * Workflow change notifications
 *
 * Each page loads its own copy of the tool data, so the project sidebar and the
 * projects list do not see a save, submit or approve made on a page. Hooks that
 * change workflow data call notifyWorkflowChanged() after a successful request;
 * useWorkflow and useProjects listen and refetch.
 */

export const WORKFLOW_CHANGED_EVENT = 'workflow-data-changed'

/**
 * @param {string} projectId - Project whose workflow data changed
 */
export function notifyWorkflowChanged(projectId) {
  window.dispatchEvent(new CustomEvent(WORKFLOW_CHANGED_EVENT, { detail: { projectId } }))
}
