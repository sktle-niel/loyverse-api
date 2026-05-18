// Reusable checkbox component
interface FormCheckboxProps {
  label: string
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  size?: 'xs' | 'sm' | 'md'
}

export function FormCheckbox({
  label,
  checked,
  onChange,
  size = 'sm',
}: FormCheckboxProps) {
  const sizeClasses = {
    xs: 'checkbox-xs',
    sm: 'checkbox-sm',
    md: 'checkbox-md',
  }

  return (
    <label className="label cursor-pointer">
      <input
        type="checkbox"
        className={`checkbox ${sizeClasses[size]}`}
        checked={checked}
        onChange={onChange}
      />
      <span className="label-text text-sm ml-2">{label}</span>
    </label>
  )
}
