// Sidebar navigation component
interface SidebarProps {
  currentPage: string
  onPageChange: () => void
  onPageChangeCallback: (page: string) => void
}

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const ReportsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7H7v10h6V7z M17 7h-2v4h2V7z M13 13h-6 M17 13h-2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export function Sidebar({ currentPage, onPageChange, onPageChangeCallback }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'reports', label: 'Reports', icon: ReportsIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  const handleMenuClick = (id: string) => {
    onPageChangeCallback(id)
    onPageChange()
  }

  return (
    <div className="sidebar-container h-full">
      {/* Header */}
      <div className="px-4 sm:px-6 py-6 sm:py-8 border-b border-base-content/10">
        <h2 className="text-base sm:text-lg font-semibold text-base-content">Two Wheels Zone</h2>
        <p className="text-xs text-base-content/50 mt-2">Audit System</p>
      </div>

      {/* Navigation - scrollable content area */}
      <nav className="flex-1 overflow-y-auto py-6 px-2 sm:px-3 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 ${
                currentPage === item.id
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-base-content/70 hover:text-base-content hover:bg-base-200/30'
              }`}
            >
              <Icon />
              <span className="text-xs sm:text-sm">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="px-2 sm:px-4 py-4 sm:py-6 border-t border-base-content/10">
        <div className="px-2 sm:px-3 py-2 sm:py-3 bg-base-200/20 rounded-lg border border-base-content/10">
          <p className="text-xs font-medium text-base-content mb-1">
            ✓ Loyverse Connected
          </p>
          <p className="text-xs text-base-content/60">
            Real-time audit active
          </p>
        </div>
      </div>
    </div>
  )
}
