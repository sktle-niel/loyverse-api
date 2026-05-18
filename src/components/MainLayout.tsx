// Main layout with sidebar and theme toggle
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { ThemeToggleButton } from './ThemeToggleButton'
import { AuditDashboard } from './AuditDashboard'
import { useTheme } from '../hooks/useTheme'
import '../styles/sidebar.css'

export function MainLayout() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const { theme, toggle } = useTheme()

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AuditDashboard />
      case 'reports':
        return (
          <div className="min-h-screen bg-base-200 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl font-bold text-base-content">Reports</h1>
              <p className="text-base-content/60 mt-2">
                Reports page coming soon...
              </p>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="min-h-screen bg-base-200 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl font-bold text-base-content">Settings</h1>
              <p className="text-base-content/60 mt-2">
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
    <div className="flex">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="ml-64 flex-1">
        {renderPage()}
        <ThemeToggleButton onToggle={toggle} currentTheme={theme} />
      </div>
    </div>
  )
}
