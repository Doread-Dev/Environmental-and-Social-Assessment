# Phase 3: Layout Components & Routing
## خطة تفصيلية مرتبة

---

## نظرة عامة على المرحلة

**الهدف الرئيسي:** بناء جميع مكونات Layout وتنفيذ نظام التوجيه (Routing) باستخدام React Router

**المتطلبات السابقة:** إكمال Phase 1 و Phase 2

**المخرجات النهائية:**
- مكون AuthLayout (تخطيط صفحة تسجيل الدخول)
- مكون MainLayout (تخطيط Dashboard والمشاريع)
- مكون ProjectLayout (تخطيط مساحة عمل المشروع)
- مكون Header (شريط التنقل العلوي)
- مكون MainSidebar (الشريط الجانبي الرئيسي)
- مكون ProjectSidebar (الشريط الجانبي للمشروع)
- مكون MobileMenu (قائمة الهاتف المحمول)
- تكوين React Router مع المسارات المتداخلة
- ملف ثوابت المسارات
- مكون ProtectedRoute (placeholder للمصادقة المستقبلية)

---

## الخطوة 1: تثبيت React Router

### 1.1 تثبيت الحزمة

```bash
cd frontend

# تثبيت React Router DOM
npm install react-router-dom
```

### 1.2 التحقق من التثبيت

```bash
# التحقق من إضافة الحزمة في package.json
npm list react-router-dom
```

**النتيجة المتوقعة:**
```
frontend@0.0.0
└── react-router-dom@7.x.x
```

---

## الخطوة 2: إنشاء ملف ثوابت المسارات

### 2.1 إنشاء routes.config.js

**إنشاء ملف `src/routes/routes.config.js`:**

```javascript
/**
 * Application Route Constants
 * Centralized route definitions for the ESMS application
 */

export const ROUTES = {
  // ==========================================
  // Auth Routes
  // ==========================================
  LOGIN: '/login',
  
  // ==========================================
  // Main App Routes
  // ==========================================
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  PROJECTS: '/app/projects',
  PROJECT_NEW: '/app/projects/new',
  
  // ==========================================
  // Project Workspace Routes (dynamic :projectId)
  // ==========================================
  PROJECT_BASE: '/app/projects/:projectId',
  PROJECT_OVERVIEW: '/app/projects/:projectId/overview',
  
  // Screening (Tool 1)
  SCREENING: '/app/projects/:projectId/screening',
  SCREENING_SUMMARY: '/app/projects/:projectId/screening/summary',
  
  // Assessment (Tool 2)
  ASSESSMENT: '/app/projects/:projectId/assessment',
  ASSESSMENT_METADATA: '/app/projects/:projectId/assessment/metadata',
  ASSESSMENT_METHODS: '/app/projects/:projectId/assessment/methods',
  ASSESSMENT_SCORING: '/app/projects/:projectId/assessment/scoring',
  ASSESSMENT_REVIEW: '/app/projects/:projectId/assessment/review',
  
  // SEMP (Tools 3 & 4)
  SEMP: '/app/projects/:projectId/semp',
  SEMP_ACTIVITIES: '/app/projects/:projectId/semp/activities',
  SEMP_MITIGATION: '/app/projects/:projectId/semp/mitigation',
  
  // Monitoring (Tool 5)
  MONITORING: '/app/projects/:projectId/monitoring',
  MONITORING_DATA: '/app/projects/:projectId/monitoring/data-entry',
  
  // Files & Annex
  PROJECT_FILES: '/app/projects/:projectId/files',
  PROJECT_ANNEX: '/app/projects/:projectId/annex',
}

/**
 * Helper function to generate project-specific routes
 * @param {string} projectId - The project ID
 * @param {string} route - The route constant with :projectId placeholder
 * @returns {string} - The resolved route path
 * 
 * @example
 * getProjectRoute('123', ROUTES.PROJECT_OVERVIEW)
 * // Returns: '/app/projects/123/overview'
 */
export function getProjectRoute(projectId, route) {
  return route.replace(':projectId', projectId)
}

/**
 * Navigation items for MainSidebar
 */
export const MAIN_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: ROUTES.DASHBOARD,
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: 'folder_open',
    path: ROUTES.PROJECTS,
  },
]

/**
 * Navigation items for ProjectSidebar - Workflow Tools
 */
export const PROJECT_WORKFLOW_NAV = [
  {
    id: 'overview',
    label: 'Project Overview',
    icon: 'dashboard',
    path: 'overview',
    filled: true,
  },
  {
    id: 'screening',
    label: 'Screening – Tool 1',
    icon: 'check_circle',
    path: 'screening',
    children: [
      { id: 'screening-form', label: 'Screening Form', path: 'screening' },
      { id: 'screening-summary', label: 'Summary', path: 'screening/summary' },
    ],
  },
  {
    id: 'assessment',
    label: 'Assessment – Tool 2',
    icon: 'assessment',
    path: 'assessment',
    children: [
      { id: 'assessment-gateway', label: 'Gateway', path: 'assessment' },
      { id: 'assessment-metadata', label: 'Metadata', path: 'assessment/metadata' },
      { id: 'assessment-methods', label: 'Methods', path: 'assessment/methods' },
      { id: 'assessment-scoring', label: 'Scoring', path: 'assessment/scoring' },
      { id: 'assessment-review', label: 'Review', path: 'assessment/review' },
    ],
  },
  {
    id: 'semp',
    label: 'SEMP – Tools 3 & 4',
    icon: 'edit_document',
    path: 'semp',
    children: [
      { id: 'semp-overview', label: 'Overview', path: 'semp' },
      { id: 'semp-activities', label: 'Activities', path: 'semp/activities' },
      { id: 'semp-mitigation', label: 'Mitigation', path: 'semp/mitigation' },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring – Tool 5',
    icon: 'monitoring',
    path: 'monitoring',
    children: [
      { id: 'monitoring-overview', label: 'Overview', path: 'monitoring' },
      { id: 'monitoring-data', label: 'Data Entry', path: 'monitoring/data-entry' },
    ],
  },
]

/**
 * Secondary navigation items for ProjectSidebar
 */
export const PROJECT_SECONDARY_NAV = [
  {
    id: 'files',
    label: 'Project Files',
    icon: 'folder_open',
    path: 'files',
  },
  {
    id: 'annex',
    label: 'Annex & Attachments',
    icon: 'attach_file',
    path: 'annex',
  },
]
```

