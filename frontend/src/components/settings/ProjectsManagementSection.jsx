/**
 * ProjectsManagementSection
 * Settings → Projects (specialist / admin): active projects can be archived, or deleted while
 * nothing in them is approved (D17); archived projects can be restored, or deleted permanently by
 * an admin (D60). Every action asks first in an in-app dialog, and each button shows only when
 * the project's `allowed_actions` from the backend include it.
 */

import { useState, useEffect, useMemo } from 'react'
import { useProjects } from '@/hooks'
import {
  useToast,
  Table,
  Pagination,
  Select,
  Input,
  Icon,
  Button,
  StatusBadge,
  LoadingState,
  ConfirmDialog,
} from '@/components/ui'
import { formatDate } from '@/utils/formatters'

const VIEW_OPTIONS = [
  { value: 'active', label: 'Active projects' },
  { value: 'archived', label: 'Archived projects' },
]

const ITEMS_PER_PAGE_OPTIONS = [
  { value: '5', label: '5 per page' },
  { value: '10', label: '10 per page' },
  { value: '20', label: '20 per page' },
  { value: '30', label: '30 per page' },
  { value: '50', label: '50 per page' },
]

/** Copy and handler name of each confirmation */
const ACTIONS = {
  archive: {
    title: 'Archive project',
    confirm: 'Archive',
    icon: 'inventory_2',
    variant: 'primary',
    body: (t) =>
      `Archive "${t}"? It becomes read-only and leaves the project list. It can be restored later from the archived projects.`,
    done: 'Project archived',
  },
  delete: {
    title: 'Delete project',
    confirm: 'Delete',
    icon: 'delete',
    variant: 'danger',
    body: (t) => `Are you sure you want to delete "${t}"? This action cannot be undone.`,
    done: 'Project deleted successfully',
  },
  restore: {
    title: 'Restore project',
    confirm: 'Restore',
    icon: 'unarchive',
    variant: 'primary',
    body: (t) => `Restore "${t}"? It returns to the project list and can be edited again.`,
    done: 'Project restored',
  },
  purge: {
    title: 'Delete permanently',
    confirm: 'Delete permanently',
    icon: 'delete_forever',
    variant: 'danger',
    body: (t) =>
      `Permanently delete "${t}" with all its data, approved work and files included? This cannot be undone. The deletion is recorded in the activity log.`,
    done: 'Project deleted permanently',
  },
}

export function ProjectsManagementSection() {
  const toast = useToast()
  const [view, setView] = useState('active')
  // Same cached project lists as the Projects page; each project carries its allowed actions
  const {
    projects,
    isLoading,
    error,
    deleteProject,
    archiveProject,
    restoreProject,
    purgeProject,
    busyId,
  } = useProjects({ archived: view === 'archived' })
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [pending, setPending] = useState(null) // { action, project }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error, toast])

  const runners = {
    archive: archiveProject,
    delete: deleteProject,
    restore: restoreProject,
    purge: purgeProject,
  }

  const confirmPending = async () => {
    const { action, project } = pending
    const result = await runners[action](project._id)
    setPending(null)
    if (result.success) toast.success(ACTIONS[action].done)
    else toast.error(result.error)
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

  // Reset to page 1 when search or view changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, view])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isArchivedView = view === 'archived'
  const rowActions = isArchivedView ? ['restore', 'purge'] : ['archive', 'delete']
  const permissionOf = {
    archive: 'project.archive',
    delete: 'project.delete',
    restore: 'project.restore',
    purge: 'project.purge',
  }

  return (
    <section className="bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-default dark:border-border-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-text-main dark:text-white">
              Projects Management
            </h2>
            <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
              Archive, restore and delete projects
            </p>
          </div>
          <Select
            aria-label="Projects shown"
            value={view}
            onChange={(e) => setView(e.target.value)}
            options={VIEW_OPTIONS}
            className="sm:w-56"
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Search Bar */}
        {!isLoading && projects.length > 0 && (
          <Input
            className="mb-6"
            type="text"
            aria-label="Search projects"
            leftIcon={<Icon name="search" />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search projects by title or description..."
          />
        )}

        {/* Projects Table */}
        {isLoading ? (
          <LoadingState message="Loading projects..." variant="section" />
        ) : (
          <div className="border border-border-default dark:border-border-dark rounded-lg overflow-x-auto">
            <Table className="min-w-[760px]">
              <Table.Header>
                <Table.Row>
                  <Table.Head>ID</Table.Head>
                  <Table.Head>Title</Table.Head>
                  <Table.Head>Location</Table.Head>
                  <Table.Head>{isArchivedView ? 'Archived' : 'Created'}</Table.Head>
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
                        : isArchivedView
                          ? 'No archived projects'
                          : 'No projects found'
                    }
                  />
                ) : (
                  paginatedProjects.map((project) => {
                    const allowed = rowActions.filter((a) =>
                      project.allowed_actions?.includes(permissionOf[a])
                    )
                    return (
                      <Table.Row key={project._id}>
                        <Table.Cell>
                          <span className="font-mono text-xs text-text-secondary dark:text-gray-400">
                            {project._id || 'N/A'}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center gap-3">
                            <div className="size-8 shrink-0 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                              <span
                                className="material-symbols-outlined text-primary dark:text-green-300 text-sm"
                                aria-hidden="true"
                              >
                                {isArchivedView ? 'inventory_2' : 'folder'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                              <span
                                dir="auto"
                                className="font-medium text-text-main dark:text-white break-words"
                              >
                                {project.title}
                              </span>
                              {isArchivedView && (
                                <StatusBadge status="archived" size="sm" className="w-fit" />
                              )}
                            </div>
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
                            {formatDate(isArchivedView ? project.archived_at : project.createdAt) ||
                              'N/A'}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-text-secondary dark:text-gray-400 text-sm">
                            {formatDate(project.updatedAt) || 'N/A'}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="text-right">
                          {allowed.length > 0 ? (
                            <div className="inline-flex flex-wrap justify-end gap-2">
                              {allowed.map((action) => (
                                <Button
                                  key={action}
                                  size="sm"
                                  variant="secondary"
                                  className={
                                    ACTIONS[action].variant === 'danger'
                                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                      : undefined
                                  }
                                  disabled={busyId === project._id}
                                  onClick={() => setPending({ action, project })}
                                  leftIcon={
                                    <span
                                      className="material-symbols-outlined text-base"
                                      aria-hidden="true"
                                    >
                                      {ACTIONS[action].icon}
                                    </span>
                                  }
                                >
                                  {ACTIONS[action].confirm}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-text-muted dark:text-gray-500 text-sm">—</span>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    )
                  })
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
                aria-label="Projects per page"
                value={String(itemsPerPage)}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                options={ITEMS_PER_PAGE_OPTIONS}
                size="sm"
                className="w-[160px]"
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

      {pending && (
        <ConfirmDialog
          title={ACTIONS[pending.action].title}
          message={<p>{ACTIONS[pending.action].body(pending.project.title)}</p>}
          confirmLabel={ACTIONS[pending.action].confirm}
          confirmIcon={ACTIONS[pending.action].icon}
          variant={ACTIONS[pending.action].variant}
          isLoading={busyId === pending.project._id}
          onConfirm={confirmPending}
          onClose={() => setPending(null)}
        />
      )}
    </section>
  )
}
