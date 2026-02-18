# State and Contexts

This document describes the frontend's React context providers and their state: AuthContext, LookupContext, and ThemeContext. It is the single source of truth for what each context owns, how it is consumed, and how providers are composed.

---

## Overview

The ESMS frontend uses three React contexts for global client state: **AuthContext** (user, token, permissions), **LookupContext** (reference data from the backend), and **ThemeContext** (light/dark/system theme). There is no Redux or other global store; route-level and component-level state live in components and hooks. All three providers are mounted in `main.jsx` in a fixed nesting order; consumers use the exported hooks `useAuth`, `useLookups`, and `useTheme`.

---

## Provider Tree and Order

Providers are composed in `frontend/src/main.jsx` in this order (outer to inner):

| Order | Provider      | Owns                                           | Depends On   |
|-------|---------------|-------------------------------------------------|--------------|
| 1     | AuthProvider  | user, token, isAuthenticated, permissions       | none         |
| 2     | LookupProvider| impact categories, questions, indicators, users | AuthProvider |
| 3     | ThemeProvider | theme, resolvedTheme, setTheme, toggleTheme     | none         |
| 4     | ToastProvider | toast notifications (UI only)                   | none         |

**Nesting (excerpt):**

```jsx
<AuthProvider>
  <LookupProvider>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </LookupProvider>
</AuthProvider>
```

LookupProvider calls `useAuth()` and only fetches when `isAuthenticated` is true; it clears its data when the user logs out. ThemeProvider and AuthProvider do not depend on each other. All context hooks throw if used outside their provider (see each section below).

**Invariants**

- AuthProvider must wrap LookupProvider so that LookupProvider can read `isAuthenticated` and `canListUsers`.
- ThemeProvider and ToastProvider can be reordered with respect to each other; they do not depend on auth or lookups.
- No context value is persisted to a custom backend; only AuthContext syncs with `authService` (localStorage), and ThemeContext uses `localStorage` under `THEME_STORAGE_KEY`.

---

## AuthContext

AuthContext holds the current user, JWT token, loading and error state, and permission helpers. It is the single source of truth for "who is logged in" and "what can this user do" on the client. It does not perform login itself; it delegates to `authService` and then updates its state from the service result.

### State Shape

The value exposed by `useAuth()` has this shape (all fields present; types are logical):

```ts
interface AuthContextValue {
  // State
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  clearError: () => void

  // Role checks
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasMinimumRole: (minimumRole: string) => boolean

  // Permission helpers (derived from user.role)
  canEdit: boolean
  canApprove: boolean
  canManageUsers: boolean
  canListUsers: boolean
  canDeleteProject: boolean
  canUpdateMonitoring: boolean

  // Constants
  USER_ROLES: Record<string, string>
  ROLE_LABELS: Record<string, string>
}

interface User {
  _id: string
  name: string
  email: string
  role: string   // one of USER_ROLES values
  job_title?: string
  is_active?: boolean
  // other fields from backend
}
```

`user` and `token` are synced with `authService.getUser()` and `authService.getToken()`; they are also written to localStorage by `authService` on login and cleared on logout.

### Role and Permission Model

**Roles (USER_ROLES):** `environmental_specialist`, `program_manager`, `project_manager`, `environmental_focal_point`, `viewer`.

**Role hierarchy (low to high):** viewer → environmental_focal_point → project_manager → program_manager → environmental_specialist. Used by `hasMinimumRole(minimumRole)`.

**Permission semantics:**

| Helper            | Meaning                                      | Roles that have it                                                                 |
|-------------------|----------------------------------------------|-------------------------------------------------------------------------------------|
| canEdit           | Can create/update screening, assessment, etc.| environmental_specialist, program_manager, project_manager, environmental_focal_point |
| canApprove        | Can approve/reject submissions               | environmental_specialist only                                                       |
| canManageUsers    | Can create/edit users                        | environmental_specialist only                                                       |
| canListUsers      | Can call GET /users                          | Any authenticated user                                                             |
| canDeleteProject  | Can DELETE /projects                         | environmental_specialist only                                                      |
| canUpdateMonitoring | Can update monitoring data                 | environmental_specialist, program_manager, project_manager, environmental_focal_point |

Backend enforces the same rules; the context is for UI only (hiding/disabled state and route guards).

### Lifecycle

