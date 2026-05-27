import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { useLoginForm } from '../hooks/useLoginForm'
import { FormInput } from './FormInput'
import { FormButton } from './FormButton'
import { LogoHeader } from './LogoHeader'
import { LoginCard } from './LoginCard'
import { LoginFooter } from './LoginFooter'
import { ThemeToggleButton } from './ThemeToggleButton'
import { LOGIN_CONSTANTS } from '../constants/loginConstants'

export function Login() {
  const { login } = useAuth()
  const { toggle, theme } = useTheme()
  const form = useLoginForm()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    form.setLoading(true)

    try {
      await login(form.login.trim(), form.password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      form.setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LogoHeader />

          <LoginCard title={LOGIN_CONSTANTS.CARD.TITLE} subtitle={LOGIN_CONSTANTS.CARD.SUBTITLE}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="alert alert-error text-sm py-2">
                  <span>{error}</span>
                </div>
              ) : null}

              <FormInput
                label="Username or email"
                type="text"
                placeholder="username or you@company.com"
                value={form.login}
                onChange={(e) => form.setLogin(e.target.value)}
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

              <FormButton fullWidth loading={form.loading}>
                {form.loading ? LOGIN_CONSTANTS.BUTTON.SIGNING_IN : LOGIN_CONSTANTS.BUTTON.SIGN_IN}
              </FormButton>
            </form>
          </LoginCard>

          <LoginFooter copyrightText={LOGIN_CONSTANTS.FOOTER.COPYRIGHT} />
        </div>
      </div>

      <ThemeToggleButton onToggle={toggle} currentTheme={theme} />
    </>
  )
}