---

## الخطوة 3: إنشاء مكون AuthLayout

### 3.1 وصف المكون

**AuthLayout** هو تخطيط بسيط مركزي لصفحات المصادقة (Login). يعرض محتوى الصفحة في منتصف الشاشة مع خلفية مميزة.

### 3.2 إنشاء الملف

**إنشاء `src/components/layout/AuthLayout.jsx`:**

```javascript
import { Outlet } from 'react-router-dom'
import { cn } from '@/utils'

/**
 * AuthLayout - Layout for authentication pages (Login, etc.)
 * Centered card layout with decorative background
 */
function AuthLayout({ className }) {
  return (
    <div
      className={cn(
        'min-h-screen w-full',
        'bg-background dark:bg-background-dark',
        'flex items-center justify-center',
        'p-4 sm:p-6 lg:p-8',
        'transition-colors duration-300',
        className
      )}
    >
      {/* Background Pattern */}
      <div 
        className="fixed inset-0 opacity-5 dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 w-full">
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout
```

---

## الخطوة 4: إنشاء مكون Header

### 4.1 وصف المكون

**Header** هو شريط التنقل العلوي المشترك بين MainLayout و ProjectLayout. يحتوي على:
- زر القائمة للموبايل
- الشعار (للموبايل)
- معلومات المستخدم
- زر تبديل الوضع المظلم

### 4.2 إنشاء الملف

**إنشاء `src/components/layout/Header.jsx`:**

```javascript
import { useState } from 'react'
import { cn } from '@/utils'
import { useTheme } from '@/contexts'
import { Button, Avatar, Dropdown } from '@/components/ui'

/**
 * Header Component
 * Top navigation bar with user profile and actions
 * 
 * @param {Object} props
 * @param {Function} props.onMenuClick - Callback for mobile menu toggle
 * @param {boolean} props.showMobileMenu - Whether to show mobile menu button
 * @param {string} props.className - Additional CSS classes
 */
function Header({ 
  onMenuClick, 
  showMobileMenu = true,
  className 
}) {
  const { isDark, toggleTheme } = useTheme()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  
  // Mock user data (will be replaced with real auth data)
  const user = {
    name: 'Sarah Jenkins',
    role: 'Programme Manager',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA52tcJunHAhhNIJhwfqL97jYLTGmUSuxY1_GSq3m2_NitXeBriNHT2vsga1wvUIExbM0f02SY8gqpZMQqipeYkxUMWZpVPdpPyXQFCpmCVqUasUIy7l-LskaJ6NDq8ZD-vkl6Ikc3PIda1PG3cbVPnKhYj05d6Qy0oMqftfSep-hrauSQYJ5kYoxH8i_FqBoh9ksg5hmmZIDcIhA9uMMFZqB1nKU6XMRmJV3XVXfQIDb6kkSH-IJWCnJgbDuKRuD_QCqAnrQHjN2Ik',
  }

  const userMenuItems = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'divider', type: 'divider' },
    { id: 'logout', label: 'Sign Out', icon: 'logout' },
  ]

  return (
    <header
      className={cn(
        'h-16 shrink-0',
        'bg-surface dark:bg-surface-dark',
        'border-b border-border-default dark:border-border-dark',
        'flex items-center justify-between',
        'px-4 sm:px-6 lg:px-8',
        'z-20',
        className
      )}
    >
      {/* Left Section - Mobile Menu & Logo */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        {showMobileMenu && (
          <button
            onClick={onMenuClick}
            className={cn(
              'lg:hidden',
              'p-2 -ml-2 rounded-lg',
              'text-text-main dark:text-white',
              'hover:bg-background dark:hover:bg-background-dark',
              'transition-colors'
            )}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}

        {/* Mobile Logo */}
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex items-center justify-center size-8 rounded-xl bg-primary text-white">
            <span className="material-symbols-outlined text-xl">eco</span>
          </div>
          <h2 className="text-lg font-bold text-text-main dark:text-white tracking-tight">
            ESMS
          </h2>
        </div>
      </div>

      {/* Right Section - Actions & User */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'p-2 rounded-lg',
            'text-text-secondary dark:text-gray-400',
            'hover:text-text-main dark:hover:text-white',
            'hover:bg-background dark:hover:bg-background-dark',
            'transition-colors'
          )}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span className="material-symbols-outlined">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notifications (placeholder) */}
        <button
          className={cn(
            'p-2 rounded-lg relative',
            'text-text-secondary dark:text-gray-400',
            'hover:text-text-main dark:hover:text-white',
            'hover:bg-background dark:hover:bg-background-dark',
            'transition-colors'
          )}
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          {/* Notification Badge */}
          <span className="absolute top-1.5 right-1.5 size-2 bg-error rounded-full" />
        </button>

        {/* Divider */}
        <div className="hidden sm:block h-8 w-px bg-border-default dark:bg-border-dark" />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={cn(
              'flex items-center gap-3',
              'pl-2 pr-1 py-1 -mr-1',
              'rounded-lg',
              'hover:bg-background dark:hover:bg-background-dark',
              'transition-colors'
            )}
          >
            {/* User Info - Hidden on mobile */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-text-main dark:text-white leading-none">
                {user.name}
              </p>
              <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">
                {user.role}
              </p>
            </div>
            
            {/* Avatar */}
            <Avatar 
              src={user.avatar} 
              alt={user.name}
              size="md"
              className="ring-2 ring-white dark:ring-surface-dark"
            />
          </button>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setIsUserMenuOpen(false)}
              />
              
              {/* Menu */}
              <div
                className={cn(
                  'absolute right-0 top-full mt-2 z-20',
                  'w-56 py-2',
                  'bg-surface dark:bg-surface-dark',
                  'border border-border-default dark:border-border-dark',
                  'rounded-xl shadow-lg',
                  'animate-slide-in'
                )}
              >
                {/* User Info in Menu */}
                <div className="px-4 py-3 border-b border-border-default dark:border-border-dark sm:hidden">
                  <p className="text-sm font-semibold text-text-main dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">
                    {user.role}
                  </p>
                </div>
                
                {userMenuItems.map((item) => {
                  if (item.type === 'divider') {
                    return (
                      <div 
                        key={item.id}
                        className="my-2 border-t border-border-default dark:border-border-dark"
                      />
                    )
                  }
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        // Handle action
                      }}
                      className={cn(
                        'w-full flex items-center gap-3',
                        'px-4 py-2.5',
                        'text-sm text-text-secondary dark:text-gray-400',
                        'hover:text-text-main dark:hover:text-white',
                        'hover:bg-background dark:hover:bg-background-dark',
                        'transition-colors',
                        item.id === 'logout' && 'text-error hover:text-error'
                      )}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
```

