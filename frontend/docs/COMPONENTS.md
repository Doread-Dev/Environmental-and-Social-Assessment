# Components

This document describes all React components in `frontend/src/components`: UI primitives, layout shells, and domain-specific components for assessment, screening, SEMP, monitoring, files, dashboard, project, and settings. Each section is self-contained; terminology follows `doc-decisions.md` (ESMS, project, screening, assessment, SEMP, monitoring).

---

## Overview

The ESMS frontend component tree lives under `frontend/src/components`. **Root-level** components (`ErrorBoundary`, `OfflineBanner`) wrap the app or provide global UI. **Layout** components define shells (Auth, Main, Project, SEMP full-width) and navigation (Header, sidebars, mobile menu). **UI** components are shared primitives (buttons, inputs, cards, modals, toasts, tables, etc.) exported from `components/ui`. **Domain** components are feature-specific: assessment, screening, semp, monitoring, files, dashboard, project, settings, and the shared **tables** folder. Components receive data via props and/or hooks/contexts; they do not import services directly except for self-contained sections (e.g. settings management). All imports use the `@` alias for `src/`.

---

## Component Map

| Folder | Components | Purpose |
|--------|------------|---------|
| (root) | ErrorBoundary, OfflineBanner | Global error handling and offline banner |
| layout | AuthLayout, MainLayout, ProjectLayout, SempFullWidthLayout, Header, MainSidebar, ProjectSidebar, MobileMenu | Route shells and navigation |
| ui | Button, Input, Textarea, Select, Checkbox, RadioGroup, FileUpload, Card, Badge, Avatar, Alert, Table, Modal, Tooltip, Dropdown, ToastProvider/useToast, Breadcrumb, ProgressBar, ProgressStepper, Pagination, Accordion, StickyFooter, LoadingSpinner, Icon | Shared form, display, and feedback primitives |
| assessment | AssessmentProgressIndicator, ProjectContextCard, AssessmentStartCard, MetadataInfoSection, MetadataFormSection, MethodChecklistItem, ConsultationChecklistItem, ImpactCategoryAccordion, ImpactScoreRow, TotalScoreCard, TotalImpactCard, ImpactSummarySection, AssessmentReviewCard, AssessmentApprovalSection | Assessment (Tool 2) steps and scoring |
| screening | ScreeningInfoSection, RiskCategorySelector, ImpactSection, ScreeningSummaryCard, ApprovalSection | Screening (Tool 1) form and summary |
| semp | SempToolCard, SempStatusBadge, SempCTABanner, EditableCell, TableRowActions, ResponsibleSelect, ManagementActivitiesTable, MitigationPlanTable | SEMP (Tools 3 & 4) overview and tables |
| monitoring | MonitoringCategoryCard, MonitoringProgressTimeline, IndicatorDataRow, RankingSelect | Monitoring (Tool 5) categories and data rows |
| files | FileCategoryAccordion, FileListTable, FileRowActions | Project attachments by category |
| dashboard | MetricCard, ProjectListItem, WorkflowProgressBar, ScreeningCategoryBadge, ProjectStatusBadge | Dashboard metrics and project list |
| project | ProjectHeader, ProjectProgressTimeline, ProjectMetricCard, ProjectCTACard, ProjectSiteCard | Project overview and header |
| settings | UsersManagementSection, ProjectsManagementSection | Settings page sections (users, projects) |
| tables | MonitoringDataTable | Shared data table for monitoring |

---

## Root-Level Components

### ErrorBoundary

Class component that catches JavaScript errors in the child tree and renders a fallback UI instead of crashing.

**Location:** `frontend/src/components/ErrorBoundary.jsx`

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | React.ReactNode | yes | Child tree to wrap |

**Behavior:** On error, `getDerivedStateFromError` sets `hasError: true` and `error`. `componentDidCatch` logs to console. Render shows a centered message "Something went wrong", "Try Again" (clears error state), and "Back to Dashboard" link to `ROUTES.DASHBOARD`. No props for custom message or retry callback; retry only clears state.

**Constraints:** Must wrap a subtree that may throw. Does not catch event-handler or async errors unless they lead to a render throw.

---

### OfflineBanner

Functional component that shows a sticky banner when the user is offline; renders nothing when online.

**Location:** `frontend/src/components/OfflineBanner.jsx`

**Props:** None.