1. **Mount:** AuthProvider reads `authService.getToken()` and `authService.getUser()`. If both exist and `authService.isTokenValid()` is true, it sets `token` and `user`; otherwise it calls `authService.logout()` and sets both to null. Then it sets `isLoading` to false.
2. **Login:** Component calls `login(email, password)`. AuthProvider calls `authService.login()`; on success it sets `user` and `token` from the response and returns `{ success: true }`; on failure it sets `error` and returns `{ success: false, error: string }`.
3. **Logout:** Component or app calls `logout()`. AuthProvider calls `authService.logout()` (clears localStorage) and sets `user`, `token`, and `error` to null.
4. **Token validity:** Checked only on mount via `authService.isTokenValid()` (JWT payload `exp`). No periodic refresh in the context; 401 from the API is handled by the API layer (e.g. redirect to login).

### Where AuthContext Is Used

- **LoginPage:** `login`, `isAuthenticated`, `isLoading`, `error`, `clearError`.
- **ProtectedRoute:** `isAuthenticated`, `isLoading`, `hasAnyRole(allowedRoles)`.
- **SettingsRouteGuard:** `user`, `isLoading`; allows access only when `user.role === USER_ROLES.ENVIRONMENTAL_SPECIALIST`.
- **Header, MainSidebar, ProjectSidebar, MobileMenu:** `user`, `logout`, and often `ROLE_LABELS`, `USER_ROLES` for display.
- **ApprovalSection, ScreeningInfoSection, ScreeningSummaryPage, AssessmentReviewPage:** `user`, `canApprove`, and sometimes `ROLE_LABELS`.
- **AssessmentMetadataPage:** `user`.
- **UsersManagementSection:** `useAuth`, `USER_ROLES`, `ROLE_LABELS`.
- **ProjectsManagementSection:** `canDeleteProject`.
- **MitigationPlanPage, ManagementActivitiesPage, MonitoringDataEntryPage:** `canEdit`.
- **LookupContext (internal):** `isAuthenticated`, `canListUsers` to gate and scope lookup fetching.
- **useAssessment hook:** `user`, `useLookups` for categories/questions.

### Constraints

- `useAuth()` must be used inside AuthProvider; otherwise it throws: `"useAuth must be used within an AuthProvider"`.
- AuthContext does not refresh the token; expiry is checked only on initial load. Session extension (if any) would be done elsewhere (e.g. API interceptor or backend refresh endpoint).
- Permission helpers are derived from `user?.role`; if `user` is null, all permission booleans are false and `canListUsers` is false because `isAuthenticated` is false.

---

## LookupContext

LookupContext holds reference data fetched from the backend (impact categories, impact questions, indicators, job titles, users) and exposes them with helper getters and derived structures. It fetches once when the user is authenticated and clears on logout. It is the single source for this reference data in the app.

### State Shape

The value exposed by `useLookups()` has this shape:

```ts
interface LookupContextValue {
  // Raw data (arrays from API or enhanced)
  impactCategories: ImpactCategory[]
  impactQuestions: ImpactQuestion[]
  indicators: Indicator[]
  jobTitles: JobTitle[]
  users: User[]
  activeUsers: User[]   // users filtered by is_active

  // Derived data (categories with nested questions/indicators)
  categoriesWithQuestions: CategoryWithQuestions[]
  categoriesWithIndicators: CategoryWithIndicators[]

  // State
  isLoading: boolean
  error: string | null
  isLoaded: boolean

  // Actions
  refetch: () => Promise<void>
  retry: () => void

  // Helpers
  getCategoryById: (idOrCode: string) => ImpactCategory | undefined
  getQuestionsByCategory: (categoryIdOrCode: string) => ImpactQuestion[]
  getIndicatorsByCategory: (categoryIdOrCode: string) => Indicator[]
  getJobTitleById: (id: string) => JobTitle | undefined
  getUserById: (id: string) => User | undefined
  getTotalQuestionCount: number
  getTotalIndicatorCount: number

  // Constants
  IMPACT_LEVELS: Record<string, string>
  IMPACT_LEVEL_CONFIG: Record<string, ImpactLevelConfigEntry>
}
```

Impact category entries may be enhanced with `CATEGORY_ICONS` from `@/utils/categoryIcons`. `categoriesWithQuestions` and `categoriesWithIndicators` are built from the raw arrays and keyed by category `_id` or `code`.

**IMPACT_LEVELS:** `negligible`, `low`, `medium`, `high`, `not_applicable`. **IMPACT_LEVEL_CONFIG** gives per-level `label`, `labelAr`, `value`, `color`, `bgClass`, `textClass`, `dotClass` for UI (Tailwind classes and labels).

### Data Flow

1. **When authenticated:** LookupProvider runs `fetchLookups()` once when `isAuthenticated` is true and `isLoaded` is false, and no fetch is in progress (guarded by a ref). It calls `lookupService.getAllLookups()` and, if `canListUsers` is true, `userService.getAll()`; results are stored in state. Categories are sorted by `code` and enhanced with icons.
2. **On logout:** When `isAuthenticated` becomes false, an effect clears all lookup arrays, sets `isLoaded` to false, clears `error`, and resets the fetch guard.
3. **Retry:** `retry()` clears `isLoaded` and `error` and calls `fetchLookups()` again.
4. **Refetch:** `refetch` is the same as `fetchLookups`; call it to force a fresh load (e.g. after data changes elsewhere).