---

## الخطوة 5: إنشاء مكون MainSidebar

### 5.1 وصف المكون

**MainSidebar** هو الشريط الجانبي الرئيسي للتنقل بين Dashboard والمشاريع.

### 5.2 إنشاء الملف

**إنشاء `src/components/layout/MainSidebar.jsx`:**

```javascript
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/utils'
import { MAIN_NAV_ITEMS, ROUTES } from '@/routes/routes.config'

/**
 * MainSidebar Component
 * Main navigation sidebar for Dashboard and Projects
 * 
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 */
function MainSidebar({ className }) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        'w-[280px] lg:w-[300px]',
        'hidden lg:flex flex-col',
        'h-full flex-shrink-0',
        'bg-surface dark:bg-surface-dark',
        'border-r border-border-default dark:border-border-dark',
        className
      )}
    >
      {/* Logo Section */}
      <div className="p-6">
        <div className="flex items-center gap-3 px-2">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-white shadow-primary">
            <span className="material-symbols-outlined text-2xl">eco</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-tight text-text-main dark:text-white">
              ESMS System
            </h1>
            <p className="text-text-secondary text-xs font-medium">
              Internal Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4">
        <div className="flex flex-col gap-1">
          {MAIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3',
                  'px-4 py-3 rounded-lg',
                  'text-sm font-medium',
                  'transition-colors duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-main hover:bg-background dark:hover:bg-background-dark'
                )
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer Section */}
      <div className="mt-auto border-t border-border-default dark:border-border-dark p-4">
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3',
              'px-4 py-3 rounded-lg',
              'text-sm font-medium',
              'transition-colors duration-200',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:text-text-main hover:bg-background dark:hover:bg-background-dark'
            )
          }
        >
          <span className="material-symbols-outlined">settings</span>
          Settings
        </NavLink>
      </div>
    </aside>
  )
}

export default MainSidebar
```

---

## الخطوة 6: إنشاء مكون ProjectSidebar

### 6.1 وصف المكون

**ProjectSidebar** هو الشريط الجانبي الخاص بمساحة عمل المشروع، يحتوي على:
- زر العودة إلى Dashboard
- معلومات المشروع
- قائمة أدوات سير العمل (Workflow Tools)
- روابط ثانوية (Files, Annex)
- معلومات المستخدم

### 6.2 إنشاء الملف

**إنشاء `src/components/layout/ProjectSidebar.jsx`:**

