# MASTER PLAN: React SPA Migration

## Environmental & Social Management System (ESMS) — AKF Syria

---

## Table of Contents

1. [Project Summary](#section-1--project-summary)
2. [Technology Stack](#section-2--technology-stack)
3. [Folder Structure](#section-3--folder-structure)
4. [Routing Plan](#section-4--routing-plan)
5. [Component Architecture](#section-5--component-architecture)
6. [Design System](#section-6--design-system)
7. [Phased Execution Breakdown](#section-7--phased-execution-breakdown)
8. [Best Practices & Conventions](#section-8--best-practices--conventions)
9. [Deliverables Summary](#section-9--deliverables-summary)

---

## Section 1 — Project Summary

### Overview

The Environmental & Social Management System (ESMS) is an internal platform for Aga Khan Foundation Syria to manage environmental and social impact assessments for development projects. The system follows a structured workflow with 5 tools:

1. **Tool 1 — Screening**: Initial environmental risk categorization
2. **Tool 2 — Assessment**: Detailed environmental impact evaluation
3. **Tool 3 — SEMP (Management Activities)**: General management planning
4. **Tool 4 — Mitigation Plan**: Impact mitigation and enhancement strategies
5. **Tool 5 — Monitoring**: Ongoing environmental monitoring and evaluation

### Current State

- **19 static HTML pages** built with Tailwind CSS (CDN-based)
- Non-standardized inline Tailwind configuration
- Mixed color naming conventions across pages
- No component reusability
- No routing mechanism (standalone HTML files)
- Dark mode support configured but inconsistently applied

### Migration Goals

| Goal | Description |
|------|-------------|
| **Component-Based Architecture** | Convert HTML to reusable React components |
| **Build Pipeline** | Replace CDN Tailwind with build-time processing |
| **Unified Design System** | Extract and standardize color tokens, typography, spacing |
| **Routing** | Implement React Router with nested layouts |
| **State Ready** | Structure for future API integration |
| **Maintainability** | Establish patterns and conventions for long-term maintainability |
| **Accessibility** | Ensure WCAG 2.1 AA compliance |

### Constraints & Assumptions

| Constraint/Assumption | Description |
|----------------------|-------------|
| **No Backend Integration** | API exists but integration is out of scope for this phase |
| **Static Data** | Pages will use mock/static data initially |
| **Dark Mode** | Full dark mode support required |
| **Responsive Design** | Mobile-first responsive layouts required |
| **Browser Support** | Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions) |
| **Icon Library** | Material Symbols Outlined (Google Icons) |
| **Font** | Inter (Google Fonts) |

---

## Section 2 — Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x (latest stable) | UI Library |
| **React Router** | 7.x (latest stable) | Client-side routing |
| **Tailwind CSS** | 4.x (latest stable) | Utility-first CSS framework |
| **Vite** | 6.x (latest stable) | Build tool & dev server |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **ESLint** | 9.x | JavaScript/JSX linting |
| **Prettier** | 3.x | Code formatting |
| **PostCSS** | 8.x | CSS processing |
| **Autoprefixer** | 10.x | CSS vendor prefixing |

### Recommended Additional Packages

| Package | Purpose |
|---------|---------|
| `@tailwindcss/forms` | Form element styling |
| `clsx` or `classnames` | Conditional class merging |
| `lucide-react` or continue with Material Symbols | Icon library (optional migration) |

### Dependency Installation Commands

```bash
# Create React app with Vite
npm create vite@latest frontend -- --template react

# Navigate to frontend
cd frontend

# Install core dependencies
npm install react-router-dom

# Install Tailwind CSS v4 with Vite
npm install tailwindcss @tailwindcss/vite

# Install dev dependencies
npm install -D eslint prettier eslint-plugin-react eslint-config-prettier

# Install form plugin
npm install -D @tailwindcss/forms

# Install utility package for class merging
npm install clsx
```

---

## Section 3 — Folder Structure

```
/frontend
├── public/
│   ├── favicon.ico
│   └── fonts/                    # Self-hosted fonts (optional)
│
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/
│   │   ├── ui/                   # Shared UI primitives
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Textarea.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Checkbox.jsx
│   │   │   ├── RadioGroup.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Alert.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Breadcrumb.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── ProgressStepper.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── Tooltip.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   ├── Accordion.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   └── index.js          # Barrel export
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── AuthLayout.jsx
│   │   │   ├── MainLayout.jsx
│   │   │   ├── ProjectLayout.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── MainSidebar.jsx
│   │   │   ├── ProjectSidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── MobileMenu.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── project/              # Project-specific components
│   │   │   ├── ProjectCard.jsx
│   │   │   ├── ProjectProgressBar.jsx
│   │   │   ├── RiskCategoryBadge.jsx
│   │   │   ├── WorkflowStepIndicator.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── forms/                # Form-specific components
│   │   │   ├── ScreeningForm.jsx
│   │   │   ├── AssessmentMetadataForm.jsx
│   │   │   ├── ImpactScoringForm.jsx
│   │   │   ├── MethodsConsultationForm.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── tables/               # Complex table components
│   │   │   ├── ProjectsTable.jsx
│   │   │   ├── ManagementActivitiesTable.jsx
│   │   │   ├── MitigationPlanTable.jsx
│   │   │   ├── MonitoringDataTable.jsx
│   │   │   └── index.js
│   │   │
│   │   └── charts/               # Future: Data visualization
│   │       └── index.js
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── projects/
│   │   │   ├── ProjectListPage.jsx
│   │   │   ├── ProjectCreatePage.jsx
│   │   │   └── index.js
│   │   │
│   │   └── project-workspace/
│   │       ├── overview/
│   │       │   ├── ProjectOverviewPage.jsx
│   │       │   └── index.js
│   │       │
│   │       ├── screening/
│   │       │   ├── ScreeningFormPage.jsx
│   │       │   ├── ScreeningSummaryPage.jsx
│   │       │   └── index.js
│   │       │
│   │       ├── assessment/
│   │       │   ├── AssessmentGatewayPage.jsx
│   │       │   ├── AssessmentMetadataPage.jsx
│   │       │   ├── AssessmentMethodsPage.jsx
│   │       │   ├── AssessmentScoringPage.jsx
│   │       │   ├── AssessmentReviewPage.jsx
│   │       │   └── index.js
│   │       │
│   │       ├── semp/
│   │       │   ├── SempOverviewPage.jsx
│   │       │   ├── ManagementActivitiesPage.jsx
│   │       │   ├── MitigationPlanPage.jsx
│   │       │   └── index.js
│   │       │
│   │       ├── monitoring/
│   │       │   ├── MonitoringOverviewPage.jsx
│   │       │   ├── MonitoringDataEntryPage.jsx
│   │       │   └── index.js
│   │       │
│   │       └── annex/
│   │           ├── ProjectFilesPage.jsx
│   │           ├── AnnexOverviewPage.jsx
│   │           └── index.js
│   │
│   ├── routes/
│   │   ├── index.jsx             # Route definitions
│   │   ├── ProtectedRoute.jsx    # Auth guard (future)
│   │   └── routes.config.js      # Route constants
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useLocalStorage.js
│   │   ├── useMediaQuery.js
│   │   └── index.js
│   │
│   ├── contexts/                 # React Context providers
│   │   ├── ThemeContext.jsx      # Dark mode toggle
│   │   ├── AuthContext.jsx       # Future: Auth state
│   │   └── index.js
│   │
│   ├── services/                 # API service layer (future)
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── projectService.js
│   │   └── index.js
│   │
│   ├── utils/
│   │   ├── cn.js                 # Class name utility
│   │   ├── formatters.js         # Date, number formatters
│   │   ├── validators.js         # Form validation
│   │   └── constants.js          # App constants
│   │
│   ├── data/                     # Mock/static data
│   │   ├── mockProjects.js
│   │   ├── impactCategories.js
│   │   ├── riskCategories.js
│   │   └── index.js
│   │
│   ├── styles/
│   │   ├── index.css             # Global styles + Tailwind imports
│   │   └── fonts.css             # Font definitions
│   │
│   ├── App.jsx                   # Root component
│   └── main.jsx                  # Entry point
│
├── .eslintrc.cjs
├── .prettierrc
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── index.html
├── package.json
└── README.md
```

---

## Section 4 — Routing Plan

### Route Structure Overview

```
/login                                          → LoginPage (AuthLayout)

/app                                            → MainLayout wrapper
├── /dashboard                                  → DashboardPage
├── /projects                                   → ProjectListPage
└── /projects/new                               → ProjectCreatePage

/app/projects/:projectId                        → ProjectLayout wrapper
├── /overview                                   → ProjectOverviewPage
│
├── /screening                                  → ScreeningFormPage
├── /screening/summary                          → ScreeningSummaryPage
│
├── /assessment                                 → AssessmentGatewayPage
├── /assessment/metadata                        → AssessmentMetadataPage
├── /assessment/methods                         → AssessmentMethodsPage
├── /assessment/scoring                         → AssessmentScoringPage
├── /assessment/review                          → AssessmentReviewPage
│
├── /semp                                       → SempOverviewPage
├── /semp/activities                            → ManagementActivitiesPage
├── /semp/mitigation                            → MitigationPlanPage
│
├── /monitoring                                 → MonitoringOverviewPage
├── /monitoring/data-entry                      → MonitoringDataEntryPage
│
├── /files                                      → ProjectFilesPage
└── /annex                                      → AnnexOverviewPage
```

### Route Configuration

```javascript
// routes/routes.config.js

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  
  // Main App
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  PROJECTS: '/app/projects',
  PROJECT_NEW: '/app/projects/new',
  
  // Project Workspace (dynamic :projectId)
  PROJECT_BASE: '/app/projects/:projectId',
  PROJECT_OVERVIEW: '/app/projects/:projectId/overview',
  
  // Screening
  SCREENING: '/app/projects/:projectId/screening',
  SCREENING_SUMMARY: '/app/projects/:projectId/screening/summary',
  
  // Assessment
  ASSESSMENT: '/app/projects/:projectId/assessment',
  ASSESSMENT_METADATA: '/app/projects/:projectId/assessment/metadata',
  ASSESSMENT_METHODS: '/app/projects/:projectId/assessment/methods',
  ASSESSMENT_SCORING: '/app/projects/:projectId/assessment/scoring',
  ASSESSMENT_REVIEW: '/app/projects/:projectId/assessment/review',
  
  // SEMP
  SEMP: '/app/projects/:projectId/semp',
  SEMP_ACTIVITIES: '/app/projects/:projectId/semp/activities',
  SEMP_MITIGATION: '/app/projects/:projectId/semp/mitigation',
  
  // Monitoring
  MONITORING: '/app/projects/:projectId/monitoring',
  MONITORING_DATA: '/app/projects/:projectId/monitoring/data-entry',
  
  // Files & Annex
  PROJECT_FILES: '/app/projects/:projectId/files',
  PROJECT_ANNEX: '/app/projects/:projectId/annex',
};

// Helper function to generate project-specific routes
export const getProjectRoute = (projectId, path) => {
  return path.replace(':projectId', projectId);
};
```

### Navigation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                              LOGIN                                   │
│                           /login                                     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          MAIN LAYOUT                                 │
│  ┌─────────────┐  ┌─────────────────────────────────────────────┐   │
│  │   SIDEBAR   │  │                CONTENT AREA                  │   │
│  │  • Dashboard│  │  ┌─────────────────────────────────────┐    │   │
│  │  • Projects │  │  │          /app/dashboard              │    │   │
│  │  • Settings │  │  │          /app/projects               │    │   │
│  │             │  │  │          /app/projects/new           │    │   │
│  └─────────────┘  │  └─────────────────────────────────────┘    │   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Open Project)
┌─────────────────────────────────────────────────────────────────────┐
│                        PROJECT LAYOUT                                │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐   │
│  │   PROJECT SIDEBAR   │  │           CONTENT AREA               │   │
│  │  ┌───────────────┐  │  │                                      │   │
│  │  │ Project Info  │  │  │  WORKFLOW PAGES:                     │   │
│  │  └───────────────┘  │  │  • Overview                          │   │
│  │  ← Back to Dash     │  │  • Screening (Form → Summary)        │   │
│  │                     │  │  • Assessment (Gateway → Metadata    │   │
│  │  WORKFLOW TOOLS:    │  │       → Methods → Scoring → Review)  │   │
│  │  ○ Overview         │  │  • SEMP (Overview → Activities       │   │
│  │  ● Screening        │  │       → Mitigation)                  │   │
│  │  ○ Assessment       │  │  • Monitoring (Overview → Data)      │   │
│  │  ○ SEMP            │  │  • Files & Annex                     │   │
│  │  ○ Monitoring       │  │                                      │   │
│  │  ─────────────────  │  │                                      │   │
│  │  ○ Annex           │  │                                      │   │
│  │                     │  │                                      │   │
│  │  ┌───────────────┐  │  │                                      │   │
│  │  │ User Profile  │  │  │                                      │   │
│  │  └───────────────┘  │  │                                      │   │
│  └─────────────────────┘  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Nested Routes Implementation

```jsx
// routes/index.jsx

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout, MainLayout, ProjectLayout } from '@/components/layout';
import * as Auth from '@/pages/auth';
import * as Dashboard from '@/pages/dashboard';
import * as Projects from '@/pages/projects';
import * as Workspace from '@/pages/project-workspace';

export const router = createBrowserRouter([
  // Auth Routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Auth.LoginPage /> },
    ],
  },
  
  // Main App Routes
  {
    path: '/app',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard.DashboardPage /> },
      { path: 'projects', element: <Projects.ProjectListPage /> },
      { path: 'projects/new', element: <Projects.ProjectCreatePage /> },
    ],
  },
  
  // Project Workspace Routes
  {
    path: '/app/projects/:projectId',
    element: <ProjectLayout />,
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      { path: 'overview', element: <Workspace.ProjectOverviewPage /> },
      
      // Screening
      { path: 'screening', element: <Workspace.ScreeningFormPage /> },
      { path: 'screening/summary', element: <Workspace.ScreeningSummaryPage /> },
      
      // Assessment
      { path: 'assessment', element: <Workspace.AssessmentGatewayPage /> },
      { path: 'assessment/metadata', element: <Workspace.AssessmentMetadataPage /> },
      { path: 'assessment/methods', element: <Workspace.AssessmentMethodsPage /> },
      { path: 'assessment/scoring', element: <Workspace.AssessmentScoringPage /> },
      { path: 'assessment/review', element: <Workspace.AssessmentReviewPage /> },
      
      // SEMP
      { path: 'semp', element: <Workspace.SempOverviewPage /> },
      { path: 'semp/activities', element: <Workspace.ManagementActivitiesPage /> },
      { path: 'semp/mitigation', element: <Workspace.MitigationPlanPage /> },
      
      // Monitoring
      { path: 'monitoring', element: <Workspace.MonitoringOverviewPage /> },
      { path: 'monitoring/data-entry', element: <Workspace.MonitoringDataEntryPage /> },
      
      // Files & Annex
      { path: 'files', element: <Workspace.ProjectFilesPage /> },
      { path: 'annex', element: <Workspace.AnnexOverviewPage /> },
    ],
  },
  
  // Catch-all redirect
  { path: '*', element: <Navigate to="/login" replace /> },
]);
```

---

## Section 5 — Component Architecture

### 5.1 Layout Components

| Component | Description | Used By |
|-----------|-------------|---------|
| `AuthLayout` | Centered card layout for authentication pages | Login |
| `MainLayout` | Sidebar + header + main content for dashboard | Dashboard, Project List, Create Project |
| `ProjectLayout` | Project sidebar + header + main content | All project workspace pages |
| `Header` | Top navigation bar with logo, user profile | MainLayout, ProjectLayout |
| `MainSidebar` | Navigation for Dashboard/Projects | MainLayout |
| `ProjectSidebar` | Project-specific navigation with workflow tools | ProjectLayout |
| `MobileMenu` | Hamburger menu for responsive navigation | All layouts |

### 5.2 Shared UI Components

#### Form Controls

| Component | Props | Description |
|-----------|-------|-------------|
| `Button` | `variant`, `size`, `disabled`, `loading`, `icon`, `children` | Primary, secondary, outline, ghost variants |
| `Input` | `label`, `error`, `helperText`, `icon`, `type`, `...inputProps` | Text input with label and validation |
| `Textarea` | `label`, `error`, `helperText`, `rows`, `...textareaProps` | Multi-line text input |
| `Select` | `label`, `options`, `error`, `placeholder` | Dropdown select |
| `Checkbox` | `label`, `checked`, `onChange`, `disabled` | Single checkbox |
| `RadioGroup` | `name`, `options`, `value`, `onChange` | Radio button group |
| `FileUpload` | `accept`, `multiple`, `onUpload`, `maxSize` | Drag-and-drop file upload |

#### Display Components

| Component | Props | Description |
|-----------|-------|-------------|
| `Card` | `title`, `subtitle`, `actions`, `children`, `className` | Content container |
| `Badge` | `variant`, `size`, `children` | Status indicators (success, warning, error, info) |
| `Avatar` | `src`, `alt`, `size`, `fallback` | User avatar with fallback |
| `Alert` | `variant`, `title`, `children`, `dismissible` | Info banners |
| `Table` | `columns`, `data`, `onSort`, `pagination` | Data table wrapper |
| `Modal` | `isOpen`, `onClose`, `title`, `children`, `size` | Dialog overlay |
| `Tooltip` | `content`, `position`, `children` | Hover tooltip |
| `Dropdown` | `trigger`, `items`, `align` | Action menu dropdown |

#### Navigation Components

| Component | Props | Description |
|-----------|-------|-------------|
| `Breadcrumb` | `items` | Page breadcrumb trail |
| `ProgressStepper` | `steps`, `currentStep`, `orientation` | Workflow progress indicator |
| `ProgressBar` | `value`, `max`, `variant`, `showLabel` | Linear progress |
| `Pagination` | `currentPage`, `totalPages`, `onPageChange` | Page navigation |
| `Accordion` | `items`, `allowMultiple` | Collapsible sections |

### 5.3 Domain-Specific Components

#### Project Components

| Component | Description |
|-----------|-------------|
| `ProjectCard` | Card displaying project info with status badge |
| `ProjectProgressBar` | Visual progress through S/A/M/R stages |
| `RiskCategoryBadge` | Risk category indicator (A, B, B+, C, D, E, F) |
| `WorkflowStepIndicator` | Shows current step in workflow |
| `ProjectInfoPanel` | Sidebar panel with project details |

#### Assessment Components

| Component | Description |
|-----------|-------------|
| `ImpactCategoryAccordion` | Expandable impact scoring section |
| `ImpactScoreMatrix` | Impact rating selection matrix |
| `ImpactSummaryCard` | Overall impact score display |
| `MethodChecklistItem` | Checkbox item with detail input |
| `ConsultationSection` | Community consultation checklist |

#### Monitoring Components

| Component | Description |
|-----------|-------------|
| `MonitoringCategoryCard` | Category overview card with score |
| `MonitoringProgressTimeline` | Quarterly progress visualization |
| `IndicatorDataRow` | Editable monitoring indicator row |

### 5.4 Component Hierarchy Diagram

```
App
├── RouterProvider
│   ├── AuthLayout
│   │   └── LoginPage
│   │       ├── Card
│   │       ├── Input (email)
│   │       ├── Input (password)
│   │       └── Button
│   │
│   ├── MainLayout
│   │   ├── Header
│   │   │   ├── Logo
│   │   │   └── Avatar + Dropdown
│   │   ├── MainSidebar
│   │   │   └── NavLink[]
│   │   └── Outlet (Page Content)
│   │       ├── DashboardPage
│   │       │   ├── MetricCard[]
│   │       │   └── ProjectCard[]
│   │       ├── ProjectListPage
│   │       │   ├── SearchInput
│   │       │   ├── FilterDropdown[]
│   │       │   └── ProjectsTable
│   │       └── ProjectCreatePage
│   │           └── ProjectForm
│   │
│   └── ProjectLayout
│       ├── Header
│       ├── ProjectSidebar
│       │   ├── BackButton
│       │   ├── ProjectInfoPanel
│       │   ├── WorkflowNavigation
│       │   └── UserProfile
│       └── Outlet (Workspace Pages)
│           ├── ProjectOverviewPage
│           ├── ScreeningFormPage
│           ├── ScreeningSummaryPage
│           ├── Assessment*Page[]
│           ├── Semp*Page[]
│           ├── Monitoring*Page[]
│           └── Files/AnnexPage[]
```

---

## Section 6 — Design System

### 6.1 Color Palette

#### Extracted Color Tokens

| Token Name | Hex Value | Usage |
|------------|-----------|-------|
| `primary` | `#11d452` | Primary actions, active states, success indicators |
| `primary-hover` | `#0eb646` | Primary button hover |
| `primary-content` | `#ffffff` | Text on primary background |

| Token Name | Hex Value | Usage |
|------------|-----------|-------|
| `background` | `#f6f8f6` | Page background (light) |
| `background-dark` | `#102216` | Page background (dark) |
| `surface` | `#ffffff` | Card/panel background (light) |
| `surface-dark` | `#1c2e22` | Card/panel background (dark) |

| Token Name | Hex Value | Usage |
|------------|-----------|-------|
| `text-main` | `#111813` | Primary text |
| `text-secondary` | `#61896f` | Secondary/muted text |
| `text-disabled` | `#9ca3af` | Disabled text |

| Token Name | Hex Value | Usage |
|------------|-----------|-------|
| `border` | `#dbe6df` | Borders, dividers |
| `border-dark` | `#2a4234` | Borders in dark mode |
| `input-border` | `#dbe6df` | Form input borders |

#### Semantic Colors

| Token Name | Light | Dark | Usage |
|------------|-------|------|-------|
| `success` | `#10b981` | `#34d399` | Success states |
| `warning` | `#f59e0b` | `#fbbf24` | Warning states |
| `error` | `#ef4444` | `#f87171` | Error states |
| `info` | `#3b82f6` | `#60a5fa` | Information states |

#### Risk Category Colors

| Category | Background | Text | Description |
|----------|------------|------|-------------|
| A | `bg-red-100` | `text-red-700` | High Risk |
| B+ | `bg-orange-100` | `text-orange-700` | Medium-High Risk |
| B | `bg-yellow-100` | `text-yellow-700` | Medium Risk |
| C | `bg-green-100` | `text-green-700` | Low Risk |
| D | `bg-blue-100` | `text-blue-700` | Emergency |
| E | `bg-gray-100` | `text-gray-700` | Insufficient Info |
| F | `bg-emerald-100` | `text-emerald-700` | Positive Impact |

### 6.2 Typography

#### Font Configuration

```css
/* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
```

#### Type Scale

| Class | Font Size | Font Weight | Line Height | Usage |
|-------|-----------|-------------|-------------|-------|
| `text-xs` | 12px (0.75rem) | 400-700 | 1.5 | Captions, labels |
| `text-sm` | 14px (0.875rem) | 400-600 | 1.5 | Body small, table text |
| `text-base` | 16px (1rem) | 400-500 | 1.5 | Body text |
| `text-lg` | 18px (1.125rem) | 600-700 | 1.5 | Section titles |
| `text-xl` | 20px (1.25rem) | 600-700 | 1.4 | Card titles |
| `text-2xl` | 24px (1.5rem) | 700 | 1.3 | Page subtitles |
| `text-3xl` | 30px (1.875rem) | 800-900 | 1.2 | Page titles |
| `text-4xl` | 36px (2.25rem) | 900 | 1.2 | Hero text |

### 6.3 Spacing Scale

Using Tailwind's default spacing scale with these common patterns:

| Pattern | Value | Usage |
|---------|-------|-------|
| Component padding | `p-4` to `p-8` | Card padding, section padding |
| Gap between items | `gap-2` to `gap-6` | Flex/grid gaps |
| Section margin | `mb-6` to `mb-8` | Between page sections |
| Form field margin | `mb-4` to `mb-6` | Between form fields |

### 6.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded` | 4px | Inputs, small elements |
| `rounded-lg` | 8px | Cards, buttons |
| `rounded-xl` | 12px | Large cards, panels |
| `rounded-2xl` | 16px | Hero cards, modals |
| `rounded-full` | 9999px | Badges, avatars |

### 6.5 Shadow System

| Class | Usage |
|-------|-------|
| `shadow-sm` | Cards, dropdowns |
| `shadow-md` | Elevated cards, buttons |
| `shadow-lg` | Modals, floating elements |
| `shadow-primary/30` | Primary button shadow |

### 6.6 Tailwind Configuration

```javascript
// tailwind.config.js
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary
        primary: {
          DEFAULT: '#11d452',
          hover: '#0eb646',
          content: '#ffffff',
        },
        
        // Background
        background: {
          DEFAULT: '#f6f8f6',
          dark: '#102216',
        },
        
        // Surface
        surface: {
          DEFAULT: '#ffffff',
          dark: '#1c2e22',
        },
        
        // Text
        'text-main': '#111813',
        'text-secondary': '#61896f',
        'text-disabled': '#9ca3af',
        
        // Border
        border: {
          DEFAULT: '#dbe6df',
          dark: '#2a4234',
        },
        
        // Risk Categories
        risk: {
          'a': { bg: '#fee2e2', text: '#b91c1c' },
          'b-plus': { bg: '#ffedd5', text: '#c2410c' },
          'b': { bg: '#fef3c7', text: '#b45309' },
          'c': { bg: '#dcfce7', text: '#15803d' },
          'd': { bg: '#dbeafe', text: '#1d4ed8' },
          'e': { bg: '#f3f4f6', text: '#374151' },
          'f': { bg: '#d1fae5', text: '#047857' },
        },
      },
      
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      
      boxShadow: {
        'primary': '0 4px 14px 0 rgba(17, 212, 82, 0.3)',
      },
    },
  },
  plugins: [
    forms({
      strategy: 'class', // Use class strategy for form styling
    }),
  ],
};
```

### 6.7 Class Migration Table

| Old Pattern | New Pattern | Notes |
|-------------|-------------|-------|
| `bg-[#f6f8f6]` | `bg-background` | Use token |
| `bg-white dark:bg-[#1c2e22]` | `bg-surface dark:bg-surface-dark` | Use token |
| `text-[#111813]` | `text-text-main` | Use token |
| `text-[#61896f]` | `text-text-secondary` | Use token |
| `border-[#dbe6df]` | `border-border` | Use token |
| `bg-[#11d452]` | `bg-primary` | Use token |
| `hover:bg-[#0eb646]` | `hover:bg-primary-hover` | Use token |
| `bg-green-50` (for active nav) | `bg-primary/10` | Consistent primary tint |
| `text-green-700` (for active nav) | `text-primary` | Consistent primary |

---

## Section 7 — Phased Execution Breakdown

### Phase 1: Project Setup & Build Pipeline

**Duration:** Initial setup

**Objectives:**
- Set up React project with Vite
- Configure Tailwind CSS with build pipeline
- Establish folder structure
- Configure linting and formatting

**Deliverables:**
- [ ] Initialized Vite + React project
- [ ] Tailwind CSS configured with custom theme
- [ ] ESLint + Prettier configured
- [ ] Folder structure created
- [ ] Base CSS with font imports
- [ ] Theme context for dark mode

**Tasks:**
1. Create Vite project with React template
2. Install and configure Tailwind CSS v4
3. Create `tailwind.config.js` with design tokens
4. Set up ESLint with React plugin
5. Configure Prettier
6. Create folder structure
7. Set up path aliases (@/ for src/)
8. Create ThemeContext for dark mode toggle
9. Add Inter font from Google Fonts

**Dependencies:** None

---

### Phase 2: Component Library (UI Kit)

**Duration:** After Phase 1

**Objectives:**
- Build all shared UI components
- Create comprehensive props API
- Document component variants

**Deliverables:**
- [ ] Button component (all variants)
- [ ] Input component with validation
- [ ] Textarea component
- [ ] Select component
- [ ] Checkbox and RadioGroup
- [ ] Card component
- [ ] Badge component
- [ ] Table component (basic)
- [ ] Modal component
- [ ] Alert/Banner component
- [ ] Avatar component
- [ ] Breadcrumb component
- [ ] ProgressBar and ProgressStepper
- [ ] Pagination component
- [ ] Accordion component
- [ ] FileUpload component
- [ ] Tooltip component
- [ ] Dropdown component

**Tasks:**
1. Create `utils/cn.js` for class merging utility
2. Build each UI component with:
   - Component file
   - Props TypeScript/JSDoc documentation
   - Variant support via props
   - Dark mode support
3. Create barrel exports (index.js)
4. Test components in isolation

**Dependencies:** Phase 1 complete

---

### Phase 3: Layout Components & Routing

**Duration:** After Phase 2

**Objectives:**
- Build all layout components
- Implement React Router
- Create navigation structure

**Deliverables:**
- [ ] AuthLayout component
- [ ] MainLayout component
- [ ] ProjectLayout component
- [ ] Header component
- [ ] MainSidebar component
- [ ] ProjectSidebar component
- [ ] MobileMenu component
- [ ] Route configuration
- [ ] Protected route wrapper (placeholder)

**Tasks:**
1. Create AuthLayout (centered card)
2. Create MainLayout with sidebar and header
3. Create ProjectLayout with project sidebar
4. Build Header with logo and user menu
5. Build MainSidebar navigation
6. Build ProjectSidebar with workflow navigation
7. Create responsive MobileMenu
8. Configure React Router with nested routes
9. Create route constants file
10. Test layout switching between routes

**Dependencies:** Phase 2 complete

---

### Phase 4: Auth & Dashboard Domain

**Duration:** After Phase 3

**Objectives:**
- Convert auth pages
- Convert dashboard pages

**Deliverables:**
- [ ] LoginPage
- [ ] DashboardPage with metric cards
- [ ] ProjectListPage with table
- [ ] ProjectCreatePage with form

**Tasks:**
1. Convert LoginPage with form validation
2. Create DashboardPage with:
   - Metric cards (Total, In Progress, High Risk, Monitoring Due)
   - Latest projects list
3. Create ProjectListPage with:
   - Search input
   - Filter dropdowns
   - Projects table with progress indicators
   - Pagination
4. Create ProjectCreatePage with:
   - Project form
   - Date pickers
   - Description textarea
5. Create mock data for projects

**Dependencies:** Phase 3 complete

---

### Phase 5: Project Workspace — Overview & Screening

**Duration:** After Phase 4

**Objectives:**
- Convert project workspace pages
- Build screening workflow

**Deliverables:**
- [ ] ProjectOverviewPage
- [ ] ScreeningFormPage
- [ ] ScreeningSummaryPage
- [ ] Domain-specific components

**Tasks:**
1. Create ProjectOverviewPage with:
   - Project header with status
   - Progress timeline
   - Metric cards
   - CTA card for next action
2. Create ScreeningFormPage with:
   - Form sections (Info, Risk Category, Impacts)
   - Radio group for categories
   - Textarea for justification
3. Create ScreeningSummaryPage with:
   - Read-only summary view
   - Approval form section
   - Print-friendly layout
4. Build ProjectProgressBar component
5. Build RiskCategoryBadge component

**Dependencies:** Phase 4 complete

---

### Phase 6: Project Workspace — Assessment

**Duration:** After Phase 5

**Objectives:**
- Convert all assessment pages
- Build impact scoring components

**Deliverables:**
- [ ] AssessmentGatewayPage
- [ ] AssessmentMetadataPage
- [ ] AssessmentMethodsPage
- [ ] AssessmentScoringPage
- [ ] AssessmentReviewPage
- [ ] Impact scoring components

**Tasks:**
1. Create AssessmentGatewayPage with:
   - Start assessment CTA
   - Project context sidebar
2. Create AssessmentMetadataPage with:
   - Read-only project info
   - Editable description fields
3. Create AssessmentMethodsPage with:
   - Checkbox list with conditional inputs
   - Assessment methods section
   - Community consultation section
4. Create AssessmentScoringPage with:
   - Collapsible category accordions
   - Impact rating selects
   - Notes textareas
   - Score summary
5. Create AssessmentReviewPage with:
   - Full assessment review
   - Approval form
6. Build ImpactCategoryAccordion component
7. Build ImpactScoreMatrix component

**Dependencies:** Phase 5 complete

---

### Phase 7: Project Workspace — SEMP

**Duration:** After Phase 6

**Objectives:**
- Convert SEMP pages
- Build Excel-like table components

**Deliverables:**
- [ ] SempOverviewPage
- [ ] ManagementActivitiesPage
- [ ] MitigationPlanPage
- [ ] Editable table components

**Tasks:**
1. Create SempOverviewPage with:
   - Tool 3 and Tool 4 cards
   - Status indicators
   - Navigation CTAs
2. Create ManagementActivitiesPage with:
   - Editable spreadsheet-style table
   - Add row functionality
   - Inline editing
3. Create MitigationPlanPage with:
   - Similar table structure
   - Different column configuration
4. Build ManagementActivitiesTable component
5. Build MitigationPlanTable component
6. Implement table row CRUD operations

**Dependencies:** Phase 6 complete

---

### Phase 8: Project Workspace — Monitoring & Files

**Duration:** After Phase 7

**Objectives:**
- Convert monitoring pages
- Convert files/annex pages

**Deliverables:**
- [ ] MonitoringOverviewPage
- [ ] MonitoringDataEntryPage
- [ ] ProjectFilesPage
- [ ] AnnexOverviewPage
- [ ] Monitoring components

**Tasks:**
1. Create MonitoringOverviewPage with:
   - Progress timeline
   - Category summary cards
2. Create MonitoringDataEntryPage with:
   - Expandable category sections
   - Editable data tables
   - Quarter columns
3. Create ProjectFilesPage with:
   - File category accordions
   - File list table
   - Upload functionality
4. Create AnnexOverviewPage with:
   - Reference content table
5. Build MonitoringCategoryCard component
6. Build MonitoringDataTable component
7. Build FileListTable component

**Dependencies:** Phase 7 complete

---

### Phase 9: QA & Consistency

**Duration:** After Phase 8

**Objectives:**
- Cross-browser testing
- Responsive testing
- Accessibility audit
- Consistency review

**Deliverables:**
- [ ] Responsive layouts verified
- [ ] Dark mode verified
- [ ] Accessibility audit report
- [ ] Bug fixes

**Tasks:**
1. Test all pages on:
   - Desktop (1920px, 1440px, 1280px)
   - Tablet (768px, 1024px)
   - Mobile (375px, 414px)
2. Test dark mode on all pages
3. Run accessibility audit (aXe, Lighthouse)
4. Fix WCAG violations
5. Test keyboard navigation
6. Test screen reader compatibility
7. Cross-browser testing (Chrome, Firefox, Safari, Edge)
8. Fix any visual inconsistencies

**Dependencies:** Phase 8 complete

---

## Section 8 — Best Practices & Conventions

### 8.1 Naming Conventions

#### Files & Folders

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Button.jsx`, `ProjectCard.jsx` |
| Pages | PascalCase + "Page" suffix | `DashboardPage.jsx` |
| Hooks | camelCase + "use" prefix | `useLocalStorage.js` |
| Utils | camelCase | `formatters.js`, `cn.js` |
| Constants | camelCase or SCREAMING_SNAKE | `routes.config.js`, `ROUTES` |
| Contexts | PascalCase + "Context" suffix | `ThemeContext.jsx` |

#### Components

| Type | Convention | Example |
|------|------------|---------|
| Component name | PascalCase | `ProjectCard` |
| Props | camelCase | `isLoading`, `onClick` |
| Boolean props | is/has/should prefix | `isDisabled`, `hasError` |
| Event handlers | on + Event | `onSubmit`, `onChange` |
| CSS classes | kebab-case (via Tailwind) | `bg-primary`, `text-text-main` |

#### Variables

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `projectList`, `currentUser` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL`, `MAX_FILE_SIZE` |
| Private/internal | underscore prefix | `_internalState` |

### 8.2 Component Design Patterns

#### Component Structure

```jsx
// Button.jsx

import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

/**
 * Button component with multiple variants
 * @param {Object} props
 * @param {'primary'|'secondary'|'outline'|'ghost'} props.variant
 * @param {'sm'|'md'|'lg'} props.size
 * @param {boolean} props.disabled
 * @param {boolean} props.loading
 * @param {React.ReactNode} props.icon
 * @param {React.ReactNode} props.children
 */
const Button = forwardRef(({ 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className,
  children,
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all';
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-primary',
    secondary: 'bg-surface border border-border hover:bg-background text-text-main',
    outline: 'border border-primary text-primary hover:bg-primary/10',
    ghost: 'text-text-secondary hover:text-text-main hover:bg-background',
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading && <LoadingSpinner size={size} />}
      {!loading && icon}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
```

#### Compound Components Pattern

```jsx
// Card.jsx

import { cn } from '@/utils/cn';

function Card({ className, children, ...props }) {
  return (
    <div 
      className={cn(
        'bg-surface dark:bg-surface-dark rounded-xl border border-border shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }) {
  return (
    <div 
      className={cn('px-6 py-4 border-b border-border', className)} 
      {...props}
    >
      {children}
    </div>
  );
}

function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }) {
  return (
    <div 
      className={cn('px-6 py-4 border-t border-border bg-background/50', className)} 
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
```

### 8.3 Styling Approach

#### Class Name Utility

```javascript
// utils/cn.js

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

#### Styling Guidelines

1. **Use Tailwind utilities** for all styling
2. **Extract repeated patterns** into component variants
3. **Use `cn()` utility** for conditional classes
4. **Follow mobile-first** responsive approach
5. **Support dark mode** with `dark:` variants
6. **Avoid inline styles** except for dynamic values (e.g., background-image)

### 8.4 Accessibility Guidelines

| Requirement | Implementation |
|-------------|----------------|
| **Semantic HTML** | Use appropriate elements (`button`, `nav`, `main`, `section`) |
| **ARIA Labels** | Add `aria-label` for icon-only buttons |
| **Focus Management** | Visible focus states, logical tab order |
| **Color Contrast** | Minimum 4.5:1 for text, 3:1 for large text |
| **Screen Readers** | Add `sr-only` labels where needed |
| **Keyboard Navigation** | All interactive elements keyboard accessible |
| **Form Labels** | Associate labels with inputs via `htmlFor` |
| **Error Messages** | Use `aria-describedby` for validation errors |
| **Skip Links** | Add skip-to-content link |

### 8.5 Import Organization

```jsx
// Recommended import order

// 1. React and React-related
import { useState, useEffect, forwardRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// 2. Third-party libraries
import { clsx } from 'clsx';

// 3. Internal components
import { Button, Card, Input } from '@/components/ui';
import { Header, Sidebar } from '@/components/layout';

// 4. Hooks
import { useLocalStorage } from '@/hooks';

// 5. Utils and helpers
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/formatters';

// 6. Data and constants
import { ROUTES } from '@/routes/routes.config';
import { mockProjects } from '@/data';

// 7. Styles (if any)
import './ComponentName.css';
```

### 8.6 State Management Guidelines

For this phase (without API integration):

| Scope | Solution |
|-------|----------|
| **Component State** | `useState` |
| **Form State** | `useState` or consider React Hook Form for complex forms |
| **Theme/Auth** | React Context |
| **URL State** | React Router (params, search params) |
| **Derived State** | `useMemo` |

### 8.7 Error Handling

```jsx
// Pattern for form validation

function ProjectForm() {
  const [errors, setErrors] = useState({});
  
  const validate = (values) => {
    const errors = {};
    
    if (!values.title?.trim()) {
      errors.title = 'Project title is required';
    }
    
    if (!values.location?.trim()) {
      errors.location = 'Location is required';
    }
    
    return errors;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validate(formData);
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    // Submit logic
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Project Title"
        error={errors.title}
        // ...
      />
    </form>
  );
}
```

---

## Section 9 — Deliverables Summary

### Phase-by-Phase Deliverables Checklist

#### Phase 1: Project Setup ✅ مكتمل
- [x] Vite + React project initialized
- [x] Tailwind CSS v4 configured
- [x] Custom theme tokens in CSS (@theme)
- [x] ESLint + Prettier configured
- [x] Folder structure created
- [x] Path aliases configured (@/)
- [x] ThemeContext implemented
- [x] Base CSS with fonts (Inter + Material Symbols)

#### Phase 2: Component Library ✅ مكتمل
- [x] 20+ UI components built
- [x] All components support dark mode
- [x] Barrel exports for components
- [x] Component variants via props

#### Phase 3: Layouts & Routing ✅ مكتمل
- [x] 3 layout components (AuthLayout, MainLayout, ProjectLayout)
- [x] 4 navigation components (Header, MainSidebar, ProjectSidebar, MobileMenu)
- [x] React Router v7 configured
- [x] 25+ routes defined
- [x] Route constants file
- [x] ProtectedRoute placeholder
- [x] useProjectContext hook
- [x] Project header unified (ESMS System logo on left)
- [x] Theme toggle moved to user card dropdown
- [x] All workflow tools unlocked (temporary - TODO for future locking logic)

#### Phase 4: Auth & Dashboard ✅ مكتمل
- [x] LoginPage
- [x] DashboardPage
- [x] ProjectListPage
- [x] ProjectCreatePage
- [x] Mock data files (5 ملفات متوافقة مع Backend)
- [x] Utils files (validators.js, formatters.js)
- [x] Dashboard components (5 مكونات)

#### Phase 5: Screening ✅ مكتمل
- [x] ProjectOverviewPage
- [x] ScreeningFormPage
- [x] ScreeningSummaryPage
- [x] 5 project components (ProjectHeader, ProjectProgressTimeline, ProjectMetricCard, ProjectCTACard, ProjectSiteCard)
- [x] 5 screening components (ScreeningInfoSection, RiskCategorySelector, ImpactSection, ScreeningSummaryCard, ApprovalSection)
- [x] Mock screening data (mockScreening.js)
- [x] useScreening hook

#### Phase 6: Assessment
- [ ] AssessmentGatewayPage
- [ ] AssessmentMetadataPage
- [ ] AssessmentMethodsPage
- [ ] AssessmentScoringPage
- [ ] AssessmentReviewPage
- [ ] 3 assessment components

#### Phase 7: SEMP
- [ ] SempOverviewPage
- [ ] ManagementActivitiesPage
- [ ] MitigationPlanPage
- [ ] 2 table components

#### Phase 8: Monitoring & Files
- [ ] MonitoringOverviewPage
- [ ] MonitoringDataEntryPage
- [ ] ProjectFilesPage
- [ ] AnnexOverviewPage
- [ ] 3 monitoring/file components

#### Phase 9: QA
- [ ] Responsive testing complete
- [ ] Dark mode verified
- [ ] Accessibility audit passed
- [ ] Cross-browser testing complete
- [ ] All bugs fixed

### Final Output Metrics

| Metric | Count |
|--------|-------|
| **Total Pages** | 19 |
| **Layout Components** | 7 |
| **UI Components** | 20+ |
| **Domain Components** | 15+ |
| **Routes** | 25+ |
| **Phases** | 9 |

---

## Appendix: Page-to-Component Mapping

| Static HTML File | React Page | Layout |
|-----------------|------------|--------|
| `1.LoginPage.html` | `LoginPage` | AuthLayout |
| `5.DashboardPage.html` | `DashboardPage` | MainLayout |
| `6.ProjectList.html` | `ProjectListPage` | MainLayout |
| `7.CreateNewProject.html` | `ProjectCreatePage` | MainLayout |
| `8.ProjectOverview.html` | `ProjectOverviewPage` | ProjectLayout |
| `9.EnvironmentalScreening.html` | `ScreeningFormPage` | ProjectLayout |
| `10.ScreeningSummary.html` | `ScreeningSummaryPage` | ProjectLayout |
| `11.EnvironmentalAssessmentGateway.html` | `AssessmentGatewayPage` | ProjectLayout |
| `12.EnvironmentalAssessmentMetadata.html` | `AssessmentMetadataPage` | ProjectLayout |
| `13.AssessmentMethods&Consultation.html` | `AssessmentMethodsPage` | ProjectLayout |
| `14.Impact Assessment Scoring.html` | `AssessmentScoringPage` | ProjectLayout |
| `15.Assessment Review and Approval.html` | `AssessmentReviewPage` | ProjectLayout |
| `16.ESM Plan Overview.html` | `SempOverviewPage` | ProjectLayout |
| `17.Management Activities Table.html` | `ManagementActivitiesPage` | ProjectLayout |
| `18.Impact Mitigation and Enhancement Plan.html` | `MitigationPlanPage` | ProjectLayout |
| `20.Monitoring Overview.html` | `MonitoringOverviewPage` | ProjectLayout |
| `21.Monitoring Data Entry.html` | `MonitoringDataEntryPage` | ProjectLayout |
| `22.Project Files and Records.html` | `ProjectFilesPage` | ProjectLayout |
| `23.Annex and Attachments Overview.html` | `AnnexOverviewPage` | ProjectLayout |

---

*Document created: January 22, 2026*
*Author: Architect Agent*
*Version: 1.0*
