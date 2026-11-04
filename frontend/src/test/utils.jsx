/**
 * Test helpers: a fresh query cache per test and a fake API.
 *
 * Tests mock the axios instance (`@/services/api` default export) and keep the real services, so
 * they check the URLs that go out and can count requests:
 *
 *   vi.mock('@/services/api', async (importOriginal) => ({
 *     ...(await importOriginal()),
 *     default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
 *   }))
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@/services/queryClient'

// The app's cache settings (staleTime etc.), without retries
export function createTestQueryClient() {
  const queryClient = createQueryClient()
  const { queries } = queryClient.getDefaultOptions()
  queryClient.setDefaultOptions({
    queries: { ...queries, retry: false },
    mutations: { retry: false },
  })
  return queryClient
}

/**
 * Wrapper for renderHook/render with its own query cache
 * @returns {{ wrapper: Function, queryClient: QueryClient }}
 */
export function withQueryClient(queryClient = createTestQueryClient()) {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { wrapper, queryClient }
}

/** Axios-like success response */
export const ok = (data) => Promise.resolve({ data: { success: true, data } })

/** Axios-like error response */
export function fail(status, error = 'Request failed') {
  const err = new Error(error)
  err.response = { status, data: { success: false, error } }
  return Promise.reject(err)
}

/**
 * Answer GET requests by URL from a map ({ '/dashboard': data }); unknown URLs → 404
 * @param {Object} api - The mocked axios instance
 * @param {Object<string, any>} routes
 */
export function mockGet(api, routes) {
  api.get.mockImplementation((url) =>
    Object.hasOwn(routes, url) ? ok(routes[url]) : fail(404, `No mock for GET ${url}`)
  )
}

/**
 * Store a session like a login does (a JWT that is not expired + the user)
 * @param {Object} [options]
 * @param {Object} [options.user]
 * @param {number} [options.expiresIn] - Seconds from now (negative = expired)
 */
export function signIn({
  user = { _id: 'u1', name: 'Rana', role: 'project_manager' },
  expiresIn = 3600,
} = {}) {
  const payload = btoa(
    JSON.stringify({ id: user._id, exp: Math.floor(Date.now() / 1000) + expiresIn })
  )
  localStorage.setItem('token', `header.${payload}.signature`)
  localStorage.setItem('user', JSON.stringify(user))
}

/** URLs of the GET requests made so far */
export const getUrls = (api) => api.get.mock.calls.map(([url]) => url)

/**
 * A workspace response (GET /projects/:id/workspace) for a project at a given stage
 * @param {Object} [overrides] - steps / allowed_actions / project fields to change
 */
export function workspaceFixture({ steps = {}, allowed_actions = [], project = {} } = {}) {
  return {
    project: { _id: 'p1', title: 'Water network', location: 'Aleppo', ...project },
    workflow: {
      status: 'draft',
      current_step: 'screening',
      percent_complete: 0,
      next_action: {
        step: 'screening',
        tool: 1,
        route: 'SCREENING',
        label: 'Start Screening',
        description: 'Begin the environmental screening of this project.',
      },
      steps: {
        screening: { tool: 1, status: 'not_started' },
        assessment: { tool: 2, status: 'locked' },
        semp: {
          tools: [3, 4],
          status: 'locked',
          management_activities: { count: 0, described: 0, status: 'not_started' },
          mitigation_plans: { count: 0, described: 0, status: 'not_started' },
        },
        monitoring: { tool: 5, status: 'locked', records: 0, complete_records: 0 },
        ...steps,
      },
    },
    allowed_actions,
    screening: null,
    assessment: null,
    counts: { management_activities: 0, mitigation_plans: 0, monitoring_records: 0 },
  }
}

/**
 * GET /lookups with the places registry (D64 a) — a test copy of backend config/places.js, so
 * pages that group or label by place can be rendered.
 */
export function lookupsFixture() {
  const place = (key, label, group, locked = false) => ({
    key,
    label,
    group,
    scope: group === 'organization' ? 'organization' : 'project',
    locked,
  })
  return {
    impact_categories: [],
    impact_questions: [],
    indicators: [],
    job_titles: [],
    place_groups: [
      { key: 'project_workflow', label: 'Project workflow' },
      { key: 'project_support', label: 'Project support' },
      { key: 'organization', label: 'Organization' },
    ],
    places: [
      place('screening', 'Screening – Tool 1', 'project_workflow'),
      place('assessment', 'Assessment – Tool 2', 'project_workflow'),
      place('management', 'Management activities – Tool 3', 'project_workflow'),
      place('mitigation', 'Mitigation plan – Tool 4', 'project_workflow'),
      place('monitoring', 'Monitoring – Tool 5', 'project_workflow'),
      place('semp_plan', 'SEMP Plan', 'project_support', true),
      place('stakeholder_awareness', 'Stakeholder Awareness', 'project_support', true),
      place('ghg_emissions', 'GHG Emissions', 'organization', true),
      place('environmental_data', 'Environmental Data Collection', 'organization', true),
    ],
  }
}