```javascript
import { NavLink, useParams, useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/utils'
import { 
  PROJECT_WORKFLOW_NAV, 
  PROJECT_SECONDARY_NAV, 
  ROUTES,
  getProjectRoute 
} from '@/routes/routes.config'
import { Avatar } from '@/components/ui'

/**
 * ProjectSidebar Component
 * Project workspace navigation with workflow tools
 * 
 * @param {Object} props
 * @param {Object} props.project - Project data object
 * @param {string} props.className - Additional CSS classes
 */
function ProjectSidebar({ project, className }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // Mock project data (will be replaced with real data)
  const projectData = project || {
    id: projectId,
    name: 'Reforestation Initiative Alpha',
    location: 'Sumatra, Indonesia',
    status: 'in_progress',
    completedSteps: ['screening', 'assessment'],
  }

  // Mock user data
  const user = {
    name: 'Alex Morgan',
    role: 'Environmental Officer',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtra6pj5M5oTyJp1GdJWuU63rsELKvVKe4fboOS02kUTaVf4ehAD_wchdxbPfoBzsc-L9HdsZm1dlAzW_598IOXygrITkCOb8PhtOGw5WVcDdF3hE96FbESF6OkZ6S4Qg8lCHAcfE56hrcA5qoUEuWFbxCSpY46m1nYJN2KV7pM5SvQP55_nYo7EqBZCnQnwrXRiHUeqB2sW7Jgr27PWEBt_NAf5J93MIG1HUbYa8YpgApira7wAky_Gj0olj2YRpwHmf8JlO4xcid',
  }

  // Check if a nav item is active
  const isNavActive = (path) => {
    const fullPath = `/app/projects/${projectId}/${path}`
    return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/')
  }

  // Check if a step is completed
  const isStepCompleted = (stepId) => {
    return projectData.completedSteps?.includes(stepId)
  }

  // Check if a step is locked (not accessible yet)
  const isStepLocked = (stepId) => {
    const stepOrder = ['screening', 'assessment', 'semp', 'monitoring']
    const stepIndex = stepOrder.indexOf(stepId)
    if (stepIndex === 0) return false
    
    const previousStep = stepOrder[stepIndex - 1]
    return !isStepCompleted(previousStep)
  }

  return (
    <aside
      className={cn(
        'w-[280px] lg:w-[300px]',
        'hidden lg:flex flex-col',
        'h-full flex-shrink-0',
        'bg-surface dark:bg-surface-dark',
        'border-r border-border-default dark:border-border-dark',
        className
      )}
    >
      {/* Back Button & Project Info */}
      <div className="px-5 pt-6 pb-2 shrink-0">
        {/* Back to Dashboard */}
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className={cn(
            'group flex items-center gap-3 w-full mb-6',
            'text-text-secondary hover:text-text-main',
            'dark:text-gray-400 dark:hover:text-white',
            'font-medium transition-all duration-200'
          )}
        >
          <div
            className={cn(
              'size-8 rounded-full',
              'bg-background dark:bg-background-dark',
              'border border-border-default dark:border-border-dark',
              'flex items-center justify-center',
              'group-hover:bg-surface group-hover:shadow-sm',
              'dark:group-hover:bg-surface-dark',
              'transition-all'
            )}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </div>
          <span>Back to Dashboard</span>
        </button>

        {/* Project Info Card */}
        <div
          className={cn(
            'bg-background dark:bg-background-dark',
            'border border-border-default dark:border-border-dark',
            'rounded-xl p-4 mb-2',
            'shadow-sm relative overflow-hidden'
          )}
        >
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-xl" />
          
          <div className="flex flex-col gap-1.5 relative z-10">
            <h2 className="text-sm font-bold text-text-main dark:text-white leading-tight">
              {projectData.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary dark:text-gray-400">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              <span>{projectData.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {/* Overview Link */}
        <NavLink
          to={`/app/projects/${projectId}/overview`}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3',
              'px-3 py-2.5 rounded-lg mb-5',
              'text-sm font-semibold',
              'border transition-colors',
              isActive
                ? 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:border-primary/30'
                : 'border-transparent hover:bg-background dark:hover:bg-background-dark'
            )
          }
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            dashboard
          </span>
          <span>Project Overview</span>
        </NavLink>

        {/* Workflow Tools Section */}
        <div className="px-3 mb-2 mt-2 flex items-center justify-between">
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            Workflow Tools
          </p>
        </div>

        {/* Workflow Navigation Items */}
        {PROJECT_WORKFLOW_NAV.filter(item => item.id !== 'overview').map((item) => {
          const isLocked = isStepLocked(item.id)
          const isCompleted = isStepCompleted(item.id)
          const isActive = isNavActive(item.path)

          if (isLocked) {
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3',
                  'px-3 py-2 rounded-lg',
                  'text-text-disabled dark:text-gray-600',
                  'cursor-not-allowed opacity-75'
                )}
              >
                <span className="material-symbols-outlined text-[20px]">lock</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            )
          }

          return (
            <NavLink
              key={item.id}
              to={`/app/projects/${projectId}/${item.path}`}
              className={cn(
                'flex items-center gap-3',
                'px-3 py-2 rounded-lg',
                'text-sm font-medium',
                'transition-colors',
                isActive
                  ? 'text-text-main dark:text-white bg-background dark:bg-background-dark border-l-4 border-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-main dark:hover:text-white'
              )}
            >
              <span 
                className={cn(
                  'material-symbols-outlined text-[20px]',
                  isCompleted && 'text-primary',
                  isActive && 'text-primary'
                )}
              >
                {isCompleted ? 'check_circle' : item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        {/* Divider */}
        <div className="my-5 border-t border-border-default dark:border-border-dark mx-2" />

        {/* Secondary Navigation */}
        {PROJECT_SECONDARY_NAV.map((item) => (
          <NavLink
            key={item.id}
            to={`/app/projects/${projectId}/${item.path}`}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 group',
                'px-3 py-2 rounded-lg',
                'text-sm font-medium',
                'transition-colors',
                isActive
                  ? 'text-text-main dark:text-white bg-background dark:bg-background-dark'
                  : 'text-text-secondary hover:text-text-main dark:hover:text-white hover:bg-background dark:hover:bg-background-dark'
              )
            }
          >
            <span className="material-symbols-outlined text-[20px] text-text-secondary group-hover:text-text-main dark:group-hover:text-gray-300">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer - User Info */}
      <div className="mt-auto bg-surface dark:bg-surface-dark border-t border-border-default dark:border-border-dark p-4 shrink-0">
        {/* Settings Link */}
        <NavLink
          to={`/app/projects/${projectId}/settings`}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3',
              'px-3 py-2 rounded-lg mb-2',
              'text-sm font-medium',
              'transition-colors',
              isActive
                ? 'text-text-main dark:text-white bg-background dark:bg-background-dark'
                : 'text-text-secondary hover:text-text-main dark:hover:text-white hover:bg-background dark:hover:bg-background-dark'
            )
          }
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span>Settings</span>
        </NavLink>

        {/* Divider */}
        <div className="h-px bg-border-default dark:bg-border-dark w-full my-3" />

        {/* User Info */}
        <div className="flex items-center gap-3 px-1">
          <Avatar 
            src={user.avatar} 
            alt={user.name}
            size="sm"
            className="ring-2 ring-border-default dark:ring-border-dark"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-text-main dark:text-white truncate">
              {user.name}
            </span>
            <span className="text-xs text-text-secondary dark:text-gray-400 truncate">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default ProjectSidebar
```

