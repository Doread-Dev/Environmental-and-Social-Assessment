import { useEffect, useState } from 'react'
import { NavLink, useLocation, useParams, useNavigate } from 'react-router-dom'
import { cn } from '@/utils'
import { useTheme } from '@/contexts'
import {
  MAIN_NAV_ITEMS,
  PROJECT_WORKFLOW_NAV,
  PROJECT_SECONDARY_NAV,
  ROUTES,
} from '@/routes/routes.config'
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
 * MobileMenu Component
 * Slide-out navigation menu for mobile devices
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the menu is open
 * @param {Function} props.onClose - Callback to close the menu
 * @param {'main' | 'project'} props.variant - Menu variant
 * @param {Object} props.project - Project data (for project variant)
 */
function MobileMenu({ isOpen, onClose, variant = 'main', project }) {
  const location = useLocation()
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

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

  // Check if a nav item is active (for project variant)
  const isNavActive = (path) => {
    if (!projectId) return false
    const fullPath = `/app/projects/${projectId}/${path}`
    return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/')
  }

  // Check if any child is active
  const hasActiveChild = (children) => {
    if (!children || !projectId) return false
    return children.some((child) => {
      const childPath = `/app/projects/${projectId}/${child.path}`
      return location.pathname === childPath || location.pathname.startsWith(childPath + '/')
    })
  }

  // Auto-expand items with active children (no manual toggle needed)
  // Expansion happens automatically when a child is active

  // Mock project data
  const projectData = project || {
    id: projectId,
    name: 'Reforestation Initiative Alpha',
    location: 'Sumatra, Indonesia',
  }

  // Mock user data
  const user = {
    name: 'Alex Morgan',
    role: 'Environmental Officer',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCtra6pj5M5oTyJp1GdJWuU63rsELKvVKe4fboOS02kUTaVf4ehAD_wchdxbPfoBzsc-L9HdsZm1dlAzW_598IOXygrITkCOb8PhtOGw5WVcDdF3hE96FbESF6OkZ6S4Qg8lCHAcfE56hrcA5qoUEuWFbxCSpY46m1nYJN2KV7pM5SvQP55_nYo7EqBZCnQnwrXRiHUeqB2sW7Jgr27PWEBt_NAf5J93MIG1HUbYa8YpgApira7wAky_Gj0olj2YRpwHmf8JlO4xcid',
  }

  // Render expandable nav item (for project variant)
  const renderExpandableItem = (item) => {
    if (!projectId) return null

    const hasActive = hasActiveChild(item.children)
    const isParentActive = isNavActive(item.path)
    // Only expand when a child is active (manual navigation to child pages)
    const isExpanded = hasActive

    return (
      <div key={item.id}>
        {/* Parent Item */}
        <NavLink
          to={`/app/projects/${projectId}/${item.path}`}
          className={cn(
            'flex items-center gap-3',
            'px-4 py-3 rounded-lg',
            'text-base font-medium',
            'transition-colors',
            isParentActive
              ? 'bg-primary/10 text-primary'
              : 'text-text-secondary hover:text-text-main hover:bg-background dark:hover:bg-background-dark'
          )}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          {item.label}
        </NavLink>

        {/* Children Items */}
        {isExpanded && (
          <div className="pl-8 pr-4 py-2 space-y-1">
            {item.children?.map((child) => {
              const childPath = `/app/projects/${projectId}/${child.path}`
              const isChildActive =
                location.pathname === childPath || location.pathname.startsWith(childPath + '/')

              return (
                <NavLink
                  key={child.id}
                  to={childPath}
                  className={cn(
                    'block px-4 py-2 rounded-lg text-sm',
                    'transition-colors',
                    isChildActive
                      ? 'font-bold text-primary bg-primary/10'
                      : 'font-medium text-text-secondary hover:text-text-main hover:bg-background dark:hover:bg-background-dark'
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
            {variant === 'project' && projectId ? (
              // Project variant: Show Back to Dashboard button
              <button
                onClick={() => {
                  navigate(ROUTES.DASHBOARD)
                  onClose()
                }}
                className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-main dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back to Dashboard
              </button>
            ) : (
              // Main variant: Show Logo
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-white">
                  <span className="material-symbols-outlined text-2xl">eco</span>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-lg font-bold leading-tight text-text-main dark:text-white">
                    ESMS
                  </h1>
                  <p className="text-text-secondary text-xs font-medium">Internal Portal</p>
                </div>
              </div>
            )}

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

          {/* Project Info (for project variant) */}
          {variant === 'project' && projectId && (
            <div className="px-4 py-3 border-b border-border-default dark:border-border-dark">
              <div className="bg-background dark:bg-background-dark rounded-lg p-3">
                <h2 className="text-sm font-bold text-text-main dark:text-white">
                  {projectData.name}
                </h2>
                <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">
                  {projectData.location}
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-1">
              {variant === 'main' ? (
                // Main navigation
                MAIN_NAV_ITEMS.map((item) => (
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
                ))
              ) : (
                // Project navigation
                <>
                  {/* Overview */}
                  <NavLink
                    to={`/app/projects/${projectId}/overview`}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3',
                        'px-4 py-3 rounded-lg mb-2',
                        'text-base font-semibold',
                        'transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:text-text-main hover:bg-background dark:hover:bg-background-dark'
                      )
                    }
                  >
                    <span className="material-symbols-outlined">dashboard</span>
                    Project Overview
                  </NavLink>

                  {/* Workflow Tools */}
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-4 mb-2">
                      Workflow Tools
                    </p>
                    {PROJECT_WORKFLOW_NAV.filter((item) => item.id !== 'overview').map((item) => {
                      // Only assessment should be expandable
                      if (item.children && item.id === 'assessment') {
                        return renderExpandableItem(item)
                      }

                      const isActive = isNavActive(item.path)
                      return (
                        <NavLink
                          key={item.id}
                          to={`/app/projects/${projectId}/${item.path}`}
                          className={cn(
                            'flex items-center gap-3',
                            'px-4 py-3 rounded-lg',
                            'text-base font-medium',
                            'transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-text-secondary hover:text-text-main hover:bg-background dark:hover:bg-background-dark'
                          )}
                        >
                          <span className="material-symbols-outlined">{item.icon}</span>
                          {item.label}
                        </NavLink>
                      )
                    })}
                  </div>

                  {/* Divider */}
                  <div className="my-4 border-t border-border-default dark:border-border-dark" />

                  {/* Secondary Navigation */}
                  {PROJECT_SECONDARY_NAV.map((item) => {
                    // Only Annex & Attachments should be expandable
                    if (item.children && item.id === 'annex') {
                      return renderExpandableItem(item)
                    }

                    return (
                      <NavLink
                        key={item.id}
                        to={`/app/projects/${projectId}/${item.path}`}
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
                    )
                  })}
                </>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-border-default dark:border-border-dark p-4 space-y-2">
            {/* Settings */}
            <NavLink
              to={variant === 'project' ? `/app/projects/${projectId}/settings` : '/app/settings'}
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

            {/* User Info with Dropdown (for project variant) */}
            {variant === 'project' && (
              <>
                <div className="h-px bg-border-default dark:bg-border-dark w-full my-2" />
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
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
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />

                      {/* Menu */}
                      <div
                        className={cn(
                          'absolute bottom-full left-0 mb-2 z-50',
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
                                  onClose()
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
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileMenu
