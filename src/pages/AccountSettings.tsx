import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { apiPatchJson, apiPostJson } from '../api/client'
import type { AuthUser } from '../api/types'

const USERNAME_RE = /^[a-z0-9._-]+$/

const Spinner = () => (
  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
  </svg>
)

const inputClass =
  'w-full rounded-lg border border-base-content/12 bg-base-100 px-3.5 py-2 text-sm text-base-content placeholder:text-base-content/30 outline-none focus:border-primary/60 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
const labelClass = 'block text-xs font-medium text-base-content/45 mb-1.5'
const cardClass = 'rounded-xl border border-base-content/8 bg-base-100 p-5 sm:p-6'

export function AccountSettings() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()

  // ── Profile ──────────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const profileChanged =
    displayName.trim() !== (user?.displayName ?? '') ||
    username.trim().toLowerCase() !== (user?.username ?? '')

  const handleSaveProfile = async () => {
    const dn = displayName.trim()
    const un = username.trim().toLowerCase()
    if (!dn) {
      showToast({ message: 'Display name is required.', durationMs: 4000, variant: 'error' })
      return
    }
    if (un.length < 3) {
      showToast({ message: 'Username must be at least 3 characters.', durationMs: 4000, variant: 'error' })
      return
    }
    if (!USERNAME_RE.test(un)) {
      showToast({ message: 'Username may only contain letters, numbers, dots, hyphens, and underscores.', durationMs: 5000, variant: 'error' })
      return
    }

    setSavingProfile(true)
    try {
      const res = await apiPatchJson<{ user: AuthUser; message: string }>('/auth/me', {
        displayName: dn,
        username: un,
      })
      updateUser(res.user)
      setDisplayName(res.user.displayName)
      setUsername(res.user.username)
      showToast({ message: 'Profile updated.', durationMs: 5000 })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Update failed'
      showToast({ message: `Failed to update profile. ${msg}`, durationMs: 7000, variant: 'error' })
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Password ─────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [retypePassword, setRetypePassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // New-password fields stay locked until the current password is entered.
  const passwordLocked = currentPassword.length === 0
  const retypeMismatch = retypePassword.length > 0 && newPassword !== retypePassword
  const canSubmitPassword =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    retypePassword.length > 0 &&
    newPassword === retypePassword

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showToast({ message: 'Enter your current password first.', durationMs: 4000, variant: 'error' })
      return
    }
    if (newPassword.length < 8) {
      showToast({ message: 'New password must be at least 8 characters.', durationMs: 4000, variant: 'error' })
      return
    }
    if (newPassword !== retypePassword) {
      showToast({ message: 'New password and retype do not match.', durationMs: 4000, variant: 'error' })
      return
    }

    setChangingPassword(true)
    try {
      await apiPostJson<{ message: string }>('/auth/change-password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setRetypePassword('')
      showToast({ message: 'Password changed.', durationMs: 5000 })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Change failed'
      showToast({ message: `Failed to change password. ${msg}`, durationMs: 7000, variant: 'error' })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">
            {user?.role === 'admin' ? 'Admin' : 'Operator'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Account settings</h1>
          <p className="text-sm text-base-content/45 mt-1">Update your display name, username, and password.</p>
        </header>

        <div className="space-y-5">
          {/* Profile */}
          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-base-content mb-4">Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Display name</label>
                <input
                  className={inputClass}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className={labelClass}>Username</label>
                <input
                  className={inputClass}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Email</label>
              <input className={inputClass} value={user?.email ?? ''} disabled readOnly />
              <p className="text-[11px] text-base-content/35 mt-1">Email can’t be changed here.</p>
            </div>
            <div className="flex justify-end mt-5">
              <button
                type="button"
                className="btn btn-primary btn-sm min-w-[7.5rem]"
                disabled={savingProfile || !profileChanged}
                onClick={() => void handleSaveProfile()}
              >
                {savingProfile ? <Spinner /> : 'Save changes'}
              </button>
            </div>
          </section>

          {/* Change password */}
          <section className={cardClass}>
            <h2 className="text-sm font-semibold text-base-content mb-1">Change password</h2>
            <p className="text-xs text-base-content/45 mb-4">Enter your current password to unlock the new password fields.</p>

            <div>
              <label className={labelClass}>Current password</label>
              <input
                type="password"
                className={inputClass}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                autoComplete="current-password"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelClass}>New password</label>
                <input
                  type="password"
                  className={inputClass}
                  value={newPassword}
                  disabled={passwordLocked}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <p className="text-[11px] text-base-content/35 mt-1">At least 8 characters.</p>
              </div>
              <div>
                <label className={labelClass}>Retype new password</label>
                <input
                  type="password"
                  className={inputClass}
                  value={retypePassword}
                  disabled={passwordLocked}
                  onChange={(e) => setRetypePassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
                {retypeMismatch && <p className="text-[11px] text-error mt-1">Passwords don’t match.</p>}
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                type="button"
                className="btn btn-primary btn-sm min-w-[9rem]"
                disabled={changingPassword || !canSubmitPassword}
                onClick={() => void handleChangePassword()}
              >
                {changingPassword ? <Spinner /> : 'Update password'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