---

## الخطوة 7: إنشاء مكون MobileMenu

### 7.1 وصف المكون

**MobileMenu** هو قائمة منزلقة تظهر على الأجهزة المحمولة عند الضغط على زر القائمة.

### 7.2 إنشاء الملف

**إنشاء `src/components/layout/MobileMenu.jsx`:**

```javascript
import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/utils'
import { useTheme } from '@/contexts'
import { MAIN_NAV_ITEMS } from '@/routes/routes.config'

/**
 * MobileMenu Component
 * Slide-out navigation menu for mobile devices
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the menu is open
 * @param {Function} props.onClose - Callback to close the menu
 * @param {'main' | 'project'} props.variant - Menu variant
 * @param {Object} props.project - Project data (for project variant)
 */
function MobileMenu({ 
  isOpen, 
  onClose, 
  variant = 'main',
  project 
}) {
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()

  // Close menu on route change
  useEffect(() => {
    onClose()
  }, [location.pathname, onClose])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          'bg-black/50 backdrop-blur-sm',
          'transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 lg:hidden',
          'w-[280px] max-w-[85vw]',
          'bg-surface dark:bg-surface-dark',
          'shadow-2xl',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-default dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-white">
                <span className="material-symbols-outlined text-2xl">eco</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold leading-tight text-text-main dark:text-white">
                  ESMS
                </h1>
                <p className="text-text-secondary text-xs font-medium">
                  Internal Portal
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-lg',
                'text-text-secondary hover:text-text-main',
                'dark:text-gray-400 dark:hover:text-white',
                'hover:bg-background dark:hover:bg-background-dark',
                'transition-colors'
              )}
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-1">
              {MAIN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3',
                      'px-4 py-3 rounded-lg',
                      'text-base font-medium',
                      'transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:text-text-main hover:bg-background dark:hover:bg-background-dark'
                    )
                  }
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-border-default dark:border-border-dark p-4 space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                'w-full flex items-center gap-3',
                'px-4 py-3 rounded-lg',
                'text-base font-medium',
                'text-text-secondary hover:text-text-main',
                'dark:text-gray-400 dark:hover:text-white',
                'hover:bg-background dark:hover:bg-background-dark',
                'transition-colors'
              )}
            >
              <span className="material-symbols-outlined">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>

            {/* Settings */}
            <NavLink
              to="/app/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3',
                  'px-4 py-3 rounded-lg',
                  'text-base font-medium',
                  'transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-main hover:bg-background dark:hover:bg-background-dark'
                )
              }
            >
              <span className="material-symbols-outlined">settings</span>
              Settings
            </NavLink>
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileMenu
```

---

## الخطوة 8: إنشاء مكون MainLayout

### 8.1 وصف المكون

**MainLayout** هو التخطيط الرئيسي لصفحات Dashboard والمشاريع، يتكون من:
- MainSidebar (جانبي)
- Header (علوي)
- منطقة المحتوى (Outlet)

### 8.2 إنشاء الملف

**إنشاء `src/components/layout/MainLayout.jsx`:**

```javascript
import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { cn } from '@/utils'
import Header from './Header'
import MainSidebar from './MainSidebar'
import MobileMenu from './MobileMenu'

/**
 * MainLayout Component
 * Main application layout with sidebar, header, and content area
 * Used for Dashboard, Project List, and Create Project pages
 */
function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  const handleMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background dark:bg-background-dark">
      {/* Desktop Sidebar */}
      <MainSidebar />

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={handleMenuClose}
        variant="main"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Header 
          onMenuClick={handleMenuToggle}
          showMobileMenu={true}
        />

        {/* Page Content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            'p-4 sm:p-6 lg:p-8',
            'bg-background dark:bg-background-dark',
            'scroll-smooth'
          )}
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
```

---

## الخطوة 9: إنشاء مكون ProjectLayout

### 9.1 وصف المكون

**ProjectLayout** هو التخطيط الخاص بمساحة عمل المشروع، يتكون من:
- ProjectSidebar (جانبي مع أدوات العمل)
- Header (علوي)
- منطقة المحتوى (Outlet)

### 9.2 إنشاء الملف

**إنشاء `src/components/layout/ProjectLayout.jsx`:**

