# Services and API Client

This document describes the frontend services layer in `frontend/src/services`: the shared API client (Axios instance), auth service, and domain services for projects, screenings, assessments, SEMP (management/mitigation), monitoring, lookups, and users. All backend calls go through the API client; domain services wrap HTTP calls and expose typed methods.

---

## Overview

The services layer owns all HTTP communication with the backend. The core **API client** (`api.js`) is a configured Axios instance used by every service. **authService** handles login, registration, and token/user storage. **Domain services** (project, screening, assessment, semp, monitoring, lookup, user) each map to backend resource paths and expose async methods that return `response.data.data`. Components and hooks import from `services/index.js` or individual service modules.

---

## API Client

The API client is the single Axios instance used for all backend requests. It provides a base URL, default headers, timeout, request/response interceptors for JWT and 401 handling, optional silent-404 behavior, and error-extraction utilities.

**Module:** `frontend/src/services/api.js`  
**Export:** default `api` (Axios instance); named `extractErrorMessage`, `isNetworkError`, `isAuthError`.

### Configuration

| Setting | Source | Default / Behavior |
|--------|--------|--------------------|
| `baseURL` | `import.meta.env.VITE_API_URL` | Dev: `VITE_API_URL \|\| 'http://localhost:3000/api/v1'`; production: `VITE_API_URL` only (no fallback). |
| `headers['Content-Type']` | Fixed | `'application/json'` |
| `timeout` | `import.meta.env.VITE_API_TIMEOUT` | `parseInt(VITE_API_TIMEOUT, 10) \|\| 30000` (ms) |

### Request Interceptor

- Reads `localStorage.getItem('token')` and, if present, sets `config.headers.Authorization = 'Bearer ' + token`.
- If `config.silent404 === true`, the config is added to an internal `WeakSet` so the response interceptor and console-error override can treat 404 as expected.

### Response Interceptor

- **Success:** returns `response` unchanged.
- **401:** removes `token` and `user` from localStorage; if current path does not include `/login`, stores `redirectAfterLogin` in sessionStorage (current path + search) and sets `window.location.href = '/login'`.
- **404 with `config.silent404`:** sets `error.isExpected404 = true` and rejects with the error (caller still receives it); console.error is suppressed for these (see below).
- **All other errors:** rejects with the error.

### Silent 404 Behavior

Some endpoints return 404 when a resource does not exist yet (e.g. screening/assessment by project for a new project). To avoid console noise, callers can pass `{ silent404: true, validateStatus: (s) => s === 200 \|\| s === 404 }` on the request. The client overrides `console.error` to skip logging when the message corresponds to 404 on paths: `/screenings/project/`, `/assessments/project/`, `/management/project/`, `/mitigation/project/`, `/monitoring/project/`, or when `isExpected404` is set. The Network tab still shows 404.

### Error Helpers

- **`extractErrorMessage(error)`**  
  Returns a string. Precedence: 403 → fixed message `"You don't have permission to perform this action."`; then `error.response?.data?.message`; then `error.response?.data?.error`; then for `error.code === 'ECONNABORTED'` → timeout message; for `error.code === 'ERR_NETWORK'` → network message; else `error.message` or a generic fallback.

- **`isNetworkError(error)`**  
  Returns `true` when `error.code === 'ERR_NETWORK'` or `'ECONNABORTED'` or `!error.response`.

- **`isAuthError(error)`**  
  Returns `true` when `error.response?.status` is 401 or 403.

### Constraints

- All services must use this `api` instance so interceptors apply.
- Token is read from `localStorage` only; no other auth store is used by the client.
- 401 triggers a full navigation to `/login`; SPA router is not used for that redirect.
- Silent 404 applies only when `silent404: true` and the path matches the known project-scoped endpoints.

---

## Auth Service

The auth service handles login, registration, logout, and persistence of token and user in localStorage. It does not perform token refresh; the backend issues a single JWT and the client checks expiry locally for UI state only.

**Module:** `frontend/src/services/authService.js`  
**Export:** `authService` (object); default export same.

### Storage Keys

- `TOKEN_KEY`: `'token'` (localStorage).
- `USER_KEY`: `'user'` (localStorage, JSON stringified).

### Methods

| Method | Signature | Behavior |
|--------|-----------|----------|
| `login` | `(email: string, password: string) => Promise<{ user, token }>` | POST `/auth/login` with `{ email, password }`; expects `response.data.data` with `user` and `token`; calls `setAuthData(user, token)`; returns `{ user, token }`. |
| `register` | `(userData: RegisterPayload) => Promise<{ user, token }>` | POST `/auth/register` with `userData`. Expects `userData`: `name`, `email`, `password`, `role`, `job_title` (job title ID). Returns `response.data.data`. Does not persist; caller may call `setAuthData` if backend returns token. |
| `logout` | `() => void` | Removes `token` and `user` from localStorage. |
| `setAuthData` | `(user: object, token: string) => void` | `localStorage.setItem(TOKEN_KEY, token)` and `localStorage.setItem(USER_KEY, JSON.stringify(user))`. |
| `getToken` | `() => string \| null` | Returns `localStorage.getItem(TOKEN_KEY)`. |
| `getUser` | `() => object \| null` | Parses `localStorage.getItem(USER_KEY)`; returns `null` if missing or invalid JSON. |
| `isAuthenticated` | `() => boolean` | Returns `!!getToken()`. |
| `isTokenValid` | `() => boolean` | If no token, returns false. Otherwise decodes JWT payload (base64 middle segment); if `payload.exp` exists and `exp * 1000 < Date.now()`, calls `logout()` and returns false; on decode error returns false. |

