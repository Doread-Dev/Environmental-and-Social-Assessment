import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Button, Table, Pagination, Icon, Dropdown } from '@/components/ui'
import {
  WorkflowProgressBar,
  ScreeningCategoryBadge,
  ProjectStatusBadge,
} from '@/components/dashboard'
import { mockProjects, calculateProjectStatus } from '@/data'
import { formatDateRange, formatDuration, calculateDurationMonths } from '@/utils'
import { ROUTES, getProjectRoute } from '@/routes/routes.config'

/**
 * ProjectListPage - صفحة قائمة المشاريع
 * Layout: MainLayout
 */
function ProjectListPage() {
  const navigate = useNavigate()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...mockProjects]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(query) || p.location.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => {
        const status = calculateProjectStatus(p.workflow)
        return status === statusFilter
      })
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter((p) => {
        const category = p.screening?.category_code
        return category === riskFilter
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updatedAt':
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        case 'title':
          return a.title.localeCompare(b.title)
        case 'startDate':
          return new Date(a.start_date) - new Date(b.start_date)
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, statusFilter, riskFilter, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage)
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedProjects.slice(start, start + itemsPerPage)
  }, [filteredAndSortedProjects, currentPage, itemsPerPage])

  // Handlers
  const handleNewProject = () => {
    navigate(ROUTES.PROJECT_NEW)
  }

  const handleProjectClick = (project) => {
    navigate(getProjectRoute(project._id, ROUTES.PROJECT_OVERVIEW))
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'needs_action', label: 'Needs Action' },
    { value: 'completed', label: 'Completed' },
  ]

  const riskOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'A', label: 'A - High Risk' },
    { value: 'B', label: 'B - Low-Moderate Risk' },
    { value: 'C', label: 'C - Negligible Risk' },
    { value: 'D', label: 'D - Emergency' },
    { value: 'E', label: 'E - Insufficient Info' },
    { value: 'F', label: 'F - Positive Impact' },
  ]

  const sortOptions = [
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'title', label: 'Title' },
    { value: 'startDate', label: 'Start Date' },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-text-main dark:text-white text-2xl font-bold tracking-tight">
            Projects
          </h2>
          <p className="text-text-secondary mt-1 text-sm">
            Manage environmental and social compliance across all active initiatives.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Icon name="add" />} onClick={handleNewProject}>
          Create New Project
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div className="flex flex-1 w-full xl:w-auto gap-3 flex-wrap">
          {/* Search */}
          <Input
            placeholder="Search project name or location..."
            leftIcon={<Icon name="search" />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full sm:w-80"
          />

          {/* Status Filter */}
          <Dropdown
            trigger={
              <Button variant="secondary" rightIcon={<Icon name="expand_more" />}>
                Status: {statusOptions.find((o) => o.value === statusFilter)?.label || 'All'}
              </Button>
            }
            items={statusOptions.map((opt) => ({
              label: opt.label,
              onClick: () => {
                setStatusFilter(opt.value)
                setCurrentPage(1)
              },
              active: statusFilter === opt.value,
            }))}
          />

          {/* Risk Filter */}
          <Dropdown
            trigger={
              <Button variant="secondary" rightIcon={<Icon name="expand_more" />}>
                Risk: {riskOptions.find((o) => o.value === riskFilter)?.label || 'All Categories'}
              </Button>
            }
            items={riskOptions.map((opt) => ({
              label: opt.label,
              onClick: () => {
                setRiskFilter(opt.value)
                setCurrentPage(1)
              },
              active: riskFilter === opt.value,
            }))}
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end xl:self-auto">
          <span className="text-sm text-text-secondary">Sort by:</span>
          <Dropdown
            trigger={
              <Button variant="ghost" rightIcon={<Icon name="sort" />}>
                {sortOptions.find((o) => o.value === sortBy)?.label || 'Last Updated'}
              </Button>
            }
            items={sortOptions.map((opt) => ({
              label: opt.label,
              onClick: () => {
                setSortBy(opt.value)
                setCurrentPage(1)
              },
              active: sortBy === opt.value,
            }))}
          />
        </div>
      </div>

      {/* Projects Table */}
      <div className="overflow-x-auto">
        <Table className="min-w-[1000px]">
          <Table.Header>
            <Table.Row>
              <Table.Head className="w-1/4">Project Details</Table.Head>
              <Table.Head>Duration</Table.Head>
              <Table.Head>Risk Cat.</Table.Head>
              <Table.Head className="text-center">Progress (S/A/M/R)</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head className="text-right">Action</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {paginatedProjects.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Icon name="folder_off" className="text-4xl text-text-secondary" />
                    <p className="text-text-secondary">No projects found</p>
                    {searchQuery || statusFilter !== 'all' || riskFilter !== 'all' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('')
                          setStatusFilter('all')
                          setRiskFilter('all')
                        }}
                      >
                        Clear Filters
                      </Button>
                    ) : null}
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : (
              paginatedProjects.map((project) => {
                const projectStatus = calculateProjectStatus(project.workflow)
                const duration = calculateDurationMonths(project.start_date, project.end_date)

                return (
                  <Table.Row
                    key={project._id}
                    className="hover:bg-background dark:hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleProjectClick(project)}
                  >
                    <Table.Cell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-main dark:text-white text-sm">
                          {project.title}
                        </span>
                        <div className="flex items-center gap-1 mt-1 text-text-secondary text-xs">
                          <Icon name="location_on" className="text-[14px]" />
                          {project.location}
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-text-main dark:text-gray-300">
                          {formatDateRange(project.start_date, project.end_date)}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {formatDuration(duration)}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {project.screening?.category_code && (
                        <ScreeningCategoryBadge
                          category={project.screening.category_code}
                          size="md"
                        />
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col items-center gap-1">
                        <WorkflowProgressBar
                          progress={project.workflow}
                          size="sm"
                          showLabels={true}
                        />
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <ProjectStatusBadge status={projectStatus} size="sm" />
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <button
                        className="text-sm font-medium text-text-secondary hover:text-primary transition-colors flex items-center justify-end gap-1 ml-auto"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleProjectClick(project)
                        }}
                      >
                        Open Project
                        <Icon name="arrow_forward" className="text-[18px]" />
                      </button>
                    </Table.Cell>
                  </Table.Row>
                )
              })
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedProjects.length)} of{' '}
            {filteredAndSortedProjects.length} results
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}

export default ProjectListPage
