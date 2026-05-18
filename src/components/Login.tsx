import { useTheme } from '../hooks/useTheme'
import { useLoginForm } from '../hooks/useLoginForm'
import { FormInput } from './FormInput'
import { FormButton } from './FormButton'
import { FormCheckbox } from './FormCheckbox'
import { LogoHeader } from './LogoHeader'
import { LoginCard } from './LoginCard'
import { LoginFooter } from './LoginFooter'
import { ThemeToggleButton } from './ThemeToggleButton'
import { LOGIN_CONSTANTS } from '../constants/loginConstants'

export function Login() {
  const { toggle, theme } = useTheme()
  const form = useLoginForm()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.setLoading(true)
    // Backend integration will go here
    setTimeout(() => form.setLoading(false), 1000)
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LogoHeader />

          <LoginCard title={LOGIN_CONSTANTS.CARD.TITLE} subtitle={LOGIN_CONSTANTS.CARD.SUBTITLE}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label={LOGIN_CONSTANTS.FORM.EMAIL_LABEL}
                type="email"
                placeholder={LOGIN_CONSTANTS.FORM.EMAIL_PLACEHOLDER}
                value={form.email}
                onChange={(e) => form.setEmail(e.target.value)}
                required
              />

              <FormInput
                label={LOGIN_CONSTANTS.FORM.PASSWORD_LABEL}
                type={form.showPassword ? 'text' : 'password'}
                placeholder={LOGIN_CONSTANTS.FORM.PASSWORD_PLACEHOLDER}
                value={form.password}
                onChange={(e) => form.setPassword(e.target.value)}
                required
                icon={form.showPassword ? '👁️' : '👁️‍🗨️'}
                onIconClick={form.toggleShowPassword}
              />

              <div className="flex items-center justify-between">
                <FormCheckbox
                  label={LOGIN_CONSTANTS.FORM.REMEMBER_ME}
                  checked={form.rememberMe}
                  onChange={(e) => form.setRememberMe(e.target.checked)}
                />
                <a href="#" className="link link-primary text-sm font-medium">
                  Forgot password?
                </a>
              </div>

              <FormButton fullWidth loading={form.loading}>
                {form.loading ? LOGIN_CONSTANTS.BUTTON.SIGNING_IN : LOGIN_CONSTANTS.BUTTON.SIGN_IN}
              </FormButton>
            </form>

            <div className="divider text-xs text-base-content/40 my-4">OR</div>

            <div className="bg-base-200 rounded-lg p-4 text-center">
              <p className="text-sm text-base-content/70 mb-2">{LOGIN_CONSTANTS.FOOTER.NO_ACCOUNT}</p>
              <p className="text-xs text-base-content/60">
                {LOGIN_CONSTANTS.FOOTER.REQUEST_ACCESS.split('request access')[0]}
                <a href="#" className="link link-primary font-medium">
                  {LOGIN_CONSTANTS.FOOTER.REQUEST_LINK}
                </a>
              </p>
            </div>
          </LoginCard>

          <LoginFooter copyrightText={LOGIN_CONSTANTS.FOOTER.COPYRIGHT} />
        </div>
      </div>

      <ThemeToggleButton onToggle={toggle} currentTheme={theme} />
    </>
  )
}