### Constraints

- Auth state is only in localStorage under `token` and `user`; no in-memory store in the service.
- Registration is restricted by backend to appropriate role (e.g. environmental_specialist); frontend does not enforce roles for calling `register`.
- Token validity is client-side only; server still validates on each request.

---

## Project Service

Project service performs CRUD for projects. All methods use the shared API client and return `response.data.data`.

**Module:** `frontend/src/services/projectService.js`  
**Export:** `projectService`.

| Method | HTTP | Path | Request shape | Response shape |
|--------|------|------|---------------|----------------|
| `getAll()` | GET | `/projects` | — | `Array<Project>` |
| `getById(id)` | GET | `/projects/:id` | — | `Project` |
| `create(data)` | POST | `/projects` | `ProjectCreate` | `Project` |
| `update(id, data)` | PUT | `/projects/:id` | `ProjectUpdate` | `Project` |
| `delete(id)` | DELETE | `/projects/:id` | — | void (no body) |

---

## Screening Service

Screening service handles screening CRUD and workflow (approve/reject). `getByProject` treats 404 as “no screening yet” and returns `null`; it uses `silent404: true` and `validateStatus` so 404 is not thrown.

**Module:** `frontend/src/services/screeningService.js`  
**Export:** `screeningService`.

| Method | HTTP | Path | Request shape | Response shape |
|--------|------|------|---------------|----------------|
| `getAll()` | GET | `/screenings` | — | `Array<Screening>` |
| `getByProject(projectId)` | GET | `/screenings/project/:projectId` | — | `Screening \| null` (404 → null) |
| `create(data)` | POST | `/screenings` | screening payload | `Screening` |
| `update(id, data)` | PUT | `/screenings/:id` | partial screening | `Screening` |
| `approve(id, recommendations)` | PATCH | `/screenings/:id/approve` | `{ recommendations?: string \| null }` | `Screening` |
| `reject(id, rejectReason)` | PATCH | `/screenings/:id/reject` | `{ reject_reason?: string \| null }` | `Screening` |

---

## Assessment Service

Assessment service handles assessment CRUD, methods, consultations, scores, calculate, and approve/reject. `getByProject` uses silent 404 and returns `null` when no assessment exists for the project.

**Module:** `frontend/src/services/assessmentService.js`  
**Export:** `assessmentService`.

| Method | HTTP | Path | Request shape | Response shape |
|--------|------|------|---------------|----------------|
| `getAll()` | GET | `/assessments` | — | `Array<Assessment>` |
| `getById(id)` | GET | `/assessments/:id` | — | `Assessment` |
| `getByProject(projectId)` | GET | `/assessments/project/:projectId` | — | `Assessment \| null` (404 → null) |
| `create(data)` | POST | `/assessments` | assessment payload | `Assessment` |
| `update(id, data)` | PUT | `/assessments/:id` | partial assessment | `Assessment` |
| `addMethod(assessmentId, method)` | POST | `/assessments/:id/methods` | `{ method_type, details }` | method object |
| `setMethods(assessmentId, methods)` | PUT | `/assessments/:id/methods` | `Array` | `Array` |
| `getMethods(assessmentId)` | GET | `/assessments/:id/methods` | — | `Array` |
| `addConsultation(assessmentId, consultation)` | POST | `/assessments/:id/consultations` | `{ type, participants, notes }` | consultation object |
| `setConsultations(assessmentId, consultations)` | PUT | `/assessments/:id/consultations` | `Array` | `Array` |
| `getConsultations(assessmentId)` | GET | `/assessments/:id/consultations` | — | `Array` |
| `addScores(assessmentId, scores)` | POST | `/assessments/:id/scores` | scores array | `Array` |
| `getScores(assessmentId)` | GET | `/assessments/:id/scores` | — | `Array` |
| `calculate(assessmentId)` | PATCH | `/assessments/:id/calculate` | — | `Assessment` (or calculated result) |
| `approve(assessmentId, recommendations)` | PATCH | `/assessments/:id/approve` | `{ recommendations?: string \| null }` | `Assessment` |
| `reject(assessmentId, rejectReason)` | PATCH | `/assessments/:id/reject` | `{ reject_reason?: string \| null }` | `Assessment` |

---

## SEMP Service

SEMP service covers Management Activities (Tool 3) and Mitigation Plans (Tool 4). Project-scoped GETs use silent 404 and return an empty array when the backend returns 404.

