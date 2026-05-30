import { useEffect, useState } from 'react'
import { apiPostJson } from '../api/client'
import type { PublicUser } from '../api/types'
import { useOperators } from '../hooks/useOperators'
import { useToast } from '../context/ToastContext'

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

const inputClass = 'w-full rounded-lg border border-base-content/12 bg-base-200/50 px-3.5 py-2.5 text-sm text-base-content placeholder:text-base-content/30 transition-colors duration-150 outline-none focus:border-primary/60 focus:bg-base-200'
const labelClass = 'block text-xs font-medium text-base-content/60 mb-1.5'
const hintClass = 'mt-1.5 text-xs text-base-content/35'

export function AdminOperators() {
  const { showToast } = useToast()
  const { operators, isLoading, error, refetch } = useOperators()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!displayName && username) {
      setDisplayName(username)
    }
  }, [username, displayName])

  const handleClear = () => {
    setEmail('')
    setUsername('')
    setPassword('')
    setDisplayName('')
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      await apiPostJson<{ operator: PublicUser; message: string }>('/users/operators', {
        email: email.trim(),
        username: username.trim(),
        password,
        displayName: displayName.trim() || username.trim(),
      })
      handleClear()
      await refetch()
      showToast({ message: 'Operator account created.', durationMs: 6000 })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create operator')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Administration</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Operator accounts</h1>
            <p className="text-sm text-base-content/45 mt-1 max-w-xl">
              Create accounts for store staff. Operators sign in with <strong className="text-base-content/70 font-medium">username</strong> or{' '}
              <strong className="text-base-content/70 font-medium">email</strong> and only access inventory.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content border border-base-content/10 hover:border-base-content/20 shrink-0"
            onClick={() => void refetch()}
            disabled={isLoading}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Create form */}
          <section className="xl:col-span-5">
            <div className="rounded-xl border border-base-content/8 bg-base-100 h-full">
              <div className="px-6 py-5 border-b border-base-content/8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <UsersIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-base-content">New operator</h2>
                    <p className="text-xs text-base-content/45 mt-0.5">All fields except display name are required</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                {formError ? (
                  <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-3.5 py-3 text-sm text-error mb-5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{formError}</span>
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={labelClass} htmlFor="op-email">Work email</label>
                    <input id="op-email" type="email" autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required />
                    <p className={hintClass}>Used for sign-in alongside username.</p>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="op-username">Username</label>
                    <input id="op-username" type="text" autoComplete="username" className={`${inputClass} font-mono`} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. maria.store" required minLength={3} />
                    <p className={hintClass}>Lowercase, dots, hyphens, underscores (min 3 chars).</p>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="op-display">
                      Display name{' '}
                      <span className="text-base-content/30 font-normal">(optional)</span>
                    </label>
                    <input id="op-display" type="text" autoComplete="name" className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Shown in sidebar after login" />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="op-password">Initial password</label>
                    <input id="op-password" type="password" autoComplete="new-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" required minLength={8} />
                    <p className={hintClass}>Share this securely with the operator.</p>
                  </div>

                  <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost text-base-content/50"
                      disabled={saving}
                      onClick={handleClear}
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary min-w-[8rem]"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                          </svg>
                          Creating…
                        </>
                      ) : (
                        'Create operator'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* Operator list */}
          <section className="xl:col-span-7 min-w-0">
            <div className="rounded-xl border border-base-content/8 bg-base-100 h-full flex flex-col">
              <div className="px-6 py-5 border-b border-base-content/8 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-base-content">Team directory</h2>
                  <p className="text-xs text-base-content/45 mt-0.5">Active operator accounts</p>
                </div>
                <span className="text-xs font-medium text-base-content/40 tabular bg-base-content/6 px-2.5 py-1 rounded-full">
                  {operators.length} {operators.length === 1 ? 'operator' : 'operators'}
                </span>
              </div>

              <div className="flex-1 min-h-[16rem]">
                {error ? (
                  <div role="alert" className="m-5 flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-3.5 py-3 text-sm text-error">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                  </div>
                ) : isLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <svg className="animate-spin text-primary" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                    </svg>
                    <p className="text-xs text-base-content/40">Loading operators…</p>
                  </div>
                ) : operators.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="w-12 h-12 rounded-xl bg-base-content/6 flex items-center justify-center mb-4">
                      <UsersIcon className="w-6 h-6 text-base-content/30" />
                    </div>
                    <p className="text-sm font-medium text-base-content/60">No operators yet</p>
                    <p className="text-xs text-base-content/35 mt-1 max-w-xs">
                      Create an account with the form and it will appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile: card layout */}
                    <div className="sm:hidden divide-y divide-base-content/6">
                      {operators.map((op, index) => (
                        <div
                          key={op.id}
                          className="p-4 space-y-2 animate-row"
                          style={{ animationDelay: `${index * 25}ms` }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-primary text-xs font-semibold">
                                {op.displayName?.[0]?.toUpperCase() ?? '?'}
                              </span>
                            </div>
                            <p className="font-medium text-sm text-base-content">{op.displayName}</p>
                          </div>
                          <div className="text-xs text-base-content/55 space-y-0.5 pl-[2.625rem]">
                            <div className="flex items-center justify-between gap-2">
                              <code className="font-mono bg-base-content/8 px-1.5 py-0.5 rounded text-base-content/70">{op.username}</code>
                              <span className="text-base-content/40 tabular">{new Date(op.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="truncate" title={op.email}>{op.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: table layout */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-base-content/8 bg-base-content/3">
                            <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Display name</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Username</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Email</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide whitespace-nowrap">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {operators.map((op, index) => (
                            <tr
                              key={op.id}
                              className="border-b border-base-content/6 last:border-0 hover:bg-base-content/3 transition-colors duration-100 animate-row"
                              style={{ animationDelay: `${index * 25}ms` }}
                            >
                              <td className="py-3.5 px-4 font-medium text-base-content">{op.displayName}</td>
                              <td className="py-3.5 px-4">
                                <code className="text-xs font-mono bg-base-content/8 px-1.5 py-0.5 rounded text-base-content/70">{op.username}</code>
                              </td>
                              <td className="py-3.5 px-4 text-base-content/55 text-xs max-w-[12rem] truncate" title={op.email}>
                                {op.email}
                              </td>
                              <td className="py-3.5 px-4 text-base-content/40 text-xs tabular whitespace-nowrap">
                                {new Date(op.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
