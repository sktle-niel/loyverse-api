interface FormButtonProps {
  children: React.ReactNode
  type?: 'submit' | 'button' | 'reset'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  fullWidth?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function FormButton({
  children,
  type = 'submit',
  loading = false,
  disabled = false,
  onClick,
  fullWidth = false,
  variant = 'primary',
}: FormButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-primary text-primary-content hover:bg-primary/90',
    secondary: 'bg-base-200 text-base-content hover:bg-base-300',
    ghost: 'bg-transparent text-base-content/70 hover:bg-base-content/8 hover:text-base-content',
  }

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  )
}
