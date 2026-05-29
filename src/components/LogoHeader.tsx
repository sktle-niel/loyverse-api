interface LogoHeaderProps {
  title?: string
  subtitle?: string
}

export function LogoHeader({
  title = 'Two Wheels Zone',
  subtitle = 'Inventory Management System',
}: LogoHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="w-9 h-9 bg-primary/15 border border-primary/25 rounded-lg flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-base-content">{title}</h1>
      </div>
      <p className="text-xs text-base-content/45 tracking-wide font-medium uppercase">{subtitle}</p>
    </div>
  )
}
