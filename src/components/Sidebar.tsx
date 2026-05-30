import { NavLink } from 'react-router-dom'
import { ROUTES, USER_MANUAL_URL } from '../constants/app'
import { NotificationBell } from './NotificationBell'

interface SidebarProps {
  isAdmin: boolean
  userDisplayName: string
  userRole: 'admin' | 'operator'
  onLogout: () => void
  onPageChange: () => void
}

const DashboardIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
)

const InventoryIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

const ApprovalsIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const OperatorsIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
)

const QueueIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const HistoryIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="12 8 12 12 14 14" />
    <path d="M3.05 11a9 9 0 118.83-7.63" />
    <polyline points="3 4 3 11 10 11" />
  </svg>
)

const ManualIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
)

const SignOutIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export function Sidebar({ isAdmin, userDisplayName, userRole, onLogout, onPageChange }: SidebarProps) {
  const menuItems = [
    ...(isAdmin ? [{ path: ROUTES.DASHBOARD, label: 'Dashboard', icon: DashboardIcon }] : []),
    ...(!isAdmin ? [
      { path: ROUTES.INVENTORY, label: 'Inventory', icon: InventoryIcon },
      { path: ROUTES.QUEUE, label: 'My Requests', icon: QueueIcon },
    ] : []),
    ...(isAdmin ? [
      { path: ROUTES.APPROVALS, label: 'Approvals', icon: ApprovalsIcon },
      { path: ROUTES.HISTORY, label: 'History', icon: HistoryIcon },
      { path: ROUTES.OPERATORS, label: 'Operators', icon: OperatorsIcon },
    ] : []),
  ]

  const initial = userDisplayName?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="sidebar-container h-full flex flex-col">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-base-content/8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-base-content leading-tight tracking-tight">Two Wheels Zone</p>
            <p className="text-[10px] text-base-content/40 leading-tight">Inventory System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5" aria-label="Main navigation">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onPageChange}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg relative transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-base-content/55 hover:text-base-content hover:bg-base-content/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-[0.4rem] bottom-[0.4rem] w-0.5 rounded-r-full bg-primary" />
                  )}
                  <Icon />
                  <span className="text-sm">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-base-content/8 space-y-2.5">
        {/* User card */}
        <div className="px-3 py-2.5 rounded-lg bg-base-content/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-primary text-xs font-semibold">{initial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-base-content truncate leading-tight">{userDisplayName}</p>
              <p className="text-[10px] text-base-content/45 capitalize leading-tight">{userRole}</p>
            </div>
          </div>
        </div>

        {/* Push notifications — admin only */}
        {isAdmin && <NotificationBell />}

        {/* Actions */}
        <a
          href={USER_MANUAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-content/5 transition-all duration-150 text-sm"
        >
          <ManualIcon />
          <span className="text-xs">User manual</span>
        </a>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-base-content/50 hover:text-error hover:bg-error/8 transition-all duration-150"
        >
          <SignOutIcon />
          <span className="text-xs">Sign out</span>
        </button>
      </div>
    </div>
  )
}
