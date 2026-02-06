/**
 * useProjects Hook
 * Manages project list state and operations
 */
import { useState, useEffect, useCallback } from 'react'
import { projectService } from '@/services/projectService'
import { screeningService } from '@/services'
import { extractErrorMessage } from '@/services/api'
import { createDefaultWorkflow } from '@/utils/projectStatus'

const enhanceProject = (project) => ({
  ...project,
  workflow: project.workflow || createDefaultWorkflow(),
  screening: project.screening || null,
  _computed: project._computed || {
    hasManagementActivities: false,
    hasMitigationPlans: false,
    monitoringQuarters: { Q1: false, Q2: false, Q3: false, Q4: false },
  },
})

/**
 * Custom hook for managing projects
 * @returns {Object} Projects state and methods
 */
export function useProjects() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Fetch all projects
   */
  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await projectService.getAll()
      let screenings = []

      try {
        screenings = await screeningService.getAll()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load screenings for risk category:', extractErrorMessage(err))
      }

      const screeningByProjectId = new Map(
        screenings.map((screening) => {
          const projectId =
            typeof screening.project === 'object' ? screening.project?._id : screening.project
          return [projectId, screening]
        })
      )

      const merged = data.map((project) => {
        const screening = screeningByProjectId.get(project._id) || project.screening || null
        return enhanceProject({ ...project, screening })
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
      setProjects((prev) => [enhanceProject(newProject), ...prev])
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
        prev.map((p) => (p._id === id ? enhanceProject({ ...p, ...updatedProject }) : p))
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
