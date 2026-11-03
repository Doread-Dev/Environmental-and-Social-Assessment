/**
 * useWorkflow Hook
 * Derives workflow status from actual project entities
 *
 * This hook aggregates data from screening, assessment, SEMP, and monitoring
 * to compute the real workflow status for a project.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useScreening, useAssessment } from '@/hooks'
import { assessmentService, monitoringService, screeningService, sempService } from '@/services'
import {
  deriveWorkflowStatus,
  getNextAction,
  calculateProjectStatusFromWorkflow,
} from '@/utils/workflowDerivation'
import { WORKFLOW_CHANGED_EVENT } from '@/utils/workflowEvents'

const EMPTY = {
  screening: null,
  assessment: null,
  managementActivities: [],
  mitigationPlans: [],
  monitoringRecords: [],
}

// A failed request counts as "nothing there yet", like the services' own 404 handling.
async function loadEntities(projectId) {
  const [screening, assessment, managementActivities, mitigationPlans, monitoringRecords] =
    await Promise.allSettled([
      screeningService.getByProject(projectId),
      assessmentService.getByProject(projectId),
      sempService.getManagementActivities(projectId),
      sempService.getMitigationPlans(projectId),
      monitoringService.getByProject(projectId),
    ])
  const value = (result, fallback) =>
    result.status === 'fulfilled' ? (result.value ?? fallback) : fallback
  return {
    screening: value(screening, null),
    assessment: value(assessment, null),
    managementActivities: value(managementActivities, []),
    mitigationPlans: value(mitigationPlans, []),
    monitoringRecords: value(monitoringRecords, []),
  }
}

/**
 * Hook to compute workflow status for a specific project
 * @param {string} projectId - Project ID
 * @returns {Object} Workflow data and loading state
 */
export function useWorkflow(projectId) {
  const [entities, setEntities] = useState(EMPTY)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!projectId) {
        setIsLoading(false)
        return
      }
      if (!silent) setIsLoading(true)
      const loaded = await loadEntities(projectId)
      setEntities(loaded)
      setIsLoading(false)
    },
    [projectId]
  )

  useEffect(() => {
    let isMounted = true
    setEntities(EMPTY)
    setIsLoading(true)
    if (!projectId) {
      setIsLoading(false)
      return undefined
    }
    loadEntities(projectId).then((loaded) => {
      if (!isMounted) return
      setEntities(loaded)
      setIsLoading(false)
    })
    return () => {
      isMounted = false
    }
  }, [projectId])

  // Refetch after a save/submit/approve on any page. Silent: the layout keeps the page mounted.
  useEffect(() => {
    const handleChange = (event) => {
      if (event.detail?.projectId === projectId) load({ silent: true })
    }
    window.addEventListener(WORKFLOW_CHANGED_EVENT, handleChange)
    return () => window.removeEventListener(WORKFLOW_CHANGED_EVENT, handleChange)
  }, [projectId, load])

  const { screening, assessment, managementActivities, mitigationPlans, monitoringRecords } =
    entities

  const workflow = useMemo(() => deriveWorkflowStatus(entities), [entities])

  // Compute next action
  const nextAction = useMemo(() => getNextAction(workflow), [workflow])

  // Compute project status
  const projectStatus = useMemo(() => calculateProjectStatusFromWorkflow(workflow), [workflow])

  return {
    workflow,
    nextAction,
    projectStatus,
    isLoading,
    refetch: load,

    // Raw entities (for components that need them)
    screening,
    assessment,
    managementActivities,
    mitigationPlans,
    monitoringRecords,
  }
}

/**
 * Lightweight version that only fetches screening and assessment
 * Used for list views where we don't need full SEMP/Monitoring data
 */
export function useWorkflowLight(projectId) {
  const { screening, isLoading: screeningLoading } = useScreening(projectId)
  const { assessment, isLoading: assessmentLoading } = useAssessment(projectId)

  // Compute derived workflow (with empty SEMP/Monitoring)
  const workflow = useMemo(() => {
    return deriveWorkflowStatus({
      screening,
      assessment,
      managementActivities: [],
      mitigationPlans: [],
      monitoringRecords: [],
    })
  }, [screening, assessment])

  const isLoading = screeningLoading || assessmentLoading

  return {
    workflow,
    isLoading,
    screening,
    assessment,
  }
}

export default useWorkflow