Users list is only fetched when `canListUsers` is true (all authenticated roles in this app); on failure it is treated as an empty array so the rest of the lookups still apply.

### Where LookupContext Is Used

- **Pages:** AssessmentScoringPage, AssessmentReviewPage (categoriesWithQuestions, IMPACT_LEVEL_CONFIG); MonitoringOverviewPage, MonitoringDataEntryPage (categoriesWithIndicators, IMPACT_LEVEL_CONFIG, etc.); MitigationPlanPage, ManagementActivitiesPage (activeUsers).
- **Components:** RankingSelect (IMPACT_LEVEL_CONFIG); ImpactScoreRow, ImpactCategoryAccordion, TotalImpactCard, TotalScoreCard, AssessmentReviewCard (IMPACT_LEVELS / IMPACT_LEVEL_CONFIG, some from barrel `@/contexts/LookupContext`).
- **Hooks:** useAssessment (categoriesWithQuestions, isLoading as lookupsLoading); useMonitoring (categoriesWithIndicators and related).
- **Utils:** excelExport/exportMonitoring and rankingHelp mention receiving impact level config from LookupContext; they are typically called with data from components that already use useLookups.

LookupProvider itself uses `useAuth()` for `isAuthenticated` and `canListUsers`; no other context depends on LookupContext.

### Constraints

- `useLookups()` must be used inside LookupProvider; otherwise it throws: `"useLookups must be used within a LookupProvider"`.
- Lookup data is not persisted by the context; it is refetched after login. No TTL or cache invalidation beyond logout and explicit `refetch`/`retry`.
- Fetch is intentionally single-flight (ref guard) to avoid duplicate requests during auth state changes.

---

## ThemeContext

ThemeContext holds the user's theme preference (light, dark, or system), resolves "system" to the current OS preference, applies the resolved theme to the document (Tailwind dark class), and persists the preference to localStorage. It does not depend on auth or lookups.

### State Shape

The value exposed by `useTheme()`:

```ts
type ThemePreference = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: ThemePreference       // Stored preference (what user chose)
  resolvedTheme: 'light' | 'dark'   // Actually applied theme
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
  isDark: boolean
  isLight: boolean
  isSystem: boolean
}
```

Storage key is `THEME_STORAGE_KEY` from `@/utils/constants`: `'esms-theme'`. Valid stored values are the three THEMES: `'light'`, `'dark'`, `'system'`. Default for first visit or invalid value is `'light'`.

### Resolved Theme and DOM

- If `theme === 'system'`, `resolvedTheme` is derived from `window.matchMedia('(prefers-color-scheme: dark)').matches` (dark → `'dark'`, else `'light'`). ThemeContext subscribes to this media query and updates `resolvedTheme` when the system preference changes.
- If `theme` is `'light'` or `'dark'`, `resolvedTheme` equals `theme`.
- Application to the DOM: `document.documentElement.classList` — only the class `'dark'` is toggled. When `resolvedTheme === 'dark'`, the root has class `dark`; for light, the dark class is removed. Tailwind uses this for dark-mode styles.

### Lifecycle

1. **Mount:** Initial theme is read from `localStorage.getItem(THEME_STORAGE_KEY)`; if missing or invalid, default is `'light'`. Initial `resolvedTheme` is computed from that; then `applyTheme(resolvedTheme)` runs to sync the document and state.
2. **setTheme(newTheme):** Updates state, writes `newTheme` to localStorage, and calls `applyTheme(getResolvedTheme(newTheme))`.
3. **toggleTheme:** Sets theme to the opposite of current `resolvedTheme` (dark → light, light → dark) via `setTheme`.
4. **System change:** When `theme === 'system'`, a listener on `prefers-color-scheme` calls `applyTheme(e.matches ? 'dark' : 'light')` so the UI follows OS changes without changing the stored preference.

### Where ThemeContext Is Used

- **Header, ProjectSidebar, MobileMenu:** `isDark`, `toggleTheme` for the theme switch control.
- **ComponentShowcase:** `toggleTheme`, `isDark` for demo.

No other context or route guard reads ThemeContext. Theme is purely UI preference and does not affect API or auth.

### Constraints

- `useTheme()` must be used inside ThemeProvider; otherwise it throws: `"useTheme must be used within a ThemeProvider"`.
- ThemeContext does not read or set any backend state; persistence is localStorage only.
- Default theme is always `'light'` when no valid preference is stored; there is no "follow system on first visit" as the default (user must choose "system" explicitly).