```javascript
import { useState, useCallback, useEffect } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { cn } from '@/utils'
import Header from './Header'
import ProjectSidebar from './ProjectSidebar'
import MobileMenu from './MobileMenu'

/**
 * ProjectLayout Component
 * Project workspace layout with project sidebar and content area
 * Used for all project-specific pages (Overview, Screening, Assessment, etc.)
 */
function ProjectLayout() {
  const { projectId } = useParams()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock project data fetching
  useEffect(() => {
    // Simulate API call
    const fetchProject = async () => {
      setIsLoading(true)
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Mock project data
      setProject({
        id: projectId,
        name: 'Reforestation Initiative Alpha',
        location: 'Sumatra, Indonesia',
        status: 'in_progress',
        riskCategory: 'B',
        completedSteps: ['screening', 'assessment'],
        createdAt: '2025-10-15',
        updatedAt: '2026-01-20',
      })
      
      setIsLoading(false)
    }

    fetchProject()
  }, [projectId])

  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  const handleMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">
            Loading project...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background dark:bg-background-dark">
      {/* Desktop Project Sidebar */}
      <ProjectSidebar project={project} />

      {/* Mobile Menu - Project Variant */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={handleMenuClose}
        variant="project"
        project={project}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Header 
          onMenuClick={handleMenuToggle}
          showMobileMenu={true}
        />

        {/* Page Content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            'p-4 sm:p-6 lg:p-8',
            'bg-background dark:bg-background-dark',
            'scroll-smooth'
          )}
        >
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ project }} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProjectLayout
```

---

## الخطوة 10: إنشاء مكون ProtectedRoute

### 10.1 وصف المكون

**ProtectedRoute** هو مكون غلاف (wrapper) يحمي المسارات التي تتطلب مصادقة. هذا placeholder للمصادقة المستقبلية.

### 10.2 إنشاء الملف

**إنشاء `src/routes/ProtectedRoute.jsx`:**

```javascript
import { Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from './routes.config'

/**
 * ProtectedRoute Component
 * Wrapper component that protects routes requiring authentication
 * 
 * Note: This is a placeholder for future authentication implementation.
 * Currently allows all access.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string[]} props.allowedRoles - Optional array of roles allowed to access this route
 */
function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation()
  
  // TODO: Replace with actual auth check
  // const { isAuthenticated, user } = useAuth()
  const isAuthenticated = true // Placeholder - always authenticated
  const user = { role: 'admin' } // Placeholder user

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login with return URL
    return (
      <Navigate 
        to={ROUTES.LOGIN} 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // Check if user has required role (if roles are specified)
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.includes(user?.role)
    
    if (!hasRequiredRole) {
      // Redirect to dashboard or unauthorized page
      return (
        <Navigate 
          to={ROUTES.DASHBOARD} 
          replace 
        />
      )
    }
  }

  return children
}

export default ProtectedRoute
```

---

## الخطوة 11: إنشاء ملف تكوين المسارات الرئيسي

### 11.1 إنشاء Router

**إنشاء `src/routes/index.jsx`:**