**Behavior:** Uses `useOnlineStatus()` from `@/hooks/useOnlineStatus`. If `!isOnline`, renders a full-width sticky bar (amber background, "You are offline. Some features may not work until connection is restored."). No dismiss; visibility follows network state.

**Constraints:** Renders only when offline; no custom message or position.

---

## Layout Components

### AuthLayout

Layout for authentication routes (e.g. Login). Centered content with decorative background and `<Outlet />` for child route.

**Props:** `className?: string`

**Behavior:** Full viewport, centered flex, background pattern. Renders `<Outlet />` and a footer line "Authorized users only" with Icon. No header/sidebar.

---

### MainLayout

Application shell for dashboard, projects list, and create-project. Desktop sidebar + header + main content; mobile uses Header menu button and MobileMenu overlay.

**Props:** None.

**Behavior:** Uses `useState` for `isMobileMenuOpen`. Renders `MainSidebar` (hidden on mobile), `MobileMenu` with `variant="main"`, `Header` with `onMenuClick` and `showMobileMenu={true}`, and `<main>` with `<Outlet />` inside `max-w-7xl`. Does not fetch data; children own their data.

---

### ProjectLayout

Project workspace shell for all project-scoped routes (overview, screening, assessment, SEMP, monitoring, files, annex). Loads project and workflow; provides outlet context; shows Export Excel when applicable.

**Props:** None.

**Data:** `useParams().projectId`, `useWorkflow(projectId)`, `projectService.getById(projectId)`. State: `project`, `isLoading`, `error`, `isMobileMenuOpen`.

**Behavior:** On load/error: full-screen error UI with "Back to Projects" / "Try Again", or loading spinner. On success: `ProjectSidebar` with `project={enhancedProject}`, `MobileMenu` with `variant="project"` and `project`, custom project header (no `Header` component) with Export Excel button when on screening summary, assessment, or monitoring data-entry (dispatches `screening-export` / `assessment-export` / `monitoring-export`). `<Outlet context={{ project: enhancedProject, setProject, workflow }} />`. `enhancedProject` = `{ ...project, workflow, screening, assessment }`.

**Constraints:** Project and workflow must load before rendering children; 404/missing project is handled as generic error.

---

### SempFullWidthLayout

Full-width layout for SEMP sub-routes (activities, mitigation). No project sidebar. Renders only after assessment is approved; otherwise shows "Restricted Access" and Back.

**Props:** None.

**Data:** `useParams().projectId`, `projectService.getById(projectId)`, `useAssessment(projectId)` for gate.

**Behavior:** Loading: spinner. If `assessment?.status !== 'approved'`: gate screen with Back to Overview. Else: sticky header (logo, Export Excel button), `<Outlet context={{ project }} />`. Export dispatches `semp-export` with `detail.toolType` ('tool3' or 'tool4' from path).

**Constraints:** SEMP routes are protected by route guard and this layout; both depend on assessment approved.

---

### Header

Top bar: mobile menu button (optional), logo (mobile), theme toggle, user avatar and dropdown (Settings for Environmental Specialist, Sign Out).

**Props:** `onMenuClick?: () => void`, `showMobileMenu?: boolean` (default true), `className?: string`

**Behavior:** Uses `useTheme()`, `useAuth()`, `ROLE_LABELS`, `USER_ROLES`. User menu built from role (Settings only if `user.role === USER_ROLES.ENVIRONMENTAL_SPECIALIST`). Logout calls `logout()` and `navigate(ROUTES.LOGIN, { replace: true })`. No data fetching.

---

### MainSidebar

Desktop-only sidebar for main app (dashboard, projects). Logo, `MAIN_NAV_ITEMS` (NavLink), and optional Settings link for Environmental Specialist.

**Props:** `className?: string`

**Behavior:** Hidden on small screens (`hidden lg:flex`). Uses `useAuth()` and `USER_ROLES` to show Settings at bottom. No project or workflow data.

---

### ProjectSidebar

Desktop-only sidebar for project workspace. Back to Dashboard, project card (title, location), `PROJECT_WORKFLOW_NAV`, `PROJECT_SECONDARY_NAV`, step locking (screening → assessment → SEMP → monitoring), user footer with dropdown (theme, Settings, Sign Out).

**Props:** `project: object | null` (includes `workflow`, `screening`, `assessment`), `className?: string`