---

## Usage Patterns

### Consuming a single context

Most components use one context per concern:

- **Auth only:** ProtectedRoute, SettingsRouteGuard, LoginPage, ProjectsManagementSection, MainSidebar, ApprovalSection, ScreeningInfoSection, AssessmentMetadataPage.
- **Lookups only:** AssessmentScoringPage (categoriesWithQuestions), MonitoringOverviewPage (categoriesWithIndicators, IMPACT_LEVEL_CONFIG), RankingSelect (IMPACT_LEVEL_CONFIG), and assessment components that import IMPACT_LEVELS/IMPACT_LEVEL_CONFIG from `@/contexts` or `@/contexts/LookupContext`.
- **Theme only:** ComponentShowcase.

### Consuming Auth + Lookups

Pages that need both current user permissions and reference data use both hooks in the same component:

- **AssessmentReviewPage:** `useAuth()` for `user`, `canApprove`; `useLookups()` for `categoriesWithQuestions`, `IMPACT_LEVEL_CONFIG`, loading.
- **MitigationPlanPage, ManagementActivitiesPage, MonitoringDataEntryPage:** `useAuth()` for `canEdit`; `useLookups()` for `activeUsers` (and in monitoring, categories/indicators/config).

Hooks **useAssessment** and **useMonitoring** also use both: they call `useAuth()` (e.g. for `user`) and `useLookups()` (e.g. categoriesWithQuestions, categoriesWithIndicators, loading) inside the hook.

### Consuming Auth + Theme

Layout components that show user info and a theme toggle use both:

- **Header, ProjectSidebar, MobileMenu:** `useTheme()` for `isDark`, `toggleTheme`; `useAuth()` for `user`, `logout`, and often `ROLE_LABELS`, `USER_ROLES` for labels and nav.

### Constants without the full context

Some components only need the role or impact-level constants and no reactive state. They can import from the barrel to avoid wrapping in a provider:

- **USER_ROLES, ROLE_LABELS:** from `@/contexts` (AuthContext).
- **IMPACT_LEVELS, IMPACT_LEVEL_CONFIG:** from `@/contexts` or `@/contexts/LookupContext` (LookupContext).

Using the hook is still required when the component needs live data (e.g. `user`, `categoriesWithQuestions`) or actions (e.g. `login`, `setTheme`). The constants are static and do not require being inside the provider for correctness, but the hooks do throw outside their provider.

### Route guards

- **ProtectedRoute:** Uses `useAuth()` for `isAuthenticated`, `isLoading`, and optionally `hasAnyRole(allowedRoles)`. Renders children only when authenticated and (if `allowedRoles` is set) role is allowed; otherwise redirects to login or dashboard.
- **SettingsRouteGuard:** Uses `useAuth()` for `user` and `isLoading`; renders outlet only when `user.role === USER_ROLES.ENVIRONMENTAL_SPECIALIST`; otherwise redirects to dashboard.

Guards do not use LookupContext or ThemeContext.

### Invariants (usage)

- Any component that calls `useAuth()`, `useLookups()`, or `useTheme()` must be rendered under the corresponding provider in the tree (which is guaranteed for everything under `App` in the current main.jsx).
- LookupProvider must be a descendant of AuthProvider because it uses `useAuth()`.
- Permission and role checks for UI (buttons, links, guards) should use AuthContext helpers (`canEdit`, `canApprove`, etc.) rather than duplicating role strings; the backend remains the authority for API access.

---

## Key Invariants (cross-context)

1. **Provider order:** AuthProvider → LookupProvider → ThemeProvider → ToastProvider. Only LookupProvider depends on AuthProvider.
2. **Auth storage:** Token and user are stored only via `authService` (localStorage keys `token`, `user`). AuthContext reads and updates state from `authService`; no other context writes auth storage.
3. **Lookup scope:** Lookup data is fetched only when `isAuthenticated` is true and is cleared when it becomes false. Users list is fetched only when `canListUsers` is true.
4. **Theme storage:** Theme preference is stored only in localStorage under `THEME_STORAGE_KEY`; no backend or other context reads or writes it.
5. **No context from outside tree:** All three context hooks throw if used outside their provider; the app tree in main.jsx ensures every route and component under App has access to all three providers.
6. **Permissions are UI-only:** canEdit, canApprove, canManageUsers, canListUsers, canDeleteProject, canUpdateMonitoring drive UI and route guards only; the backend enforces authorization on every request.
7. **Single fetch for lookups:** LookupProvider uses a ref to prevent concurrent fetch runs; at most one fetch is in progress for the current authenticated session until completion or logout.
