import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom'
import { useWorkspace } from '@/hooks'
import { getRedirectStep } from '@/utils/workflowSteps'
import { ROUTES, getProjectRoute } from './routes.config'
import { Button, ErrorState, LoadingState } from '@/components/ui'

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
  const navigate = useNavigate()
  const { projectId } = useParams()
  const outletContext = useOutletContext()
  const { workflow, isLoading, error, refetch } = useWorkspace(projectId)

  // The project could not be loaded (unknown or deleted id, server error): say so here. Rendering
  // the pages below would mount the same failed query again, which refetches it, and the guard and
  // the page would take turns for ever (a request loop up to the rate limit, found in phase 10a).
  if (error && !workflow) {
    return (
      <ErrorState
        variant="screen"
        title="Failed to Load Project"
        message={error}
        onRetry={refetch}
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.PROJECTS)}>
            Back to Projects
          </Button>
        }
      />
    )
  }

  if (isLoading) {
    return <LoadingState message="Loading project..." />
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
