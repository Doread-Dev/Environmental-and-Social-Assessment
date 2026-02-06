/**
 * useProjects Hook
 * Manages project list state and operations
 */
import { useState, useEffect, useCallback } from 'react'
import { projectService } from '@/services/projectService'
import { screeningService, assessmentService, sempService } from '@/services'
import { extractErrorMessage } from '@/services/api'
import { deriveWorkflowStatus, calculateProjectStatusFromWorkflow } from '@/utils/workflowDerivation'

/**
 * Enhance project with derived workflow from screening, assessment, and SEMP
 * For list view, we fetch screening, assessment, and SEMP data
 */
const enhanceProjectWithWorkflow = (
  project,
  screening,
  assessment,
  managementActivities = [],
  mitigationPlans = []
) => {
  const workflow = deriveWorkflowStatus({
    screening,
    assessment,
    managementActivities,
    mitigationPlans,
    monitoringRecords: [],
  })

  return {
    ...project,
    screening: screening || null,
    assessment: assessment || null,
    workflow, // Derived workflow
    projectStatus: calculateProjectStatusFromWorkflow(workflow),
  }
}

/**
 * Custom hook for managing projects
 * @returns {Object} Projects state and methods
 */
export function useProjects() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Fetch all projects with screenings, assessments, and SEMP data for workflow derivation
   */
  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch projects, screenings, and assessments first
      const [projectsData, screeningsResult, assessmentsResult] = await Promise.allSettled([
        projectService.getAll(),
        screeningService.getAll(),
        assessmentService.getAll(),
      ])

      if (projectsData.status === 'rejected') {
        throw new Error(extractErrorMessage(projectsData.reason))
      }

      const projects = projectsData.value
      const screenings =
        screeningsResult.status === 'fulfilled' ? screeningsResult.value : []
      const assessments =
        assessmentsResult.status === 'fulfilled' ? assessmentsResult.value : []

      // Create lookup maps by project ID
      const screeningByProjectId = new Map(
        screenings.map((screening) => {
          const projectId =
            typeof screening.project === 'object' ? screening.project?._id : screening.project
          return [projectId, screening]
        })
      )

      const assessmentByProjectId = new Map(
        assessments.map((assessment) => {
          const projectId =
            typeof assessment.project === 'object' ? assessment.project?._id : assessment.project
          return [projectId, assessment]
        })
      )

      // Fetch SEMP data for all projects in parallel
      const sempPromises = projects.map(async (project) => {
        try {
          const [activities, plans] = await Promise.allSettled([
            sempService.getManagementActivities(project._id),
            sempService.getMitigationPlans(project._id),
          ])
          return {
            projectId: project._id,
            activities:
              activities.status === 'fulfilled' ? activities.value : [],
            plans: plans.status === 'fulfilled' ? plans.value : [],
          }
        } catch {
          return {
            projectId: project._id,
            activities: [],
            plans: [],
          }
        }
      })

      const sempDataResults = await Promise.allSettled(sempPromises)

      // Group SEMP data by project ID
      const managementActivitiesByProjectId = new Map()
      const mitigationPlansByProjectId = new Map()

      sempDataResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { projectId, activities, plans } = result.value
          managementActivitiesByProjectId.set(projectId, activities)
          mitigationPlansByProjectId.set(projectId, plans)
        }
      })

      // Merge projects with derived workflow
      const merged = projects.map((project) => {
        const screening = screeningByProjectId.get(project._id) || null
        const assessment = assessmentByProjectId.get(project._id) || null
        const activities = managementActivitiesByProjectId.get(project._id) || []
        const plans = mitigationPlansByProjectId.get(project._id) || []
        return enhanceProjectWithWorkflow(project, screening, assessment, activities, plans)
      })

      setProjects(merged)
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      // eslint-disable-next-line no-console
      console.error('Failed to fetch projects:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Fetch projects on mount
   */
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  /**
   * Create a new project
   * @param {Object} data - Project data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const createProject = useCallback(async (data) => {
    try {
      const newProject = await projectService.create(data)
      // New project has no screening/assessment yet
      const enhanced = enhanceProjectWithWorkflow(newProject, null, null)
      setProjects((prev) => [enhanced, ...prev])
      return { success: true, data: newProject }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      return { success: false, error: errorMessage }
    }
  }, [])

  /**
   * Update an existing project
   * @param {string} id - Project ID
   * @param {Object} data - Updated data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateProject = useCallback(async (id, data) => {
    try {
      const updatedProject = await projectService.update(id, data)
      setProjects((prev) =>
        prev.map((p) => {
          if (p._id !== id) return p
          // Preserve existing screening/assessment when updating project details
          return enhanceProjectWithWorkflow(
            { ...p, ...updatedProject },
            p.screening,
            p.assessment
          )
        })
      )
      return { success: true, data: updatedProject }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      return { success: false, error: errorMessage }
    }
  }, [])

  /**
   * Delete a project
   * @param {string} id - Project ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteProject = useCallback(async (id) => {
    try {
      await projectService.delete(id)
      setProjects((prev) => prev.filter((p) => p._id !== id))
      return { success: true }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      return { success: false, error: errorMessage }
    }
  }, [])

  /**
   * Get a project by ID from local state
   * @param {string} id - Project ID
   * @returns {Object|undefined}
   */
  const getProjectById = useCallback((id) => projects.find((p) => p._id === id), [projects])

  return {
    // State
    projects,
    isLoading,
    error,

    // Actions
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
  }
}

export default useProjects
