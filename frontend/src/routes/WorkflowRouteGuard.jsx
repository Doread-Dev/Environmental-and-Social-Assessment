import { Navigate, Outlet, useLocation, useOutletContext, useParams } from 'react-router-dom'
import { useWorkspace } from '@/hooks'
import { getRedirectStep } from '@/utils/workflowSteps'
import { ROUTES, getProjectRoute } from './routes.config'
import { LoadingState } from '@/components/ui'

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
    return <LoadingState message="Loading {step} access..." />
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
