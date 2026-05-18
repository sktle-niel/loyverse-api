// Reusable form button component
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
  const baseClasses = 'btn font-semibold'
  const widthClasses = fullWidth ? 'w-full' : ''
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
  }

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClasses} ${loading ? 'loading' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
