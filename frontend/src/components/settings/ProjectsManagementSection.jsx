/**
 * ProjectsManagementSection
 * قسم إدارة المشاريع - عرض وحذف المشاريع
 */

import { useState, useEffect, useMemo } from 'react'
import { projectService } from '@/services'
import { extractErrorMessage } from '@/services/api'
import { useAuth } from '@/contexts'
import { useToast, Table, Badge, Pagination, Select } from '@/components/ui'
import { cn } from '@/utils/cn'

export function ProjectsManagementSection() {
  const toast = useToast()
  const { canDeleteProject } = useAuth()
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const data = await projectService.getAll()
      setProjects(data)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (projectId, projectTitle) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${projectTitle}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setDeletingId(projectId)
    try {
      await projectService.delete(projectId)
      toast.success('Project deleted successfully')
      loadProjects()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects
    }

    const query = searchQuery.toLowerCase().trim()
    return projects.filter(
      (project) =>
        project.title?.toLowerCase().includes(query) ||
        project.location?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project._id?.toLowerCase().includes(query)
    )
  }, [projects, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProjects.slice(start, start + itemsPerPage)
  }, [filteredProjects, currentPage, itemsPerPage])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const itemsPerPageOptions = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '20', label: '20 per page' },
    { value: '30', label: '30 per page' },
    { value: '50', label: '50 per page' },
  ]

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return 'N/A'
    }
  }

  return (
    <section className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-default dark:border-border-dark bg-gray-50/50 dark:bg-white/5">
        <div>
          <h2 className="text-lg font-bold text-text-main dark:text-white">
            Projects Management
          </h2>
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
            View and manage all projects
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Search Bar */}
        {!isLoading && projects.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search projects by title or description..."
                className={cn(
                  'w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm',
                  'border-border-default dark:border-border-dark',
                  'bg-white dark:bg-[#102216]',
                  'text-text-main dark:text-white',
                  'focus:ring-primary focus:border-primary',
                  'placeholder:text-text-secondary dark:placeholder:text-gray-500'
                )}
              />
            </div>
          </div>
        )}

        {/* Projects Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-text-secondary dark:text-gray-400 text-sm">Loading projects...</p>
            </div>
          </div>
        ) : (
          <div className="border border-border-default dark:border-border-dark rounded-lg overflow-hidden">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>ID</Table.Head>
                  <Table.Head>Title</Table.Head>
                  <Table.Head>Location</Table.Head>
                  <Table.Head>Created</Table.Head>
                  <Table.Head>Updated</Table.Head>
                  <Table.Head className="text-right">Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {paginatedProjects.length === 0 ? (
                  <Table.Empty
                    message={
                      searchQuery
                        ? 'No projects match your search'
                        : 'No projects found'
                    }
                  />
                ) : (
                  paginatedProjects.map((project) => (
                    <Table.Row key={project._id}>
                      <Table.Cell>
                        <span className="font-mono text-xs text-text-secondary dark:text-gray-400">
                          {project._id || 'N/A'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-sm">
                              folder
                            </span>
                          </div>
                          <span className="font-medium text-text-main dark:text-white">
                            {project.title}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-text-secondary dark:text-gray-400 text-sm">
                          {project.location || (
                            <span className="italic text-text-muted dark:text-gray-500">
                              No location
                            </span>
                          )}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-text-secondary dark:text-gray-400 text-sm">
                          {formatDate(project.createdAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-text-secondary dark:text-gray-400 text-sm">
                          {formatDate(project.updatedAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="text-right">
                        {canDeleteProject ? (
                          <button
                            onClick={() => handleDelete(project._id, project.title)}
                            disabled={deletingId === project._id}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                              'text-red-600 dark:text-red-400',
                              'hover:bg-red-50 dark:hover:bg-red-900/20',
                              'border border-red-200 dark:border-red-800',
                              'disabled:opacity-50 disabled:cursor-not-allowed',
                              'flex items-center gap-2 inline-flex'
                            )}
                          >
                            {deletingId === project._id ? (
                              <>
                                <div className="size-3 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-base">delete</span>
                                Delete
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-text-muted dark:text-gray-500 text-sm">—</span>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredProjects.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-text-secondary dark:text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredProjects.length)} of{' '}
                {filteredProjects.length} results
              </p>
              <Select
                value={String(itemsPerPage)}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                options={itemsPerPageOptions}
                size="sm"
                className="w-[160px]"
                selectClassName="h-9 text-sm pl-3 pr-8"
              />
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
