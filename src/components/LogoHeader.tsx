// Logo and branding header
interface LogoHeaderProps {
  title?: string
  subtitle?: string
}

export function LogoHeader({
  title = 'Loyverse',
  subtitle = 'API Integration Management System',
}: LogoHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">L</span>
        </div>
        <h1 className="text-3xl font-bold text-primary">{title}</h1>
      </div>
      <p className="text-base-content/70 font-medium">{subtitle}</p>
    </div>
  )
}
