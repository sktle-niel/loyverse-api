interface LoginFooterProps {
  copyrightText?: string
}

export function LoginFooter({
  copyrightText = '© 2026 Two Wheels Zone Motor Parts Trading',
}: LoginFooterProps) {
  return (
    <div className="mt-6 text-center">
      <p className="text-xs text-base-content/35">{copyrightText}</p>
    </div>
  )
}
