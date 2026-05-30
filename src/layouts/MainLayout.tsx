import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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
import { ROUTES } from '../constants/app'
import '../styles/sidebar.css'

export function MainLayout() {
  const { user, isAdmin, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggle } = useTheme()

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
          isAdmin={isAdmin}
          userDisplayName={user?.displayName ?? user?.username ?? ''}
          userRole={user?.role ?? 'operator'}
          onLogout={logout}
          onPageChange={() => setSidebarOpen(false)}
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

        <Routes>
          <Route path="/" element={<Navigate to={isAdmin ? ROUTES.DASHBOARD : ROUTES.INVENTORY} replace />} />
          <Route path="/reports" element={<Navigate to={ROUTES.INVENTORY} replace />} />
          <Route path={ROUTES.DASHBOARD} element={isAdmin ? <Dashboard /> : <Navigate to={ROUTES.INVENTORY} replace />} />
          <Route path={ROUTES.INVENTORY} element={<Inventory />} />
          <Route path={ROUTES.APPROVALS} element={isAdmin ? <AdminApprovals /> : <Navigate to={ROUTES.INVENTORY} replace />} />
          <Route path={ROUTES.HISTORY} element={isAdmin ? <History /> : <Navigate to={ROUTES.INVENTORY} replace />} />
          <Route path={ROUTES.OPERATORS} element={isAdmin ? <AdminOperators /> : <Navigate to={ROUTES.INVENTORY} replace />} />
          <Route path={ROUTES.QUEUE} element={!isAdmin ? <OperatorQueue /> : <Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path="*" element={<Navigate to={isAdmin ? ROUTES.DASHBOARD : ROUTES.INVENTORY} replace />} />
        </Routes>

        <ThemeToggleButton onToggle={toggle} currentTheme={theme} />
      </div>
    </div>
  )
}
