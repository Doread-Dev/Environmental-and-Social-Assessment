import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Icon, Alert } from '@/components/ui'
import { MetricCard, ProjectListItem } from '@/components/dashboard'
import { ROUTES } from '@/routes/routes.config'
import { useProjects } from '@/hooks'
import { calculateProjectStatus } from '@/utils'

/**
 * DashboardPage - صفحة لوحة التحكم الرئيسية
 * Layout: MainLayout
 */
function DashboardPage() {
  const navigate = useNavigate()
  const { projects, isLoading, error, fetchProjects } = useProjects()

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProjects = projects.length
    const inProgressProjects = projects.filter((p) => {
      const status = calculateProjectStatus(p.workflow)
      return status === 'in_progress'
    }).length

    const highRiskProjects = projects.filter((p) => {
      const category = p.screening?.category_code
      return category === 'A' || category === 'B'
    }).length

    const monitoringProjects = projects.filter((p) => {
      const status = calculateProjectStatus(p.workflow)
      return status === 'monitoring'
    }).length

    return {
      totalProjects,
      inProgressProjects,
      highRiskProjects,
      monitoringProjects,
    }
  }, [projects])

  // Get latest 5 projects
  const latestProjects = useMemo(() => {
    return [...projects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5)
  }, [projects])

  // Handlers
  const handleNewProject = () => {
    navigate(ROUTES.PROJECT_NEW)
  }

  const handleViewAllProjects = () => {
    navigate(ROUTES.PROJECTS)
  }

  const handleProjectClick = (project) => {
    navigate(`/app/projects/${project._id}/overview`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 max-w-md mx-auto mt-12">
        <Alert variant="error">Failed to load projects: {error}</Alert>
        <Button onClick={fetchProjects} variant="primary">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-main dark:text-white">
            Dashboard
          </h2>
          <p className="text-text-secondary dark:text-gray-400 mt-1 text-base">
            Overview of projects and environmental & social status.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" leftIcon={<Icon name="add" />} onClick={handleNewProject}>
            New Project
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Projects"
          value={stats.totalProjects}
          icon="folder"
          iconBgColor="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          title="Projects In Progress"
          value={stats.inProgressProjects}
          icon="timelapse"
          iconBgColor="bg-purple-50 dark:bg-purple-900/20"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <MetricCard
          title="High Risk Projects"
          value={stats.highRiskProjects}
          icon="warning"
          iconBgColor="bg-red-50 dark:bg-red-900/20"
          iconColor="text-red-600 dark:text-red-400"
          highlight
          badge="Attention"
          badgeVariant="warning"
        />
        <MetricCard
          title="Monitoring Due"
          value={stats.monitoringProjects}
          icon="event_note"
          iconBgColor="bg-orange-50 dark:bg-orange-900/20"
          iconColor="text-orange-600 dark:text-orange-400"
          subtitle="Q2 Deadline"
        />
      </div>

      {/* Latest Projects List */}
      <Card className="flex flex-col">
        <Card.Header className="flex justify-between items-center">
          <Card.Title>My Latest Projects</Card.Title>
          <button
            className="p-1 rounded hover:bg-background dark:hover:bg-white/5 text-text-secondary transition-colors"
            aria-label="Filter projects"
          >
            <Icon name="filter_list" />
          </button>
        </Card.Header>

        <Card.Body className="flex-1 p-2 overflow-y-auto max-h-[500px]">
          <ul className="flex flex-col gap-1">
            {latestProjects.map((project) => (
              <ProjectListItem key={project._id} project={project} onClick={handleProjectClick} />
            ))}
          </ul>
        </Card.Body>

        <Card.Footer className="p-4 border-t border-border-default dark:border-border-dark">
          <button
            className="w-full py-2 text-sm text-text-secondary hover:text-primary dark:hover:text-primary transition-colors font-medium text-center"
            onClick={handleViewAllProjects}
          >
            View All Projects
          </button>
        </Card.Footer>
      </Card>
    </div>
  )
}

export default DashboardPage
