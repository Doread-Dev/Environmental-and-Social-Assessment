// A small client for the real API, used by the specs to build the state a flow starts from and to
// check what the server stored (status, status_history, audit entries). Never touches MongoDB.
import crypto from 'node:crypto'
import { ADMIN, API_URL, JWT_SECRET, USER_PASSWORD } from './env.js'

export class ApiError extends Error {
  constructor(status, body, label) {
    super(`${label} → ${status}: ${body?.error ?? JSON.stringify(body)}`)
    this.status = status
    this.body = body
  }
}

export class Api {
  constructor(token, user = null) {
    this.token = token
    this.user = user
  }

  static async login(email, password) {
    const { status, body } = await new Api(null).raw('POST', '/auth/login', { email, password })
    if (status !== 200) throw new ApiError(status, body, `login ${email}`)
    return new Api(body.data.token, body.data.user)
  }

  /** Any request; never throws on an HTTP error. `body` may be a FormData. */
  async raw(method, path, body) {
    const headers = {}
    if (this.token) headers.Authorization = `Bearer ${this.token}`
    let payload
    if (body instanceof FormData) payload = body
    else if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      payload = JSON.stringify(body)
    }
    const res = await fetch(`${API_URL}${path}`, { method, headers, body: payload })
    const type = res.headers.get('content-type') ?? ''
    const parsed = type.includes('application/json') ? await res.json() : await res.arrayBuffer()
    return { status: res.status, body: parsed, headers: res.headers }
  }

  /** A request that must succeed; returns `data` (or the whole body with `full`). */
  async call(method, path, body, { full = false } = {}) {
    const { status, body: parsed } = await this.raw(method, path, body)
    if (status < 200 || status >= 300 || parsed?.success === false) {
      throw new ApiError(status, parsed, `${method} ${path}`)
    }
    return full ? parsed : parsed.data
  }

  get(path) {
    return this.call('GET', path)
  }
}

let counter = 0
/** Unique, readable suffix for names, titles and emails within one run. */
export function uniq(prefix = '') {
  counter += 1
  return `${prefix}${Date.now().toString(36)}${counter}`
}

export async function adminApi() {
  return Api.login(ADMIN.email, ADMIN.password)
}

/**
 * Creates a user through the admin API (POST /users → temporary password), then signs in as them
 * and replaces the temporary password with USER_PASSWORD, as a new user does at first sign-in.
 * Returns { user, email, password, api }.
 */
export async function createUser(admin, role, { name } = {}) {
  const id = uniq()
  const email = `e2e.${role}.${id}@example.com`.toLowerCase()
  const created = await admin.call('POST', '/users', {
    name: name ?? `E2E ${role.replaceAll('_', ' ')} ${id}`,
    email,
    role,
  })
  const temporary = created.temporary_password
  const first = await Api.login(email, temporary)
  await first.call('PUT', '/auth/password', {
    current_password: temporary,
    new_password: USER_PASSWORD,
  })
  const api = await Api.login(email, USER_PASSWORD)
  return { user: api.user, email, password: USER_PASSWORD, api }
}

/** Signed-in users for the given roles, each with its own rate-limit budget (per user id). */
export async function createTeam(admin, roles) {
  const team = {}
  for (const role of roles) team[role] = await createUser(admin, role)
  return team
}

export async function createProject(api, overrides = {}) {
  return api.call('POST', '/projects', {
    title: uniq('E2E project '),
    location: 'Aleppo',
    start_date: '2026-01-15',
    end_date: '2027-06-30',
    ...overrides,
  })
}

export async function getScreening(api, projectId) {
  return api.get(`/screenings/project/${projectId}`)
}

export async function getAssessment(api, projectId) {
  return api.get(`/assessments/project/${projectId}`)
}

/** The table version a client that just loaded the Tools 3/4/5 table would send (D62). */
export async function tableVersion(api, path) {
  const body = await api.call('GET', path, undefined, { full: true })
  return body.version
}

export async function auditEntries(admin, query = '') {
  return admin.call('GET', `/audit-logs?limit=100${query ? `&${query}` : ''}`)
}

