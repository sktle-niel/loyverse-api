interface FormInputProps {
  label: string
  type?: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  error?: string
  icon?: React.ReactNode
  onIconClick?: () => void
}

export function FormInput({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error,
  icon,
  onIconClick,
}: FormInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-base-content/70">
        {label}
        {required && <span className="text-error/80 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-base-200/50 px-3.5 py-2.5 text-sm text-base-content placeholder:text-base-content/30 transition-colors duration-150 outline-none focus:border-primary/60 focus:bg-base-200 ${
            error
              ? 'border-error/50 focus:border-error/70'
              : 'border-base-content/12'
          } ${icon ? 'pr-10' : ''}`}
          value={value}
          onChange={onChange}
          required={required}
        />
        {icon && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/35 hover:text-base-content/70 transition-colors"
            onClick={onIconClick}
          >
            {icon}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-error/80">{error}</p>}
    </div>
  )
}
