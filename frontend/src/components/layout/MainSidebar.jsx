import { NavLink } from 'react-router-dom'
import { cn } from '@/utils'
import { MAIN_NAV_ITEMS } from '@/routes/routes.config'
import { useAuth, USER_ROLES } from '@/contexts'

/**
 * MainSidebar Component
 * Main navigation sidebar for Dashboard and Projects
 *
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 */
function MainSidebar({ className }) {
  const { user } = useAuth()
  const canAccessSettings = user?.role === USER_ROLES.ENVIRONMENTAL_SPECIALIST

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
            <p className="text-text-secondary text-xs font-medium">Internal Portal</p>
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

      {/* Footer Section - Settings (Environmental Specialist only) */}
      {canAccessSettings && (
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
      )}
    </aside>
  )
}

export default MainSidebar
