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
      <div className="min-h-dvh bg-base-200 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-primary/4 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-sm relative z-10 page-enter">
          <LogoHeader />

          <LoginCard title={LOGIN_CONSTANTS.CARD.TITLE} subtitle={LOGIN_CONSTANTS.CARD.SUBTITLE}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? (
                <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-3.5 py-3 text-sm text-error">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
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
                icon={
                  form.showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )
                }
                onIconClick={form.toggleShowPassword}
              />

              <div className="pt-1">
                <FormButton fullWidth loading={form.loading}>
                  {form.loading ? LOGIN_CONSTANTS.BUTTON.SIGNING_IN : LOGIN_CONSTANTS.BUTTON.SIGN_IN}
                </FormButton>
              </div>
            </form>
          </LoginCard>

          <LoginFooter copyrightText={LOGIN_CONSTANTS.FOOTER.COPYRIGHT} />
        </div>
      </div>

      <ThemeToggleButton onToggle={toggle} currentTheme={theme} />
    </>
  )
}