// ---- Project states built through the API (the same requests the app sends) -----------------

export async function screeningDraft(editor, projectId, overrides = {}) {
  return editor.call('POST', '/screenings', {
    project: projectId,
    category_code: 'B',
    category_reason: 'Site-specific, reversible impacts.',
    potential_negative: 'Dust and noise during works.',
    potential_positive: 'Safe drinking water.',
    screening_date: '2026-01-20',
    ...overrides,
  })
}

export async function approvedScreening(editor, specialist, projectId, overrides = {}) {
  const screening = await screeningDraft(editor, projectId, overrides)
  await editor.call('PATCH', `/screenings/${screening._id}/submit`, {
    version: screening.updatedAt,
  })
  return specialist.call('PATCH', `/screenings/${screening._id}/approve`, {
    recommendations: 'Proceed to Tool 2.',
  })
}

export const ASSESSMENT_FIELDS = {
  project_activity: 'Water network rehabilitation',
  description: 'Trenches, new pipes, house connections.',
  environmental_setting: 'Dense residential area.',
  legal_requirements: 'Municipal excavation permit.',
}

export async function assessmentDraft(editor, projectId, overrides = {}) {
  return editor.call('POST', '/assessments', {
    project: projectId,
    ...ASSESSMENT_FIELDS,
    ...overrides,
  })
}

export async function approvedAssessment(editor, specialist, projectId, overrides = {}) {
  const assessment = await assessmentDraft(editor, projectId, overrides)
  await editor.call('PATCH', `/assessments/${assessment._id}/submit`, {
    version: assessment.updatedAt,
  })
  return specialist.call('PATCH', `/assessments/${assessment._id}/approve`, {
    recommendations: 'Prepare the SEMP.',
  })
}

export async function saveManagement(editor, projectId, rows) {
  return editor.call(
    'PUT',
    `/projects/${projectId}/management`,
    { version: await tableVersion(editor, `/management/project/${projectId}`), rows },
    { full: true }
  )
}

export async function saveMitigation(editor, projectId, rows) {
  return editor.call(
    'PUT',
    `/projects/${projectId}/mitigation`,
    { version: await tableVersion(editor, `/mitigation/project/${projectId}`), rows },
    { full: true }
  )
}

export const MANAGEMENT_ROW = {
  activity_description: 'Trench excavation',
  potential_impact: 'Dust and noise',
  recommended_actions: ['Water spraying'],
  monitoring_requirements: 'Daily log',
  responsible_text: 'Contractor',
}

export const MITIGATION_ROW = {
  output_description: 'Rehabilitated network',
  potential_impact_and_significance: 'Dust – medium',
  mitigation_and_enhancement_measures: 'Dust suppression',
  monitoring: 'Weekly checklist',
  schedule: 'During works',
  responsible_text: 'Contractor',
}

/**
 * Builds a project up to a step through the API: 'project' (nothing else), 'screening' (approved),
 * 'assessment' (approved), 'semp' (Tools 3 and 4 complete, so monitoring is open).
 */
export async function projectAt(step, editor, specialist, overrides = {}) {
  const project = await createProject(editor, overrides.project)
  if (['screening', 'assessment', 'semp'].includes(step)) {
    await approvedScreening(editor, specialist, project._id, overrides.screening)
  }
  if (['assessment', 'semp'].includes(step)) {
    await approvedAssessment(editor, specialist, project._id, overrides.assessment)
  }
  if (step === 'semp') {
    await saveManagement(editor, project._id, [overrides.management ?? MANAGEMENT_ROW])
    await saveMitigation(editor, project._id, [overrides.mitigation ?? MITIGATION_ROW])
  }
  return project
}

/** A valid HS256 token for `userId` that expired a minute ago (session-expiry flow, D73 2). */
export function expiredToken(userId, role) {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const head = b64({ alg: 'HS256', typ: 'JWT' })
  const body = b64({ sub: userId, role, iat: now - 3600, exp: now - 60 })
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url')
  return `${head}.${body}.${sig}`
}
