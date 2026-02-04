import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from './routes.config'
import ProtectedRoute from './ProtectedRoute'

// Layouts
import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import ProjectLayout from '@/components/layout/ProjectLayout'
import SempFullWidthLayout from '@/components/layout/SempFullWidthLayout'

// Import actual page components
import * as Auth from '@/pages/auth'
import * as Dashboard from '@/pages/dashboard'
import * as Projects from '@/pages/projects'

// Project Workspace Pages
import { ProjectOverviewPage } from '@/pages/project-workspace/overview'
import ScreeningRouter from '@/pages/project-workspace/screening/ScreeningRouter'
import { ScreeningSummaryPage } from '@/pages/project-workspace/screening'
import {
  AssessmentRouter,
  AssessmentGatewayPage,
  AssessmentMetadataPage,
  AssessmentMethodsPage,
  AssessmentScoringPage,
  AssessmentReviewPage
} from '@/pages/project-workspace/assessment'

import {
  SempOverviewPage,
  ManagementActivitiesPage,
  MitigationPlanPage
} from '@/pages/project-workspace/semp'

import {
  MonitoringOverviewPage,
  MonitoringDataEntryPage
} from '@/pages/project-workspace/monitoring'

import {
  ProjectFilesPage,
  AnnexOverviewPage
} from '@/pages/project-workspace/annex'

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
        element: <AssessmentRouter />,
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

      // SEMP (Overview remains in Project Layout)
      {
        path: 'semp',
        element: <SempOverviewPage />,
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
  // SEMP Full Width Tools (Protected)
  // ==========================================
  {
    path: '/app/projects/:projectId/semp',
    element: (
      <ProtectedRoute>
        <SempFullWidthLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'activities',
        element: <ManagementActivitiesPage />,
      },
      {
        path: 'mitigation',
        element: <MitigationPlanPage />,
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
