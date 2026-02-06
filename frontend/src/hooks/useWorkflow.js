/**
 * useWorkflow Hook
 * Derives workflow status from actual project entities
 *
 * This hook aggregates data from screening, assessment, SEMP, and monitoring
 * to compute the real workflow status for a project.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useScreening, useAssessment } from '@/hooks'
import api from '@/services/api'
import { extractErrorMessage } from '@/services/api'
import {
  deriveWorkflowStatus,
  getNextAction,
  calculateProjectStatusFromWorkflow,
} from '@/utils/workflowDerivation'

/**
 * Hook to compute workflow status for a specific project
 * @param {string} projectId - Project ID
 * @returns {Object} Workflow data and loading state
 */
export function useWorkflow(projectId) {
  const { screening, isLoading: screeningLoading } = useScreening(projectId)
  const { assessment, isLoading: assessmentLoading } = useAssessment(projectId)

  // SEMP data (management activities + mitigation plans)
  const [managementActivities, setManagementActivities] = useState([])
  const [mitigationPlans, setMitigationPlans] = useState([])
  const [sempLoading, setSempLoading] = useState(true)

  // Monitoring data
  const [monitoringRecords, setMonitoringRecords] = useState([])
  const [monitoringLoading, setMonitoringLoading] = useState(true)

  // Fetch SEMP data
  useEffect(() => {
    if (!projectId) {
      setSempLoading(false)
      return
    }

    let isMounted = true
    setSempLoading(true)

    Promise.allSettled([
      api.get(`/management/project/${projectId}`),
      api.get(`/mitigation/project/${projectId}`),
    ])
      .then(([activitiesResult, plansResult]) => {
        if (!isMounted) return

        setManagementActivities(
          activitiesResult.status === 'fulfilled' ? activitiesResult.value.data.data || [] : []
        )
        setMitigationPlans(
          plansResult.status === 'fulfilled' ? plansResult.value.data.data || [] : []
        )
      })
      .catch(() => {
        if (!isMounted) return
        setManagementActivities([])
        setMitigationPlans([])
      })
      .finally(() => {
        if (isMounted) setSempLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [projectId])

  // Function to fetch monitoring data
  const fetchMonitoringData = useCallback(() => {
    if (!projectId) {
      setMonitoringLoading(false)
      return
    }

    setMonitoringLoading(true)

    api
      .get(`/monitoring/project/${projectId}`)
      .then((response) => {
        setMonitoringRecords(response.data.data || [])
      })
      .catch(() => {
        setMonitoringRecords([])
      })
      .finally(() => {
        setMonitoringLoading(false)
      })
  }, [projectId])

  // Fetch monitoring data on mount and when projectId changes
  useEffect(() => {
    fetchMonitoringData()
  }, [fetchMonitoringData])

  // Listen for monitoring data updates (after save)
  useEffect(() => {
    const handleMonitoringUpdate = (event) => {
      const updatedProjectId = event.detail?.projectId
      if (updatedProjectId === projectId) {
        fetchMonitoringData()
      }
    }

    window.addEventListener('monitoring-data-updated', handleMonitoringUpdate)
    return () => {
      window.removeEventListener('monitoring-data-updated', handleMonitoringUpdate)
    }
  }, [projectId, fetchMonitoringData])

  // Compute derived workflow
  const workflow = useMemo(() => {
    return deriveWorkflowStatus({
      screening,
      assessment,
      managementActivities,
      mitigationPlans,
      monitoringRecords,
    })
  }, [screening, assessment, managementActivities, mitigationPlans, monitoringRecords])

  // Compute next action
  const nextAction = useMemo(() => getNextAction(workflow), [workflow])

  // Compute project status
  const projectStatus = useMemo(() => calculateProjectStatusFromWorkflow(workflow), [workflow])

  // Loading state
  const isLoading = screeningLoading || assessmentLoading || sempLoading || monitoringLoading

  return {
    workflow,
    nextAction,
    projectStatus,
    isLoading,

    // Raw entities (for components that need them)
    screening,
    assessment,
    managementActivities,
    mitigationPlans,
    monitoringRecords,

    // Individual loading states
    screeningLoading,
    assessmentLoading,
    sempLoading,
    monitoringLoading,
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