**Behavior:** Locking: screening always unlocked; assessment requires screening approved; SEMP requires screening + assessment approved; monitoring requires screening + assessment approved + SEMP completed. Annex/files never locked. Assessment children (metadata, methods, scoring) shown as non-clickable labels when active; review is NavLink. Uses `ROUTES`, `getProjectRoute`-style paths with `projectId`.

---

### MobileMenu

Slide-out panel for small screens. Two variants: `main` (dashboard/projects nav) and `project` (project nav + project info + same step locking as ProjectSidebar). User dropdown in footer for project variant.

**Props:** `isOpen: boolean`, `onClose: () => void`, `variant: 'main' | 'project'` (default `'main'`), `project?: object | null` (for project variant)

**Behavior:** Closes on route change (`location.pathname`), Escape, overlay click; locks body scroll when open. Renders `MAIN_NAV_ITEMS` or project nav (overview, workflow, secondary) with same lock logic as ProjectSidebar. No data fetching; receives `project` from parent.

**Constraints:** Only visible on small viewports (`lg:hidden`); desktop uses sidebars.

---

## UI Components

### Button

**Props:** `variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'`, `size?: 'sm' | 'md' | 'lg'`, `disabled?: boolean`, `isLoading?: boolean`, `fullWidth?: boolean`, `leftIcon?: React.ReactNode`, `rightIcon?: React.ReactNode`, `type?: string` (default `'button'`), `className?: string`, plus native button attributes. Forwarded ref.

**Behavior:** When `isLoading`, shows `LoadingSpinner` and label. Disabled when `disabled || isLoading`. Uses `cn()` for Tailwind; focus ring and variant/size maps as in source.

---

### Card (compound)

**Exports:** `Card`, `Card.Header`, `Card.Title`, `Card.Description`, `Card.Body`, `Card.Footer`

**Props:** All accept `className` and spread rest to wrapper div. No required props. Card wraps children in bordered, rounded container; subcomponents add borders and typography.

---

### Modal

**Props:** `isOpen: boolean`, `onClose: () => void`, `title?: string`, `description?: string`, `sub_description?: string`, `size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'` (default `'md'`), `closeOnOverlay?: boolean` (default true), `closeOnEscape?: boolean` (default true), `showCloseButton?: boolean` (default true), `className?: string`, `children?: React.ReactNode`. `Modal.Footer` for action row.

**Behavior:** Renders via `createPortal` into `document.body`. Overlay click and Escape call `onClose` when enabled. Body scroll locked when open. Sizes: sm/md/lg/xl/2xl/full (full = viewport minus margin). Header shows title, description, sub_description; body scrollable with max-height.

---

### Toast (ToastProvider / useToast)

**ToastProvider:** Wraps app; provides toast API via context. **useToast:** Returns `{ success, error, warning, info }` each `(message: string) => id`. Toasts auto-dismiss after 4s; manual dismiss via close button. Variants: success, error, warning, info (icon and colors per variant). Container fixed top-right.

**Constraints:** Must be used inside `ToastProvider`; no persistent or action toasts.

---

### Input

**Props:** `label?: string`, `error?: string`, `helperText?: string`, `leftIcon?: React.ReactNode`, `rightIcon?: React.ReactNode`, `size?: 'sm' | 'md' | 'lg'`, `required?: boolean`, `disabled?: boolean`, `className?: string`, `inputClassName?: string`, `id?: string`, plus native input props. Forwarded ref.

**Behavior:** Generates id via `useId()` if not provided. Label with optional required asterisk; input with aria-invalid and aria-describedby; error or helper text below. Sizes and padding account for icons.

---

### Select

**Props:** `label?: string`, `options?: Array<{ value: string, label: string, disabled?: boolean }>`, `placeholder?: string` (default `'Select an option'`), `error?: string`, `helperText?: string`, `size?: 'sm' | 'md' | 'lg'`, `required?: boolean`, `disabled?: boolean`, `className?: string`, `selectClassName?: string`, `id?: string`, plus native select props. Forwarded ref.

**Behavior:** Native `<select>` with styled wrapper; options from `options`; placeholder as disabled first option. Dropdown arrow icon; error/helper below.

---

### Table (compound)

**Exports:** `Table`, `Table.Header`, `Table.Body`, `Table.Footer`, `Table.Row`, `Table.Head`, `Table.Cell`, `Table.Caption`, `Table.Empty`.

