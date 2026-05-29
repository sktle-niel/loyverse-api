interface LoginCardProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function LoginCard({ children, title, subtitle }: LoginCardProps) {
  return (
    <div className="bg-base-100 border border-base-content/8 rounded-xl shadow-sm">
      <div className="px-7 py-8">
        <h2 className="text-lg font-semibold text-base-content tracking-tight mb-1">{title}</h2>
        <p className="text-sm text-base-content/50 mb-7">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}
