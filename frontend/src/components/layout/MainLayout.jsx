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
      <MobileMenu isOpen={isMobileMenuOpen} onClose={handleMenuClose} variant="main" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Header onMenuClick={handleMenuToggle} showMobileMenu={true} />

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
