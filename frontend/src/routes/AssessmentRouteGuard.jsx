import { Navigate, Outlet, useLocation, useOutletContext, useParams } from 'react-router-dom'
import { useScreening } from '@/hooks'

/**
 * AssessmentRouteGuard
 * Guards Assessment routes until Screening is approved.
 */
function AssessmentRouteGuard() {
  const location = useLocation()
  const { projectId } = useParams()
  const outletContext = useOutletContext()
  const { screening, isLoading } = useScreening(projectId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">
            Loading assessment access...
          </p>
        </div>
      </div>
    )
  }

  if (screening?.status !== 'approved') {
    return (
      <Navigate to={`/app/projects/${projectId}/screening`} replace state={{ from: location }} />
    )
  }

  return <Outlet context={outletContext} />
}

export default AssessmentRouteGuard
