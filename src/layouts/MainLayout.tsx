import { useState, useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'
import { ThemeToggleButton } from '../components/ThemeToggleButton'
import { Dashboard } from '../pages/Dashboard'
import { Inventory } from '../pages/Inventory'
import { AdminApprovals } from '../pages/AdminApprovals'
import { AdminOperators } from '../pages/AdminOperators'
import { History } from '../pages/History'
import { OperatorQueue } from '../pages/OperatorQueue'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import '../styles/sidebar.css'

const ADMIN_ONLY_PAGES = new Set(['dashboard', 'approvals', 'history', 'operators'])

function normalizePage(page: string, isAdmin: boolean): string {
  if (!isAdmin && ADMIN_ONLY_PAGES.has(page)) {
    return 'reports'
  }
  if (isAdmin && page === 'reports') {
    return 'dashboard'
  }
  return page
}

export function MainLayout() {
  const { user, isAdmin, logout } = useAuth()
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = window.localStorage.getItem('currentPage')
    return saved || 'dashboard'
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggle } = useTheme()

  useEffect(() => {
    if (!user) return
    setCurrentPage((page) => normalizePage(page, isAdmin))
  }, [user, isAdmin])

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

  useEffect(() => {
    window.localStorage.setItem('currentPage', currentPage)
  }, [currentPage])

  const handlePageChange = (page: string) => {
    setCurrentPage(normalizePage(page, isAdmin))
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return isAdmin ? <Dashboard /> : <Inventory />
      case 'reports':
        return isAdmin ? <Dashboard /> : <Inventory />
      case 'approvals':
        return isAdmin ? <AdminApprovals /> : <Inventory />
      case 'queue':
        return !isAdmin ? <OperatorQueue /> : <Dashboard />
      case 'history':
        return isAdmin ? <History /> : <Inventory />
      case 'operators':
        return isAdmin ? <AdminOperators /> : <Inventory />
      default:
        return isAdmin ? <Dashboard /> : <Inventory />
    }
  }

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 lg:left-0 lg:right-auto w-[15.5rem] transform transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar
          currentPage={currentPage}
          isAdmin={isAdmin}
          userDisplayName={user?.displayName ?? user?.username ?? ''}
          userRole={user?.role ?? 'operator'}
          onLogout={logout}
          onPageChange={() => setSidebarOpen(false)}
          onPageChangeCallback={handlePageChange}
        />
      </div>

      <div className="flex-1 flex flex-col relative w-full lg:ml-[15.5rem]">
        <button
          className="lg:hidden fixed top-4 right-4 z-50 btn btn-ghost btn-circle bg-base-100/80 backdrop-blur-sm border border-base-content/10 hover:bg-base-100"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Close menu' : 'Open menu'}
          type="button"
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
