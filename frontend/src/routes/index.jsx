import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from './routes.config'
import ProtectedRoute from './ProtectedRoute'

// Layouts
import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import ProjectLayout from '@/components/layout/ProjectLayout'

// Import actual page components
import * as Auth from '@/pages/auth'
import * as Dashboard from '@/pages/dashboard'
import * as Projects from '@/pages/projects'

// Project Workspace Pages
import { ProjectOverviewPage } from '@/pages/project-workspace/overview'
import ScreeningRouter from '@/pages/project-workspace/screening/ScreeningRouter'
import { ScreeningSummaryPage } from '@/pages/project-workspace/screening'

const AssessmentGatewayPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Assessment Gateway</h1>
    <p className="text-text-secondary dark:text-gray-400">
      Assessment gateway page placeholder - Phase 6
    </p>
  </div>
)

const AssessmentMetadataPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Assessment Metadata</h1>
    <p className="text-text-secondary dark:text-gray-400">
      Assessment metadata page placeholder - Phase 6
    </p>
  </div>
)

const AssessmentMethodsPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Assessment Methods</h1>
    <p className="text-text-secondary dark:text-gray-400">
      Assessment methods page placeholder - Phase 6
    </p>
  </div>
)

const AssessmentScoringPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Assessment Scoring</h1>
    <p className="text-text-secondary dark:text-gray-400">
      Assessment scoring page placeholder - Phase 6
    </p>
  </div>
)

const AssessmentReviewPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Assessment Review</h1>
    <p className="text-text-secondary dark:text-gray-400">
      Assessment review page placeholder - Phase 6
    </p>
  </div>
)

const SempOverviewPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">SEMP Overview</h1>
    <p className="text-text-secondary dark:text-gray-400">
      SEMP overview page placeholder - Phase 7
    </p>
  </div>
)

const ManagementActivitiesPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">
      Management Activities
    </h1>
    <p className="text-text-secondary dark:text-gray-400">
      Management activities page placeholder - Phase 7
    </p>
  </div>
)

const MitigationPlanPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Mitigation Plan</h1>
    <p className="text-text-secondary dark:text-gray-400">
      Mitigation plan page placeholder - Phase 7
    </p>
  </div>
)

const MonitoringOverviewPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Monitoring Overview</h1>
    <p className="text-text-secondary dark:text-gray-400">
      Monitoring overview page placeholder - Phase 8
    </p>
  </div>
)

const MonitoringDataEntryPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">
      Monitoring Data Entry
    </h1>
    <p className="text-text-secondary dark:text-gray-400">
      Monitoring data entry page placeholder - Phase 8
    </p>
  </div>
)

const ProjectFilesPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Project Files</h1>
    <p className="text-text-secondary dark:text-gray-400">
      Project files page placeholder - Phase 8
    </p>
  </div>
)

const AnnexOverviewPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Annex & Attachments</h1>
    <p className="text-text-secondary dark:text-gray-400">
      Annex overview page placeholder - Phase 8
    </p>
  </div>
)

// Not Found Page
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-text-main dark:text-white mb-2">Page Not Found</p>
      <p className="text-text-secondary dark:text-gray-400 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <a
        href={ROUTES.DASHBOARD}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors"
      >
        <span className="material-symbols-outlined">home</span>
        Back to Dashboard
      </a>
    </div>
  </div>
)

/**
 * Application Router Configuration
 */
export const router = createBrowserRouter([
  // ==========================================
  // Auth Routes (Public)
  // ==========================================
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.LOGIN,
        element: <Auth.LoginPage />,
      },
    ],
  },

  // ==========================================
  // Main App Routes (Protected)
  // ==========================================
  {
    path: ROUTES.APP,
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // Redirect /app to /app/dashboard
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard.DashboardPage />,
      },
      {
        path: 'projects',
        element: <Projects.ProjectListPage />,
      },
      {
        path: 'projects/new',
        element: <Projects.ProjectCreatePage />,
      },
    ],
  },

  // ==========================================
  // Project Workspace Routes (Protected)
  // ==========================================
  {
    path: '/app/projects/:projectId',
    element: (
      <ProtectedRoute>
        <ProjectLayout />
      </ProtectedRoute>
    ),
    children: [
      // Redirect to overview by default
      {
        index: true,
        element: <Navigate to="overview" replace />,
      },
      {
        path: 'overview',
        element: <ProjectOverviewPage />,
      },

      // Screening (Tool 1)
      // ScreeningRouter handles routing based on screening status
      {
        path: 'screening',
        element: <ScreeningRouter />,
      },
      {
        path: 'screening/summary',
        element: <ScreeningSummaryPage />,
      },

      // Assessment (Tool 2)
      {
        path: 'assessment',
        element: <AssessmentGatewayPage />,
      },
      {
        path: 'assessment/metadata',
        element: <AssessmentMetadataPage />,
      },
      {
        path: 'assessment/methods',
        element: <AssessmentMethodsPage />,
      },
      {
        path: 'assessment/scoring',
        element: <AssessmentScoringPage />,
      },
      {
        path: 'assessment/review',
        element: <AssessmentReviewPage />,
      },

      // SEMP (Tools 3 & 4)
      {
        path: 'semp',
        element: <SempOverviewPage />,
      },
      {
        path: 'semp/activities',
        element: <ManagementActivitiesPage />,
      },
      {
        path: 'semp/mitigation',
        element: <MitigationPlanPage />,
      },

      // Monitoring (Tool 5)
      {
        path: 'monitoring',
        element: <MonitoringOverviewPage />,
      },
      {
        path: 'monitoring/data-entry',
        element: <MonitoringDataEntryPage />,
      },

      // Files & Annex
      {
        path: 'files',
        element: <ProjectFilesPage />,
      },
      {
        path: 'annex',
        element: <AnnexOverviewPage />,
      },
    ],
  },

  // ==========================================
  // Catch-all & Redirects
  // ==========================================

  // Root redirect to login
  {
    path: '/',
    element: <Navigate to={ROUTES.LOGIN} replace />,
  },

  // 404 Page
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export default router
