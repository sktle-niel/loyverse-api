// Main layout with sidebar and theme toggle
import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { ThemeToggleButton } from './ThemeToggleButton'
import { AuditDashboard } from './AuditDashboard'
import { useTheme } from '../hooks/useTheme'
import '../styles/sidebar.css'

export function MainLayout() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggle } = useTheme()

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AuditDashboard />
      case 'reports':
        return (
          <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content">Reports</h1>
              <p className="text-base-content/60 mt-2 text-sm sm:text-base">
                Reports page coming soon...
              </p>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content">Settings</h1>
              <p className="text-base-content/60 mt-2 text-sm sm:text-base">
                Settings page coming soon...
              </p>
            </div>
          </div>
        )
      default:
        return <AuditDashboard />
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 lg:left-0 lg:right-auto w-64 transform transition-transform duration-300 ease-in-out z-40 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar currentPage={currentPage} onPageChange={() => setSidebarOpen(false)} onPageChangeCallback={setCurrentPage} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative w-full lg:ml-64">
        {/* Mobile Menu Button */}
        <button
          className="lg:hidden fixed top-4 right-4 z-50 btn btn-ghost btn-circle bg-base-100/80 backdrop-blur-sm border border-base-content/10 hover:bg-base-100"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {renderPage()}
        <ThemeToggleButton onToggle={toggle} currentTheme={theme} />
      </div>
    </div>
  )
}