**Table.Row:** `isSelected?: boolean`, `isClickable?: boolean`. **Table.Head:** `sortable?: boolean`, `sortDirection?: 'asc' | 'desc'`, `onSort?: () => void`. **Table.Empty:** `message?: string` (default `'No data available'`). Rest accept `className` and spread. No built-in sorting logic; `Table.Head` only renders sort icon when `sortable`.

---

### LoadingSpinner

**Props:** `size?: 'sm' | 'md' | 'lg'`, `className?: string`. SVG spinner; sizes map to width/height classes.

---

### Icon

**Props:** `name: string` (Material Symbols name), `size?: 'sm' | 'md' | 'lg' | 'xl'`, `filled?: boolean`, `className?: string`. Renders `<span class="material-symbols-outlined|material-symbols-filled">` with optional size; custom `className` can override text size.

---

### Badge

**Props:** `variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'`, `size?: 'sm' | 'md' | 'lg'`, `dot?: boolean`, `icon?: React.ReactNode`, `className?: string`, `children?: React.ReactNode`.

---

### Avatar

**Props:** `src?: string`, `alt?: string`, `fallback?: string | React.ReactNode`, `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`, `shape?: 'circle' | 'square'`, `status?: 'online' | 'offline' | 'away' | 'busy'`, `className?: string`. On image error, falls back to initials or person icon. Status shows small colored dot.

---

### Alert

**Props:** `variant?: 'info' | 'success' | 'warning' | 'error'`, `title?: string`, `dismissible?: boolean`, `onDismiss?: () => void`, `icon?: React.ReactNode`, `action?: React.ReactNode`, `className?: string`, `children?: React.ReactNode`. Internal `isVisible`; when dismissible and dismissed, returns null.

---

### Tooltip

**Props:** `content: string | React.ReactNode`, `position?: 'top' | 'bottom' | 'left' | 'right'`, `delay?: number` (ms), `className?: string`, `children: React.ReactNode`. Renders trigger (child); on hover/focus shows tooltip via portal after delay. Position classes control placement.

---

### Dropdown

**Props:** `trigger: React.ReactNode`, `items?: Array<{ label: string, icon?: string, onClick?: Function, divider?: boolean, disabled?: boolean, danger?: boolean }>`, `align?: 'left' | 'right'`, `className?: string`. Toggle opens menu; outside click and Escape close. Items render as buttons with optional Material icon.

---

### FileUpload

**Props:** `accept?: string`, `multiple?: boolean`, `maxSize?: number` (default 10MB), `maxFiles?: number` (default 10), `onUpload?: (files: File[]) => void`, `onError?: (error: Error | string) => void`, `label?: string`, `hint?: string`, `disabled?: boolean`, `className?: string`. Drag-and-drop and click; validates size and count; calls `onUpload` with valid files or `onError`.

---

### ProgressBar

**Props:** `value?: number`, `max?: number`, `size?: 'sm' | 'md' | 'lg'`, `variant?: 'default' | 'success' | 'warning' | 'error' | 'primary'`, `showLabel?: boolean`, `animated?: boolean`, `label?: string`, `className?: string`. Percentage from value/max; clamped 0–100.

---

### ProgressStepper

**Props:** (from codebase pattern) steps array and current step; renders horizontal stepper. Exact prop names follow usage in pages (e.g. steps, currentStep).

---

### Breadcrumb

**Props:** (from barrel) typically `items: Array<{ label: string, path?: string }>` or similar; renders list of links/span for current. Consult source for exact API.

---

### Accordion (compound)

**Props:** `defaultOpen?: string | string[]`, `allowMultiple?: boolean`, `onChange?: (openItems: string[]) => void`, `className?: string`, `children`. **Accordion.Item:** `value: string`. **Accordion.Trigger** / **Accordion.Content** for each item. Internal state tracks open items; single or multiple by `allowMultiple`.

---

### Pagination

**Props:** `currentPage: number`, `totalPages: number`, `onPageChange: (page: number) => void`, `siblingCount?: number`, `showFirstLast?: boolean`, `className?: string`. Renders page numbers with ellipsis; first/last when `showFirstLast`. 1-based pages.

---

### Textarea, Checkbox, RadioGroup

**Textarea:** Similar to Input (label, error, helperText, size, disabled, className). **Checkbox:** label, checked, onChange, disabled. **RadioGroup:** options and value/onChange; structure as in form pages. See source for full prop lists.

