// Form input component with label and validation styling
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
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold text-base-content">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          className={`input input-bordered w-full focus:input-primary ${
            error ? 'input-error' : ''
          } ${icon ? 'pr-10' : ''}`}
          value={value}
          onChange={onChange}
          required={required}
        />
        {icon && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
            onClick={onIconClick}
          >
            {icon}
          </button>
        )}
      </div>
      {error && <label className="label"><span className="label-text-alt text-error">{error}</span></label>}
    </div>
  )
}
