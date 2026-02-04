import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useAssessment, useScreening, useSemp } from '@/hooks'

/**
 * MonitoringRouteGuard
 * Guards Monitoring routes until Assessment is approved.
 */
function MonitoringRouteGuard() {
  const location = useLocation()
  const { projectId } = useParams()
  const { assessment, isLoading: isAssessmentLoading } = useAssessment(projectId)
  const { screening, isLoading: isScreeningLoading } = useScreening(projectId)
  const { getSempStatus, isLoading: isSempLoading } = useSemp(projectId)

  if (isAssessmentLoading || isScreeningLoading || isSempLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">
            Loading monitoring access...
          </p>
        </div>
      </div>
    )
  }

  if (screening?.status !== 'approved') {
    return (
      <Navigate
        to={`/app/projects/${projectId}/screening`}
        replace
        state={{ from: location }}
      />
    )
  }

  if (assessment?.status !== 'approved') {
    return (
      <Navigate
        to={`/app/projects/${projectId}/assessment`}
        replace
        state={{ from: location }}
      />
    )
  }

  if (getSempStatus() !== 'completed') {
    return (
      <Navigate
        to={`/app/projects/${projectId}/semp`}
        replace
        state={{ from: location }}
      />
    )
  }

  return <Outlet />
}

export default MonitoringRouteGuard
