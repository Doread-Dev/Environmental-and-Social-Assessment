import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from './routes.config'
import ProtectedRoute from './ProtectedRoute'
import WorkflowRouteGuard from './WorkflowRouteGuard'
import SettingsRouteGuard from './SettingsRouteGuard'
import PermissionRouteGuard from './PermissionRouteGuard'

// Layouts - Keep these eager loaded as they're always needed
import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import ProjectLayout from '@/components/layout/ProjectLayout'
import SempFullWidthLayout from '@/components/layout/SempFullWidthLayout'
import { LoadingState } from '@/components/ui'
import NotFoundPage from '@/pages/NotFoundPage'

// Lazy wrapper helper
const lazyLoad = (importFn) => {
  const LazyComponent = lazy(importFn)
  return (
    <Suspense fallback={<LoadingState />}>
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

// Project documents (D64 d)
const ProjectDocumentsPage = lazy(
  () => import('@/pages/project-workspace/documents/ProjectDocumentsPage')
)

// Reference library (D64 b)
const LibraryPage = lazy(() => import('@/pages/library/LibraryPage'))

// Settings Pages
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const ActivityLogPage = lazy(() => import('@/pages/settings/ActivityLogPage'))

// Profile Page (own password, D23)
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))

/**
 * Application Router Configuration
 * All pages are lazy loaded for optimal performance.
 *
 * A route with `handle: { place }` is that place's page (backend config/places.js, D64): the layout
 * header shows its Guidance button (components/library/GuidanceButton). A new tool's page adds its
 * place key here.
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
      {
        // Forced password change (D22): signed in only, checked by the page itself
        path: ROUTES.CHANGE_PASSWORD,
        element: lazyLoad(() => import('@/pages/auth/ChangePasswordPage')),
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
          <Suspense fallback={<LoadingState />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'projects',
        element: (
          <Suspense fallback={<LoadingState />}>
            <ProjectListPage />
          </Suspense>
        ),
      },
      {
        path: 'projects/new',
        element: (
          <Suspense fallback={<LoadingState />}>
            <ProjectCreatePage />
          </Suspense>
        ),
      },
      {
        path: 'library',
        element: (
          <Suspense fallback={<LoadingState />}>
            <LibraryPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<LoadingState />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: <SettingsRouteGuard />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingState />}>
                <SettingsPage />
              </Suspense>
            ),
          },
          {
            // Critical-actions log (D65): admin only
            path: 'activity-log',
            element: (
              <PermissionRouteGuard permission="read_audit_log" redirectTo={ROUTES.SETTINGS} />
            ),
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<LoadingState />}>
                    <ActivityLogPage />
                  </Suspense>
                ),
              },
            ],
          },
        ],
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
          <Suspense fallback={<LoadingState />}>
            <ProjectOverviewPage />
          </Suspense>
        ),
      },

      // Screening (Tool 1)
      {
        path: 'screening',
        handle: { place: 'screening' },
        element: (
          <Suspense fallback={<LoadingState />}>
            <ScreeningRouter />
          </Suspense>
        ),
      },
      {
        path: 'screening/summary',
        handle: { place: 'screening' },
        element: (
          <Suspense fallback={<LoadingState />}>
            <ScreeningSummaryPage />
          </Suspense>
        ),
      },

      // Assessment (Tool 2)
      {
        path: 'assessment',
        handle: { place: 'assessment' },
        element: <WorkflowRouteGuard step="assessment" />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingState />}>
                <AssessmentRouter />
              </Suspense>
            ),
          },
          {
            path: 'metadata',
            element: (
              <Suspense fallback={<LoadingState />}>
                <AssessmentMetadataPage />
              </Suspense>
            ),
          },
          {
            path: 'methods',
            element: (
              <Suspense fallback={<LoadingState />}>
                <AssessmentMethodsPage />
              </Suspense>
            ),
          },
          {
            path: 'scoring',
            element: (
              <Suspense fallback={<LoadingState />}>
                <AssessmentScoringPage />
              </Suspense>
            ),
          },
          {
            path: 'review',
            element: (
              <Suspense fallback={<LoadingState />}>
                <AssessmentReviewPage />
              </Suspense>
            ),
          },
        ],
      },

      // SEMP (Overview remains in Project Layout)
      {
        path: 'semp',
        element: <WorkflowRouteGuard step="semp" />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingState />}>
                <SempOverviewPage />
              </Suspense>
            ),
          },
        ],
      },

      // Monitoring (Tool 5)
      {
        path: 'monitoring',
        handle: { place: 'monitoring' },
        element: <WorkflowRouteGuard step="monitoring" />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingState />}>
                <MonitoringOverviewPage />
              </Suspense>
            ),
          },
          {
            path: 'data-entry',
            element: (
              <Suspense fallback={<LoadingState />}>
                <MonitoringDataEntryPage />
              </Suspense>
            ),
          },
        ],
      },

      // Project documents (D64 d)
      {
        path: 'documents',
        element: (
          <Suspense fallback={<LoadingState />}>
            <ProjectDocumentsPage />
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
        <WorkflowRouteGuard step="semp" />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <SempFullWidthLayout />,
        children: [
          {
            path: 'activities',
            handle: { place: 'management' },
            element: (
              <Suspense fallback={<LoadingState />}>
                <ManagementActivitiesPage />
              </Suspense>
            ),
          },
          {
            path: 'mitigation',
            handle: { place: 'mitigation' },
            element: (
              <Suspense fallback={<LoadingState />}>
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
