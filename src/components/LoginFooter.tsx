// Footer component with copyright
interface LoginFooterProps {
  copyrightText?: string
}

export function LoginFooter({
  copyrightText = '© 2026 Two Wheels Zone Motor Parts Trading. All rights reserved.',
}: LoginFooterProps) {
  return (
    <div className="mt-6 text-xs text-base-content/50 text-center">
      <p>{copyrightText}</p>
    </div>
  )
}