```javascript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from './routes.config'
import ProtectedRoute from './ProtectedRoute'

// Layouts
import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import ProjectLayout from '@/components/layout/ProjectLayout'

// Placeholder Page Components (will be created in later phases)
// For now, we'll create simple placeholder components

// Auth Pages
const LoginPage = () => (
  <div className="w-full max-w-md mx-auto">
    <div className="bg-surface dark:bg-surface-dark p-8 rounded-2xl shadow-xl border border-border-default dark:border-border-dark">
      <h1 className="text-2xl font-bold text-text-main dark:text-white mb-4">Login</h1>
      <p className="text-text-secondary dark:text-gray-400">Login page placeholder - Phase 4</p>
    </div>
  </div>
)

// Dashboard Pages
const DashboardPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Dashboard</h1>
    <p className="text-text-secondary dark:text-gray-400">Dashboard page placeholder - Phase 4</p>
  </div>
)

const ProjectListPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Projects</h1>
    <p className="text-text-secondary dark:text-gray-400">Project list page placeholder - Phase 4</p>
  </div>
)

const ProjectCreatePage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Create Project</h1>
    <p className="text-text-secondary dark:text-gray-400">Create project page placeholder - Phase 4</p>
  </div>
)

// Project Workspace Pages
const ProjectOverviewPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Project Overview</h1>
    <p className="text-text-secondary dark:text-gray-400">Project overview page placeholder - Phase 5</p>
  </div>
)

const ScreeningFormPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Screening Form</h1>
    <p className="text-text-secondary dark:text-gray-400">Screening form page placeholder - Phase 5</p>
  </div>
)

const ScreeningSummaryPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Screening Summary</h1>
    <p className="text-text-secondary dark:text-gray-400">Screening summary page placeholder - Phase 5</p>
  </div>
)

const AssessmentGatewayPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Assessment Gateway</h1>
    <p className="text-text-secondary dark:text-gray-400">Assessment gateway page placeholder - Phase 6</p>
  </div>
)

const AssessmentMetadataPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Assessment Metadata</h1>
    <p className="text-text-secondary dark:text-gray-400">Assessment metadata page placeholder - Phase 6</p>
  </div>
)

const AssessmentMethodsPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Assessment Methods</h1>
    <p className="text-text-secondary dark:text-gray-400">Assessment methods page placeholder - Phase 6</p>
  </div>
)

const AssessmentScoringPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Assessment Scoring</h1>
    <p className="text-text-secondary dark:text-gray-400">Assessment scoring page placeholder - Phase 6</p>
  </div>
)

const AssessmentReviewPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Assessment Review</h1>
    <p className="text-text-secondary dark:text-gray-400">Assessment review page placeholder - Phase 6</p>
  </div>
)

const SempOverviewPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">SEMP Overview</h1>
    <p className="text-text-secondary dark:text-gray-400">SEMP overview page placeholder - Phase 7</p>
  </div>
)

const ManagementActivitiesPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Management Activities</h1>
    <p className="text-text-secondary dark:text-gray-400">Management activities page placeholder - Phase 7</p>
  </div>
)

const MitigationPlanPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Mitigation Plan</h1>
    <p className="text-text-secondary dark:text-gray-400">Mitigation plan page placeholder - Phase 7</p>
  </div>
)

const MonitoringOverviewPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Monitoring Overview</h1>
    <p className="text-text-secondary dark:text-gray-400">Monitoring overview page placeholder - Phase 8</p>
  </div>
)

const MonitoringDataEntryPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Monitoring Data Entry</h1>
    <p className="text-text-secondary dark:text-gray-400">Monitoring data entry page placeholder - Phase 8</p>
  </div>
)

const ProjectFilesPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Project Files</h1>
    <p className="text-text-secondary dark:text-gray-400">Project files page placeholder - Phase 8</p>
  </div>
)

const AnnexOverviewPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Annex & Attachments</h1>
    <p className="text-text-secondary dark:text-gray-400">Annex overview page placeholder - Phase 8</p>
  </div>
)

// Not Found Page
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-text-main dark:text-white mb-2">Page Not Found</p>
      <p className="text-text-secondary dark:text-gray-400 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <a 
        href={ROUTES.DASHBOARD}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors"
      >
        <span className="material-symbols-outlined">home</span>
        Back to Dashboard
      </a>
    </div>
  </div>
)

/**
 * Application Router Configuration
 */
export const router = createBrowserRouter([
  // ==========================================
  // Auth Routes (Public)
  // ==========================================
  {
    element: <AuthLayout />,
    children: [
      { 
        path: ROUTES.LOGIN, 
        element: <LoginPage /> 
      },
    ],
  },

  // ==========================================
  // Main App Routes (Protected)
  // ==========================================
  {
    path: ROUTES.APP,
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // Redirect /app to /app/dashboard
      { 
        index: true, 
        element: <Navigate to="dashboard" replace /> 
      },
      { 
        path: 'dashboard', 
        element: <DashboardPage /> 
      },
      { 
        path: 'projects', 
        element: <ProjectListPage /> 
      },
      { 
        path: 'projects/new', 
        element: <ProjectCreatePage /> 
      },
    ],
  },

  // ==========================================
  // Project Workspace Routes (Protected)
  // ==========================================
  {
    path: '/app/projects/:projectId',
    element: (
      <ProtectedRoute>
        <ProjectLayout />
      </ProtectedRoute>
    ),
    children: [
      // Redirect to overview by default
      { 
        index: true, 
        element: <Navigate to="overview" replace /> 
      },
      { 
        path: 'overview', 
        element: <ProjectOverviewPage /> 
      },

      // Screening (Tool 1)
      { 
        path: 'screening', 
        element: <ScreeningFormPage /> 
      },
      { 
        path: 'screening/summary', 
        element: <ScreeningSummaryPage /> 
      },

      // Assessment (Tool 2)
      { 
        path: 'assessment', 
        element: <AssessmentGatewayPage /> 
      },
      { 
        path: 'assessment/metadata', 
        element: <AssessmentMetadataPage /> 
      },
      { 
        path: 'assessment/methods', 
        element: <AssessmentMethodsPage /> 
      },
      { 
        path: 'assessment/scoring', 
        element: <AssessmentScoringPage /> 
      },
      { 
        path: 'assessment/review', 
        element: <AssessmentReviewPage /> 
      },

      // SEMP (Tools 3 & 4)
      { 
        path: 'semp', 
        element: <SempOverviewPage /> 
      },
      { 
        path: 'semp/activities', 
        element: <ManagementActivitiesPage /> 
      },
      { 
        path: 'semp/mitigation', 
        element: <MitigationPlanPage /> 
      },

      // Monitoring (Tool 5)
      { 
        path: 'monitoring', 
        element: <MonitoringOverviewPage /> 
      },
      { 
        path: 'monitoring/data-entry', 
        element: <MonitoringDataEntryPage /> 
      },

      // Files & Annex
      { 
        path: 'files', 
        element: <ProjectFilesPage /> 
      },
      { 
        path: 'annex', 
        element: <AnnexOverviewPage /> 
      },
    ],
  },

  // ==========================================
  // Catch-all & Redirects
  // ==========================================
  
  // Root redirect to login
  { 
    path: '/', 
    element: <Navigate to={ROUTES.LOGIN} replace /> 
  },
  
  // 404 Page
  { 
    path: '*', 
    element: <NotFoundPage /> 
  },
])

export default router
```

---

## الخطوة 12: تحديث Barrel Exports

### 12.1 تحديث components/layout/index.js

**تحديث `src/components/layout/index.js`:**

```javascript
// Layout Components Barrel Export

export { default as AuthLayout } from './AuthLayout'
export { default as MainLayout } from './MainLayout'
export { default as ProjectLayout } from './ProjectLayout'
export { default as Header } from './Header'
export { default as MainSidebar } from './MainSidebar'
export { default as ProjectSidebar } from './ProjectSidebar'
export { default as MobileMenu } from './MobileMenu'
```

### 12.2 إنشاء routes/index.js barrel export

**تحديث `src/routes/index.js` (إذا كان مختلفاً عن index.jsx):**

```javascript
// Routes Barrel Export

export { router, default } from './index.jsx'
export { ROUTES, getProjectRoute, MAIN_NAV_ITEMS, PROJECT_WORKFLOW_NAV, PROJECT_SECONDARY_NAV } from './routes.config'
export { default as ProtectedRoute } from './ProtectedRoute'
```

---

## الخطوة 13: تحديث App.jsx

### 13.1 تحديث App.jsx لاستخدام Router

**تحديث `src/App.jsx`:**