---

### StickyFooter

**Props:** `className?: string`, `children`. Wraps content in a sticky bottom bar (e.g. for submit buttons). Exact classes in source.

---

## Assessment Components

Used on assessment routes (metadata, methods, scoring, review). Depend on `useLookups()` for impact categories/questions and `IMPACT_LEVELS` / `IMPACT_LEVEL_CONFIG`; scoring uses `@/utils/impactCalculations`.

| Component | Purpose | Key props / data |
|-----------|---------|-------------------|
| AssessmentProgressIndicator | Stepper (Screening → Assessment → SEMP) | currentStep, screeningComplete, assessmentComplete |
| ProjectContextCard | Shows project context on assessment | project |
| AssessmentStartCard | CTA to start assessment | project, onStart |
| MetadataInfoSection | Read-only metadata | assessment, project |
| MetadataFormSection | Form for metadata step | data, errors, onChange |
| MethodChecklistItem | Single method checkbox/row | method, checked, onChange, readOnly |
| ConsultationChecklistItem | Consultation item | item, checked, onChange |
| ImpactCategoryAccordion | Collapsible category with score rows | category, scores, onScoreChange, onNoteChange, defaultOpen, readOnly |
| ImpactScoreRow | Single question score (level select) | question, score, onChange, readOnly |
| TotalScoreCard | Aggregate score display | totalScore, maxScore, etc. |
| TotalImpactCard | Impact level summary | impactLevel, counts, etc. |
| ImpactSummarySection | Summary of impact scores | scores, categories |
| AssessmentReviewCard | Review step summary | assessment, project |
| AssessmentApprovalSection | Approve/reject actions | assessment, onApprove, onReject, canApprove |

**Constraints:** Impact categories and questions come from LookupContext; do not fetch separately. Read-only mode when assessment status is submitted/approved.

---

## Screening Components

Used on screening and screening summary pages. Use `screeningCategories` from `@/utils/screeningDisplay` and screening state from parent/hook.

| Component | Purpose | Key props |
|-----------|---------|-----------|
| ScreeningInfoSection | Project/screening info block | screening, project |
| RiskCategorySelector | Category A–F radio + justification textarea | selectedCategory, onCategoryChange, justification, onJustificationChange, readOnly, error |
| ImpactSection | Impact description/fields | screening, onChange, readOnly |
| ScreeningSummaryCard | Summary card for summary page | screening, project |
| ApprovalSection | Approve/reject screening | screening, onApprove, onReject, canApprove |

---

## SEMP Components

Used on SEMP overview and Tool 3 / Tool 4 pages. Tables receive activities or plans from `useSemp(projectId)`; users from `useLookups().activeUsers`.

| Component | Purpose | Key props |
|-----------|---------|-----------|
| SempToolCard | Card for Tool 3 or 4 with status and navigate | title, description, status, onClick, locked |
| SempStatusBadge | Status badge (e.g. not_started, in_progress, completed) | status |
| SempCTABanner | Banner CTA to open tools | assessmentApproved, onNavigate |
| EditableCell | Inline editable cell | value, onChange, readOnly, placeholder |
| TableRowActions | Row action buttons | onEdit, onDelete, etc. |
| ResponsibleSelect | User dropdown for responsible | value, users, onChange, readOnly |
| ManagementActivitiesTable | Tool 3 table | activities, onUpdate, onDelete, onAddRow, users, readOnly |
| MitigationPlanTable | Tool 4 table | plans, onUpdate, onDelete, onAddRow, users, readOnly |

**Constraints:** Management and mitigation data are owned by pages/hooks; components are controlled. New rows get temp ids (`temp_*`) until saved.

---

## Monitoring Components

Used on monitoring overview and data-entry. Categories and indicators from LookupContext; records from `useMonitoring(projectId)`.

| Component | Purpose | Key props |
|-----------|---------|-----------|
| MonitoringCategoryCard | Category card with ranking | code, name, rankingKey, rankingLabel |
| MonitoringProgressTimeline | Timeline of quarters/baseline | completedQuarters, etc. |
| IndicatorDataRow | Single indicator row (baseline, Q1–Q4, total, assessment, ranking, responsibility, note) | indicator, record, onUpdateScore, onUpdateField, isEditable, users |
| RankingSelect | Ranking dropdown | value, onChange, options, readOnly |

