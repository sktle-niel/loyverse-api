import { useEffect, useState } from 'react'
import { apiPostJson } from '../api/client'
import type { PublicUser } from '../api/types'
import { useOperators } from '../hooks/useOperators'
import { useToast } from '../context/ToastContext'

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.48-3.397M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  )
}

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
      setEmail('')
      setUsername('')
      setPassword('')
      setDisplayName('')
      await refetch()
      showToast({ message: 'Operator account created.', durationMs: 6000 })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create operator')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="border-b border-base-300 pb-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-base-content/50 mb-1">
                Administration
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content tracking-tight">
                Operator accounts
              </h1>
              <p className="text-base-content/60 text-sm sm:text-base mt-2 max-w-2xl">
                Create accounts for store staff. Operators sign in with <strong>username</strong> or{' '}
                <strong>email</strong> and only access inventory.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm shrink-0"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              Refresh list
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
          {/* Create form — left on xl */}
          <section className="xl:col-span-5">
            <div className="card bg-base-100 shadow border border-base-200 h-full">
              <div className="card-body p-5 sm:p-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0">
                    <UsersIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-base-content">New operator</h2>
                    <p className="text-sm text-base-content/55 mt-0.5">
                      All fields except display name are required.
                    </p>
                  </div>
                </div>

                {formError ? (
                  <div role="alert" className="alert alert-error text-sm mb-6 py-3">
                    <span>{formError}</span>
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="form-control w-full">
                    <label className="label pt-0 pb-1" htmlFor="op-email">
                      <span className="label-text font-medium text-base-content">Work email</span>
                    </label>
                    <input
                      id="op-email"
                      type="email"
                      autoComplete="email"
                      className="input input-bordered w-full bg-base-100"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                    />
                    <p className="text-xs text-base-content/50 mt-1.5 px-0.5">
                      Used for sign-in (same as username).
                    </p>
                  </div>

                  <div className="form-control w-full">
                    <label className="label pt-0 pb-1" htmlFor="op-username">
                      <span className="label-text font-medium text-base-content">Username</span>
                    </label>
                    <input
                      id="op-username"
                      type="text"
                      autoComplete="username"
                      className="input input-bordered w-full bg-base-100 font-mono text-sm"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. maria.store"
                      required
                      minLength={3}
                    />
                    <p className="text-xs text-base-content/50 mt-1.5 px-0.5">
                      Lowercase letters, numbers, dots, hyphens, underscores (min 3).
                    </p>
                  </div>

                  <div className="form-control w-full">
                    <label className="label pt-0 pb-1" htmlFor="op-display">
                      <span className="label-text font-medium text-base-content">
                        Display name
                        <span className="text-base-content/45 font-normal"> (optional)</span>
                      </span>
                    </label>
                    <input
                      id="op-display"
                      type="text"
                      autoComplete="name"
                      className="input input-bordered w-full bg-base-100"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Shown in sidebar after login"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label pt-0 pb-1" htmlFor="op-password">
                      <span className="label-text font-medium text-base-content">Initial password</span>
                    </label>
                    <input
                      id="op-password"
                      type="password"
                      autoComplete="new-password"
                      className="input input-bordered w-full bg-base-100"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-base-content/50 mt-1.5 px-0.5">
                      Share this securely with the operator; they can change it later if you add that flow.
                    </p>
                  </div>

                  <div className="divider my-2 opacity-50" />

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm sm:btn-md"
                      disabled={saving}
                      onClick={() => {
                        setEmail('')
                        setUsername('')
                        setPassword('')
                        setDisplayName('')
                        setFormError(null)
                      }}
                    >
                      Clear form
                    </button>
                    <button type="submit" className="btn btn-primary sm:btn-md min-w-[9rem]" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="loading loading-spinner loading-sm" />
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

          {/* Operator list — right on xl */}
          <section className="xl:col-span-7 min-w-0">
            <div className="card bg-base-100 shadow border border-base-200 h-full flex flex-col">
              <div className="card-body p-5 sm:p-6 flex flex-col flex-1 min-h-[16rem]">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-base-content">Team directory</h2>
                    <p className="text-sm text-base-content/55 mt-0.5">Active operator accounts</p>
                  </div>
                  <span className="badge badge-neutral badge-outline font-mono text-xs">
                    {operators.length} {operators.length === 1 ? 'operator' : 'operators'}
                  </span>
                </div>

                {error ? (
                  <div role="alert" className="alert alert-error text-sm shrink-0">
                    <span>{error}</span>
                  </div>
                ) : isLoading ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12">
                    <span className="loading loading-spinner loading-lg text-primary" />
                    <p className="text-sm text-base-content/50">Loading operators…</p>
                  </div>
                ) : operators.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-box border border-dashed border-base-300 bg-base-200/40 px-6 py-14 text-center">
                    <div className="rounded-full bg-base-300/50 p-4 text-base-content/35 mb-4">
                      <UsersIcon className="w-10 h-10" />
                    </div>
                    <p className="font-medium text-base-content">No operators yet</p>
                    <p className="text-sm text-base-content/55 max-w-sm mt-1">
                      When you create an account with the form, it will appear here with username and email.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-base-200 -mx-0.5">
                    <table className="table table-sm sm:table-md text-sm">
                      <thead>
                        <tr className="bg-base-200 text-base-content/80">
                          <th className="font-semibold">Display name</th>
                          <th className="font-semibold">Username</th>
                          <th className="font-semibold">Email</th>
                          <th className="font-semibold whitespace-nowrap w-1">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operators.map((op) => (
                          <tr key={op.id} className="hover:bg-base-200/50 border-b border-base-200 last:border-0">
                            <td className="font-medium text-base-content">{op.displayName}</td>
                            <td>
                              <code className="text-xs bg-base-200 px-1.5 py-0.5 rounded">{op.username}</code>
                            </td>
                            <td className="text-base-content/80 max-w-[12rem] truncate" title={op.email}>
                              {op.email}
                            </td>
                            <td className="text-xs text-base-content/50 whitespace-nowrap">
                              {new Date(op.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
