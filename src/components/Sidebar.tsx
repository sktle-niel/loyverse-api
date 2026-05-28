interface SidebarProps {
  currentPage: string
  isAdmin: boolean
  userDisplayName: string
  userRole: 'admin' | 'operator'
  onLogout: () => void
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

const ApprovalsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const OperatorsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
)

const QueueIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)

const HistoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export function Sidebar({
  currentPage,
  isAdmin,
  userDisplayName,
  userRole,
  onLogout,
  onPageChange,
  onPageChangeCallback,
}: SidebarProps) {
  const menuItems = [
    ...(isAdmin ? [{ id: 'dashboard', label: 'Dashboard', icon: DashboardIcon }] : []),
    ...(!isAdmin ? [
      { id: 'reports', label: 'Inventory', icon: ReportsIcon },
      { id: 'queue', label: 'My Requests', icon: QueueIcon },
    ] : []),
    ...(isAdmin
      ? [
          { id: 'approvals', label: 'Approvals', icon: ApprovalsIcon },
          { id: 'history', label: 'History', icon: HistoryIcon },
          { id: 'operators', label: 'Operators', icon: OperatorsIcon },
        ]
      : []),
  ]

  const handleMenuClick = (id: string) => {
    onPageChangeCallback(id)
    onPageChange()
  }

  return (
    <div className="sidebar-container h-full flex flex-col">
      <div className="px-4 sm:px-6 py-6 sm:py-8 border-b border-base-content/10">
        <h2 className="text-base sm:text-lg font-semibold text-base-content">Two Wheels Zone</h2>
        <p className="text-xs text-base-content/50 mt-2">Inventory System</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-2 sm:px-3 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
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

      <div className="px-2 sm:px-4 py-4 sm:py-6 border-t border-base-content/10 space-y-3">
        <div className="px-2 sm:px-3 py-2 sm:py-3 bg-base-200/20 rounded-lg border border-base-content/10">
          <p className="text-xs font-medium text-base-content truncate">{userDisplayName}</p>
          <p className="text-xs text-base-content/60 capitalize">{userRole}</p>
        </div>
        <button type="button" className="btn btn-sm btn-outline w-full" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </div>
  )
}