**Module:** `frontend/src/services/sempService.js`  
**Export:** `sempService`.

### Management Activities

| Method | HTTP | Path | Request shape | Response shape |
|--------|------|------|---------------|----------------|
| `getManagementActivities(projectId)` | GET | `/management/project/:projectId` | — | `Array` (404 → `[]`) |
| `createManagementActivity(data)` | POST | `/management` | `{ project, activity_description, serial_number?, ... }` | created activity |
| `updateManagementActivity(id, data)` | PUT | `/management/:id` | partial fields | updated activity |
| `deleteManagementActivity(id)` | DELETE | `/management/:id` | — | void |

### Mitigation Plans

| Method | HTTP | Path | Request shape | Response shape |
|--------|------|------|---------------|----------------|
| `getMitigationPlans(projectId)` | GET | `/mitigation/project/:projectId` | — | `Array` (404 → `[]`) |
| `createMitigationPlan(data)` | POST | `/mitigation` | `{ project, output_description, serial_number?, ... }` | created plan |
| `updateMitigationPlan(id, data)` | PUT | `/mitigation/:id` | partial fields | updated plan |
| `deleteMitigationPlan(id)` | DELETE | `/mitigation/:id` | — | void |

---

## Monitoring Service

Monitoring service handles monitoring records and quarterly score updates. `getByProject` uses silent 404 and returns an empty array when no records exist.

**Module:** `frontend/src/services/monitoringService.js`  
**Export:** `monitoringService`.

| Method | HTTP | Path | Request shape | Response shape |
|--------|------|------|---------------|----------------|
| `getByProject(projectId)` | GET | `/monitoring/project/:projectId` | — | `Array` (404 → `[]`) |
| `create(data)` | POST | `/monitoring` | `{ project, indicator, scores?, total?, ... }` | created record |
| `update(id, data)` | PUT | `/monitoring/:id` | partial fields | updated record |
| `updateQuarter(id, quarter, value)` | PATCH | `/monitoring/:id/quarter/:quarter` | `{ value }` | updated record |

`quarter` is one of: `baseline`, `Q1`, `Q2`, `Q3`, `Q4`.

---

## Lookup Service

Lookup service fetches reference data (impact categories, impact questions, indicators, job titles). All methods return `response.data.data`. No silent 404; missing data results in normal errors.

**Module:** `frontend/src/services/lookupService.js`  
**Export:** `lookupService`.

| Method | HTTP | Path | Response shape |
|--------|------|------|----------------|
| `getImpactCategories()` | GET | `/lookups/impact-categories` | `Array` |
| `getImpactQuestions()` | GET | `/lookups/impact-questions` | `Array` (with category populated) |
| `getIndicators()` | GET | `/lookups/indicators` | `Array` (with category populated) |
| `getJobTitles()` | GET | `/lookups/job-titles` | `Array` |
| `getAllLookups()` | — | (parallel internal calls) | `{ impactCategories, impactQuestions, indicators, jobTitles }` |

`getAllLookups()` runs the four GET methods in parallel via `Promise.all` and returns one object with all four arrays.

---

## User Service

User service provides user list and creation. User creation delegates to the auth register endpoint; list is from `/users`. Backend enforces permissions (e.g. viewers cannot list users).

**Module:** `frontend/src/services/userService.js`  
**Export:** `userService`.

| Method | HTTP | Path | Request shape | Response shape |
|--------|------|------|---------------|----------------|
| `getAll()` | GET | `/users` | — | `Array<User>` |
| `getActive()` | — | (uses `getAll`) | — | `Array<User>` (filtered by `user.is_active`) |
| `create(data)` | POST | `/auth/register` | `{ name, email, password, role }` | created user (from register response) |

---

## Service Index (Barrel)

**Module:** `frontend/src/services/index.js`

Re-exports:

- From `api`: `api`, `extractErrorMessage`, `isNetworkError`, `isAuthError`
- From `authService`: `authService`
- From `lookupService`: `lookupService`
- From `projectService`: `projectService`
- From `userService`: `userService`
- From `screeningService`: `screeningService`
- From `assessmentService`: `assessmentService`
- From `sempService`: `sempService`
- From `monitoringService`: `monitoringService`

Consumers should import from `@/services` or `../services` (or the barrel path) or from the specific file (e.g. `../services/api`). There are no default re-exports for the domain services from the barrel; use named imports.

---

## Key Invariants

- Every service uses the same `api` instance from `api.js`; no service creates its own Axios instance.
- Backend success responses are assumed to expose payload in `response.data.data`; services return that value (or void for deletes).
- Auth storage is only `localStorage` keys `token` and `user`; the API client reads only `token` for the Authorization header.
- Project-scoped “get by project” endpoints that may 404 for new projects (screenings, assessments, management, mitigation, monitoring) use `silent404: true` and map 404 to `null` or `[]` as documented; other endpoints do not use silent 404.
- No service performs token refresh; auth is login/register plus single JWT until expiry or logout.
- The frontend does not define backend API versioning; base path is set via `VITE_API_URL` (e.g. `/api/v1`).
