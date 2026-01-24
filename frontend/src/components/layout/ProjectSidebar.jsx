import { useState } from 'react'
import { NavLink, useParams, useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/utils'
import { useTheme } from '@/contexts'
import { PROJECT_WORKFLOW_NAV, PROJECT_SECONDARY_NAV, ROUTES } from '@/routes/routes.config'
import { Avatar } from '@/components/ui'

// User menu items (same as Header)
const userMenuItems = [
  { id: 'profile', label: 'Profile', icon: 'person' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'divider', type: 'divider' },
  { id: 'theme', label: 'Theme', icon: 'dark_mode', type: 'theme-toggle' },
  { id: 'divider2', type: 'divider' },
  { id: 'logout', label: 'Sign Out', icon: 'logout' },
]

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
  const { isDark, toggleTheme } = useTheme()

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

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
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCtra6pj5M5oTyJp1GdJWuU63rsELKvVKe4fboOS02kUTaVf4ehAD_wchdxbPfoBzsc-L9HdsZm1dlAzW_598IOXygrITkCOb8PhtOGw5WVcDdF3hE96FbESF6OkZ6S4Qg8lCHAcfE56hrcA5qoUEuWFbxCSpY46m1nYJN2KV7pM5SvQP55_nYo7EqBZCnQnwrXRiHUeqB2sW7Jgr27PWEBt_NAf5J93MIG1HUbYa8YpgApira7wAky_Gj0olj2YRpwHmf8JlO4xcid',
  }

  // Check if a nav item is active
  const isNavActive = (path) => {
    const fullPath = `/app/projects/${projectId}/${path}`
    return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/')
  }

  // Check if any child is active
  const hasActiveChild = (children) => {
    if (!children) return false
    return children.some((child) => {
      const childPath = `/app/projects/${projectId}/${child.path}`
      return location.pathname === childPath || location.pathname.startsWith(childPath + '/')
    })
  }

  // Auto-expand items with active children (no manual toggle needed)
  // Expansion happens automatically when a child is active

  // Check if a step is completed
  const isStepCompleted = (stepId) => {
    return projectData.completedSteps?.includes(stepId)
  }

  // TODO: Step Locking Logic - To be implemented when business logic is added
  // When implementing, steps should be locked (or marked as checked) based on sequential completion.
  // Users must complete steps in order: Screening → Assessment → SEMP → Monitoring
  // A step should only be accessible after the previous step is completed.
  // Example implementation:
  // const isStepLocked = (stepId) => {
  //   const stepOrder = ['screening', 'assessment', 'semp', 'monitoring']
  //   const stepIndex = stepOrder.indexOf(stepId)
  //   if (stepIndex === 0) return false
  //   const previousStep = stepOrder[stepIndex - 1]
  //   return !isStepCompleted(previousStep)
  // }
  // For now, all steps are accessible (no locking)
  // eslint-disable-next-line no-unused-vars
  const isStepLocked = () => false

  // Render expandable nav item
  const renderExpandableItem = (item) => {
    // TODO: When step locking logic is implemented, uncomment the following:
    // Annex & Attachments should never be locked
    // const isLocked = item.id !== 'annex' && isStepLocked(item.id)
    // For now, all items are accessible (no locking)
    const isLocked = false
    const isCompleted = isStepCompleted(item.id)
    const hasActive = hasActiveChild(item.children)
    const isParentActive = isNavActive(item.path)
    // Only expand when a child is active (manual navigation to child pages)
    const isExpanded = hasActive

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
      <div
        key={item.id}
        className={cn(
          'rounded-lg overflow-hidden',
          (isExpanded || isParentActive) && 'bg-background dark:bg-background-dark'
        )}
      >
        {/* Parent Item */}
        <div className="flex relative">
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 w-1 rounded-l-lg',
              (isExpanded || isParentActive) && 'bg-primary'
            )}
          />
          <NavLink
            to={`/app/projects/${projectId}/${item.path}`}
            className={cn(
              'flex-1 flex items-center gap-3 px-3 py-2.5',
              'text-sm font-bold',
              'transition-colors',
              isParentActive
                ? 'text-text-main dark:text-white'
                : 'text-text-secondary hover:text-text-main dark:hover:text-white'
            )}
          >
            <span
              className={cn(
                'material-symbols-outlined',
                (isCompleted || isParentActive) && 'text-primary'
              )}
            >
              {isCompleted ? 'check_circle' : item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        </div>

        {/* Children Items */}
        {isExpanded && (
          <div className="flex flex-col pb-2 relative">
            <div className="absolute left-6 top-0 bottom-2 w-px bg-border-default dark:bg-border-dark ml-0.5" />
            {item.children?.map((child) => {
              const childPath = `/app/projects/${projectId}/${child.path}`
              const isChildActive =
                location.pathname === childPath || location.pathname.startsWith(childPath + '/')

              return (
                <NavLink
                  key={child.id}
                  to={childPath}
                  className={cn(
                    'pl-10 pr-3 py-1.5 text-sm block',
                    'transition-colors',
                    isChildActive
                      ? 'font-bold text-primary hover:text-primary-hover'
                      : 'font-medium text-text-secondary hover:text-primary'
                  )}
                >
                  {child.label}
                </NavLink>
              )
            })}
          </div>
        )}
      </div>
    )
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
        {PROJECT_WORKFLOW_NAV.filter((item) => item.id !== 'overview').map((item) => {
          // Only assessment should be expandable
          if (item.children && item.id === 'assessment') {
            return renderExpandableItem(item)
          }

          // Render simple items
          // TODO: When step locking logic is implemented, uncomment the following:
          // const isLocked = isStepLocked(item.id)
          // For now, all items are accessible (no locking)
          const isLocked = false
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
        {PROJECT_SECONDARY_NAV.map((item) => {
          // Render expandable items (only Annex & Attachments)
          if (item.children) {
            return renderExpandableItem(item)
          }

          // Render simple items
          return (
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
          )
        })}
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

        {/* User Info with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={cn(
              'w-full flex items-center gap-3 px-1 py-2 rounded-lg',
              'hover:bg-background dark:hover:bg-background-dark',
              'transition-colors'
            )}
          >
            <Avatar
              src={user.avatar}
              alt={user.name}
              size="sm"
              className="ring-2 ring-border-default dark:ring-border-dark"
            />
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-sm font-bold text-text-main dark:text-white truncate">
                {user.name}
              </span>
              <span className="text-xs text-text-secondary dark:text-gray-400 truncate">
                {user.role}
              </span>
            </div>
            <span
              className={cn(
                'material-symbols-outlined text-text-secondary text-lg transition-transform',
                isUserMenuOpen && 'rotate-180'
              )}
            >
              expand_more
            </span>
          </button>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />

              {/* Menu */}
              <div
                className={cn(
                  'absolute bottom-full left-0 mb-2 z-20',
                  'w-full py-2',
                  'bg-surface dark:bg-surface-dark',
                  'border border-border-default dark:border-border-dark',
                  'rounded-xl shadow-lg',
                  'animate-slide-in'
                )}
              >
                {userMenuItems.map((item) => {
                  if (item.type === 'divider') {
                    return (
                      <div
                        key={item.id}
                        className="my-2 border-t border-border-default dark:border-border-dark"
                      />
                    )
                  }

                  // Theme Toggle - Special handling
                  if (item.type === 'theme-toggle') {
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          toggleTheme()
                          // Don't close menu on theme toggle
                        }}
                        className={cn(
                          'w-full flex items-center justify-between gap-3',
                          'px-4 py-2.5',
                          'text-sm text-text-secondary dark:text-gray-400',
                          'hover:text-text-main dark:hover:text-white',
                          'hover:bg-background dark:hover:bg-background-dark',
                          'transition-colors'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px]">
                            {isDark ? 'light_mode' : 'dark_mode'}
                          </span>
                          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                        </div>
                        <span className="text-xs text-text-secondary dark:text-gray-400">
                          {isDark ? 'Dark' : 'Light'}
                        </span>
                      </button>
                    )
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        // Handle action
                        if (item.id === 'settings') {
                          navigate(`/app/projects/${projectId}/settings`)
                        }
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
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

export default ProjectSidebar
