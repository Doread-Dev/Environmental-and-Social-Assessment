import { Navigate, Outlet, useLocation, useOutletContext, useParams } from 'react-router-dom'
import { useWorkspace } from '@/hooks'
import { getRedirectStep } from '@/utils/workflowSteps'
import { ROUTES, getProjectRoute } from './routes.config'

const STEP_ROUTES = {
  screening: ROUTES.SCREENING,
  assessment: ROUTES.ASSESSMENT,
  semp: ROUTES.SEMP,
  monitoring: ROUTES.MONITORING,
}

/**
 * WorkflowRouteGuard
 * Keeps a tool's routes closed while the backend workflow has the step `locked`
 * (Screening approved → Assessment → SEMP → Monitoring) and sends the user to the open step
 * before it. Reads the shared workspace query, so it adds no request.
 *
 * @param {Object} props
 * @param {'assessment'|'semp'|'monitoring'} props.step
 */
function WorkflowRouteGuard({ step }) {
  const location = useLocation()
  const { projectId } = useParams()
  const outletContext = useOutletContext()
  const { workflow, isLoading } = useWorkspace(projectId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading {step} access...</p>
        </div>
      </div>
    )
  }

  const redirectStep = getRedirectStep(workflow, step)
  if (redirectStep) {
    return (
      <Navigate
        to={getProjectRoute(projectId, STEP_ROUTES[redirectStep])}
        replace
        state={{ from: location }}
      />
    )
  }

  return <Outlet context={outletContext} />
}

export default WorkflowRouteGuard
