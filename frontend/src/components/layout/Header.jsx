import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils'
import { useTheme, useAuth, ROLE_LABELS, USER_ROLES } from '@/contexts'
import { Avatar } from '@/components/ui'
import { ROUTES } from '@/routes/routes.config'

/**
 * Header Component
 * Top navigation bar with user profile and actions
 *
 * @param {Object} props
 * @param {Function} props.onMenuClick - Callback for mobile menu toggle
 * @param {boolean} props.showMobileMenu - Whether to show mobile menu button
 * @param {string} props.className - Additional CSS classes
 */
function Header({ onMenuClick, showMobileMenu = true, className }) {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const userName = user?.name || user?.email || 'User'
  const userRoleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : ''

  // User menu items (filtered by role)
  const userMenuItems = useMemo(() => {
    const items = []
    
    // Settings - only for Environmental Specialist
    if (user?.role === USER_ROLES.ENVIRONMENTAL_SPECIALIST) {
      items.push({ id: 'settings', label: 'Settings', icon: 'settings' })
      items.push({ id: 'divider', type: 'divider' })
    }
    
    items.push({ id: 'logout', label: 'Sign Out', icon: 'logout' })
    
    return items
  }, [user?.role])

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    navigate(ROUTES.LOGIN, { replace: true })
  }

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
          <h2 className="text-lg font-bold text-text-main dark:text-white tracking-tight">ESMS</h2>
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
          <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
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
                {userName}
              </p>
              <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">{userRoleLabel}</p>
            </div>

            {/* Avatar */}
            <Avatar
              alt={userName}
              size="md"
              className="ring-2 ring-white dark:ring-surface-dark"
            />
          </button>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />

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
                    {userName}
                  </p>
                  <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">
                    {userRoleLabel}
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
                        if (item.id === 'settings') {
                          navigate(ROUTES.SETTINGS)
                        }
                        if (item.id === 'logout') {
                          handleLogout()
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
    </header>
  )
}

export default Header