```javascript
import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'

/**
 * App Component
 * Root application component with router provider
 */
function App() {
  return <RouterProvider router={router} />
}

export default App
```

---

## الخطوة 14: تحديث main.jsx

### 14.1 التأكد من إعداد main.jsx

**تحديث `src/main.jsx`:**

```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@/contexts'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)
```

---

## الخطوة 15: إنشاء Custom Hook للـ Outlet Context

### 15.1 إنشاء useProjectContext Hook

**إنشاء `src/hooks/useProjectContext.js`:**

```javascript
import { useOutletContext } from 'react-router-dom'

/**
 * Custom hook to access project data from ProjectLayout context
 * @returns {{ project: Object }} Project context
 */
export function useProjectContext() {
  return useOutletContext()
}
```

### 15.2 تحديث hooks/index.js

**تحديث `src/hooks/index.js`:**

```javascript
// Custom Hooks Barrel Export

export { useProjectContext } from './useProjectContext'
// export { useLocalStorage } from './useLocalStorage'
// export { useMediaQuery } from './useMediaQuery'
```

---

## الخطوة 16: اختبار التوجيه

### 16.1 تشغيل التطبيق

```bash
cd frontend
npm run dev
```

### 16.2 اختبارات يدوية

| المسار | الصفحة المتوقعة | التخطيط |
|--------|-----------------|---------|
| `/` | توجيه إلى `/login` | - |
| `/login` | صفحة تسجيل الدخول | AuthLayout |
| `/app` | توجيه إلى `/app/dashboard` | - |
| `/app/dashboard` | Dashboard | MainLayout |
| `/app/projects` | قائمة المشاريع | MainLayout |
| `/app/projects/new` | إنشاء مشروع جديد | MainLayout |
| `/app/projects/123` | توجيه إلى `/app/projects/123/overview` | - |
| `/app/projects/123/overview` | نظرة عامة على المشروع | ProjectLayout |
| `/app/projects/123/screening` | نموذج الفحص | ProjectLayout |
| `/app/projects/123/assessment` | بوابة التقييم | ProjectLayout |
| `/nonexistent` | صفحة 404 | - |

### 16.3 اختبار الـ Responsive

1. افتح DevTools (F12)
2. اضغط على زر الجهاز (Device Toggle)
3. اختبر على أحجام مختلفة:
   - Mobile: 375px
   - Tablet: 768px
   - Desktop: 1280px+

### 16.4 التحقق من:

- [ ] الـ Sidebar يختفي على الموبايل
- [ ] زر القائمة يظهر على الموبايل
- [ ] الـ MobileMenu يفتح ويغلق بشكل صحيح
- [ ] التنقل بين الصفحات يعمل
- [ ] الـ Active state يظهر بشكل صحيح في Navigation
- [ ] الوضع المظلم يعمل في جميع التخطيطات

---

## قائمة التحقق النهائية (Checklist)

### الملفات التي يجب إنشاؤها:

```
✓ src/routes/
  ✓ routes.config.js
  ✓ index.jsx
  ✓ ProtectedRoute.jsx

✓ src/components/layout/
  ✓ AuthLayout.jsx
  ✓ MainLayout.jsx
  ✓ ProjectLayout.jsx
  ✓ Header.jsx
  ✓ MainSidebar.jsx
  ✓ ProjectSidebar.jsx
  ✓ MobileMenu.jsx
  ✓ index.js (barrel export)

✓ src/hooks/
  ✓ useProjectContext.js
  ✓ index.js (updated)

✓ src/
  ✓ App.jsx (updated)
  ✓ main.jsx (verified)
```

### اختبارات يجب تنفيذها:

| الاختبار | الأمر/الإجراء | النتيجة المتوقعة |
|---------|--------------|------------------|
| تشغيل التطبيق | `npm run dev` | يفتح بدون أخطاء |
| التوجيه الأساسي | زيارة `/app/dashboard` | عرض Dashboard مع MainLayout |
| التوجيه للمشروع | زيارة `/app/projects/123/overview` | عرض Overview مع ProjectLayout |
| Mobile Menu | تصغير الشاشة + النقر على زر القائمة | فتح MobileMenu |
| Dark Mode | تبديل الوضع | تغيير الألوان في جميع المكونات |
| Navigation Active | النقر على رابط | تمييز الرابط النشط |
| ESLint | `npm run lint` | لا أخطاء |

---

## ملاحظات مهمة

### 1. React Router v7

إذا كنت تستخدم React Router v7، قد تحتاج لتعديلات طفيفة في بعض الـ APIs. راجع التوثيق الرسمي.

### 2. Avatar Component

تأكد من أن مكون `Avatar` موجود من Phase 2. إذا لم يكن موجوداً، استخدم بديلاً مؤقتاً:

```javascript
// Temporary Avatar replacement
const Avatar = ({ src, alt, size = 'md', className }) => {
  const sizes = { sm: 'size-8', md: 'size-10', lg: 'size-12' }
  return (
    <div 
      className={cn(sizes[size], 'rounded-full bg-cover bg-center', className)}
      style={{ backgroundImage: `url(${src})` }}
      aria-label={alt}
    />
  )
}
```

### 3. الصفحات Placeholder

جميع صفحات المحتوى (Dashboard, Projects, etc.) هي placeholders الآن. سيتم استبدالها في المراحل اللاحقة (Phase 4-8).

### 4. المصادقة

مكون `ProtectedRoute` هو placeholder. المصادقة الفعلية ستُنفذ في مرحلة لاحقة مع الـ Backend integration.

---

*تم إنشاء هذه الخطة: 22 يناير 2026*
*الإصدار: 1.0*