---

## Files Components

Used on project files/attachments page. Files from `useFiles(projectId)` or equivalent; categories from backend or config.

| Component | Purpose | Key props |
|-----------|---------|-----------|
| FileCategoryAccordion | Accordion per category with file list | category, files, onDownload, onDelete |
| FileListTable | Table of files (name, type, size, uploaded by, date, actions) | files, onDownload, onDelete |
| FileRowActions | Download/delete per row | file, onDownload, onDelete |

---

## Dashboard Components

Used on dashboard and project list.

| Component | Purpose | Key props |
|-----------|---------|-----------|
| MetricCard | Stat card (title, value, icon, badge, subtitle, highlight) | title, value, icon, iconBgColor, iconColor, badge, badgeVariant, subtitle, highlight |
| ProjectListItem | Row/card for one project in list | project, workflow |
| WorkflowProgressBar | Progress over workflow steps | workflow, steps |
| ScreeningCategoryBadge | Badge for screening category (A–F) | category |
| ProjectStatusBadge | Badge for project status | status |

---

## Project Components

Used on project overview and related pages.

| Component | Purpose | Key props |
|-----------|---------|-----------|
| ProjectHeader | Project title, location, dates, team, Edit modal | project, showEditButton, onEdit |
| ProjectProgressTimeline | Timeline of workflow steps | workflow, project |
| ProjectMetricCard | Metric card for overview | title, value, icon, etc. |
| ProjectCTACard | CTA card (e.g. start screening) | title, description, onClick, disabled |
| ProjectSiteCard | Site/location card | project |

ProjectHeader owns edit form state and calls `projectService.update` and validators; parent passes `project` and optional `onEdit` callback.

---

## Settings Components

Self-contained sections that fetch their own data and render forms/tables. Used only on Settings page (Environmental Specialist).

| Component | Purpose | Data / behavior |
|-----------|---------|------------------|
| UsersManagementSection | List users, add user, search, role filter, pagination | `userService.getAll()`, `authService.register()` for create; uses useAuth, ROLE_LABELS, USER_ROLES; Table, Pagination, Select, useToast |
| ProjectsManagementSection | List/manage projects | projectService; similar pattern |

**Constraints:** Require `canManageUsers` / appropriate permission; Settings route is role-protected.

---

## Tables (shared)

### MonitoringDataTable

**Props:** `data?: Array<{ indicator, record }>`, `onUpdateScore?: (recordId, quarter, value) => void`, `onUpdateField?: (recordId, field, value) => void`, `isEditable?: boolean`, `categoryCode?: string`, `categoryName?: string`, `users?: Array`. Renders table with Indicator Definition, Measurement, Baseline, Q1–Q4, Total, Final Assessment, Ranking, Responsibility, Note. Each row is `IndicatorDataRow`. Empty state when `data.length === 0`.

---

## Key Invariants

- **Import path:** All components are imported from `@/components/*` or `@/components/ui`, `@/components/layout`, etc.; no relative paths from pages to components beyond `@`.
- **Data ownership:** Layouts (ProjectLayout, SempFullWidthLayout) fetch project and/or workflow; pages fetch domain data via hooks (useScreening, useAssessment, useSemp, useMonitoring, useFiles). Domain components are controlled (props only) except settings sections.
- **Lookups:** Impact categories, questions, indicators, users come from LookupContext or `useLookups()`; UI and domain components do not call lookupService directly.
- **Toasts:** Success/error feedback uses `useToast()` from `@/components/ui` and `extractErrorMessage(error)` from `@/services/api`.
- **Routing:** Links use `ROUTES` and `getProjectRoute(projectId, route)` from `@/routes/routes.config`; no hardcoded paths.
- **Theme:** Components use Tailwind and CSS variables (e.g. `bg-background dark:bg-background-dark`, `text-primary`); no inline theme logic except in Header/ProjectSidebar/MobileMenu (theme toggle).
- **Icons:** Material Symbols via `<span class="material-symbols-outlined">` or the shared `Icon` component with `name` prop.
- **Compound components:** Card, Table, Modal, Accordion expose subcomponents (e.g. Card.Header, Table.Row); usage is consistent across the app.
- **Max document length:** This document stays under 600 lines; for new components add one row to the Component Map and one block to the relevant section with props and constraints.
