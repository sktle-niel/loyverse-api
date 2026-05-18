// Login card wrapper component
interface LoginCardProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function LoginCard({ children, title, subtitle }: LoginCardProps) {
  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <h2 className="text-2xl font-bold text-base-content mb-2">{title}</h2>
        <p className="text-base-content/60 text-sm mb-6">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}
