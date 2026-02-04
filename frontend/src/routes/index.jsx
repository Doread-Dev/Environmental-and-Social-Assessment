import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from './routes.config'
import ProtectedRoute from './ProtectedRoute'
import MonitoringRouteGuard from './MonitoringRouteGuard'
import SempRouteGuard from './SempRouteGuard'
import AssessmentRouteGuard from './AssessmentRouteGuard'

// Layouts - Keep these eager loaded as they're always needed
import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import ProjectLayout from '@/components/layout/ProjectLayout'
import SempFullWidthLayout from '@/components/layout/SempFullWidthLayout'

// Loading Fallback Component
const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-text-secondary dark:text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
)

// Lazy wrapper helper
const lazyLoad = (importFn) => {
  const LazyComponent = lazy(importFn)
  return (
    <Suspense fallback={<PageLoader />}>
      <LazyComponent />
    </Suspense>
  )
}

// ==========================================
// Lazy Loaded Pages
// ==========================================

// Dashboard Pages
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))

// Project Pages
const ProjectListPage = lazy(() => import('@/pages/projects/ProjectListPage'))
const ProjectCreatePage = lazy(() => import('@/pages/projects/ProjectCreatePage'))

// Project Workspace Pages
const ProjectOverviewPage = lazy(
  () => import('@/pages/project-workspace/overview/ProjectOverviewPage')
)
const ScreeningRouter = lazy(() => import('@/pages/project-workspace/screening/ScreeningRouter'))
const ScreeningSummaryPage = lazy(
  () => import('@/pages/project-workspace/screening/ScreeningSummaryPage')
)

// Assessment Pages
const AssessmentRouter = lazy(() => import('@/pages/project-workspace/assessment/AssessmentRouter'))
const AssessmentMetadataPage = lazy(
  () => import('@/pages/project-workspace/assessment/AssessmentMetadataPage')
)
const AssessmentMethodsPage = lazy(
  () => import('@/pages/project-workspace/assessment/AssessmentMethodsPage')
)
const AssessmentScoringPage = lazy(
  () => import('@/pages/project-workspace/assessment/AssessmentScoringPage')
)
const AssessmentReviewPage = lazy(
  () => import('@/pages/project-workspace/assessment/AssessmentReviewPage')
)

// SEMP Pages
const SempOverviewPage = lazy(() => import('@/pages/project-workspace/semp/SempOverviewPage'))
const ManagementActivitiesPage = lazy(
  () => import('@/pages/project-workspace/semp/ManagementActivitiesPage')
)
const MitigationPlanPage = lazy(() => import('@/pages/project-workspace/semp/MitigationPlanPage'))

// Monitoring Pages
const MonitoringOverviewPage = lazy(
  () => import('@/pages/project-workspace/monitoring/MonitoringOverviewPage')
)
const MonitoringDataEntryPage = lazy(
  () => import('@/pages/project-workspace/monitoring/MonitoringDataEntryPage')
)

// Files & Annex Pages
const ProjectFilesPage = lazy(() => import('@/pages/project-workspace/annex/ProjectFilesPage'))
const AnnexOverviewPage = lazy(() => import('@/pages/project-workspace/annex/AnnexOverviewPage'))

// Not Found Page (inline - small component)
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
 * All pages are lazy loaded for optimal performance
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
        element: lazyLoad(() => import('@/pages/auth/LoginPage')),
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
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'projects',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProjectListPage />
          </Suspense>
        ),
      },
      {
        path: 'projects/new',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProjectCreatePage />
          </Suspense>
        ),
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
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProjectOverviewPage />
          </Suspense>
        ),
      },

      // Screening (Tool 1)
      {
        path: 'screening',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ScreeningRouter />
          </Suspense>
        ),
      },
      {
        path: 'screening/summary',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ScreeningSummaryPage />
          </Suspense>
        ),
      },

      // Assessment (Tool 2)
      {
        path: 'assessment',
        element: <AssessmentRouteGuard />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <AssessmentRouter />
              </Suspense>
            ),
          },
          {
            path: 'metadata',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AssessmentMetadataPage />
              </Suspense>
            ),
          },
          {
            path: 'methods',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AssessmentMethodsPage />
              </Suspense>
            ),
          },
          {
            path: 'scoring',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AssessmentScoringPage />
              </Suspense>
            ),
          },
          {
            path: 'review',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AssessmentReviewPage />
              </Suspense>
            ),
          },
        ],
      },

      // SEMP (Overview remains in Project Layout)
      {
        path: 'semp',
        element: <SempRouteGuard />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <SempOverviewPage />
              </Suspense>
            ),
          },
        ],
      },

      // Monitoring (Tool 5)
      {
        path: 'monitoring',
        element: <MonitoringRouteGuard />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <MonitoringOverviewPage />
              </Suspense>
            ),
          },
          {
            path: 'data-entry',
            element: (
              <Suspense fallback={<PageLoader />}>
                <MonitoringDataEntryPage />
              </Suspense>
            ),
          },
        ],
      },

      // Files & Annex
      {
        path: 'files',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProjectFilesPage />
          </Suspense>
        ),
      },
      {
        path: 'annex',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AnnexOverviewPage />
          </Suspense>
        ),
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
        <SempRouteGuard />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <SempFullWidthLayout />,
        children: [
          {
            path: 'activities',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ManagementActivitiesPage />
              </Suspense>
            ),
          },
          {
            path: 'mitigation',
            element: (
              <Suspense fallback={<PageLoader />}>
                <MitigationPlanPage />
              </Suspense>
            ),
          },
        ],
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
