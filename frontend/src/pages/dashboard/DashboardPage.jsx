import { useNavigate } from 'react-router-dom'
import { Button, Card, Icon, LoadingState, PageHeader, ErrorState } from '@/components/ui'
import { MetricCard, ProjectListItem } from '@/components/dashboard'
import { ROUTES } from '@/routes/routes.config'
import { useDashboard } from '@/hooks'
import { useAuth } from '@/contexts'

/**
 * DashboardPage - the main dashboard
 * Layout: MainLayout
 */
function DashboardPage() {
  const navigate = useNavigate()
  const { canCreateProject } = useAuth()
  // Stats and the latest 5 projects are computed by the backend (one request, D31)
  const { stats, latestProjects, isLoading, error, refetch } = useDashboard()

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
    return <LoadingState message="Loading dashboard..." />
  }

  if (error && !stats) {
    return <ErrorState title="Failed to load the dashboard" message={error} onRetry={refetch} />
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Overview of projects and environmental & social status."
        actions={
          canCreateProject && (
            <Button variant="primary" leftIcon={<Icon name="add" />} onClick={handleNewProject}>
              New Project
            </Button>
          )
        }
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Projects"
          value={stats.total_projects}
          icon="folder"
          iconBgColor="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          title="Projects In Progress"
          value={stats.by_status.in_progress}
          icon="timelapse"
          iconBgColor="bg-purple-50 dark:bg-purple-900/20"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <MetricCard
          title="High Risk Projects"
          value={stats.high_risk}
          icon="warning"
          iconBgColor="bg-red-50 dark:bg-red-900/20"
          iconColor="text-red-600 dark:text-red-400"
          highlight
          badge="Attention"
          badgeVariant="warning"
        />
        <MetricCard
          title="Monitoring Due"
          value={stats.by_status.monitoring}
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
