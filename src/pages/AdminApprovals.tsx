import { useEffect, useMemo, useState } from 'react'
import { useStockRequests } from '../hooks/useStockRequests'
import { useStores } from '../hooks/useStores'
import { useToast } from '../context/ToastContext'

const STORAGE_KEY = 'submittedApprovals'
const STALE_MS = 10 * 60 * 1000

function readStoredIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const entries = JSON.parse(raw) as Array<{ id: string; submittedAt: number }>
    const now = Date.now()
    return new Set(
      entries.filter((e) => now - e.submittedAt < STALE_MS).map((e) => e.id),
    )
  } catch {
    return new Set()
  }
}

function writeStoredId(id: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const entries: Array<{ id: string; submittedAt: number }> = raw ? JSON.parse(raw) : []
    const updated = entries.filter((e) => e.id !== id)
    updated.push({ id, submittedAt: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }
}

function deleteStoredId(id: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const entries: Array<{ id: string; submittedAt: number }> = JSON.parse(raw)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.filter((e) => e.id !== id)))
  } catch { /* ignore */ }
}

function SkeletonRow() {
  return (
    <tr className="border-b border-base-content/6">
      {[42, 22, 18, 18, 20, 14].map((w, i) => (
        <td key={i} className="py-3.5 px-4">
          <div className="h-3 rounded bg-base-content/8 animate-pulse" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function AdminApprovals() {
  const { showToast } = useToast()
  const { stores } = useStores()
  const {
    requests: stockRequests,
    isLoading,
    error,
    approveRequest,
    rejectRequest,
    refetch,
  } = useStockRequests('pending', true)

  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set())
  const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set())
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [bgTick, setBgTick] = useState(0)
  const backgroundIds = useMemo(() => readStoredIds(), [bgTick])

  const storeNameById = useMemo(
    () => new Map(stores.map((s) => [s.id, s.name])),
    [stores],
  )

  useEffect(() => {
    if (isLoading || backgroundIds.size === 0) return
    const pendingIdSet = new Set(stockRequests.map((r) => r.id))
    for (const id of backgroundIds) {
      if (!pendingIdSet.has(id)) {
        deleteStoredId(id)
        setBgTick((t) => t + 1)
        showToast({ message: 'Approval completed. Stock updated in Loyverse.', durationMs: 6000 })
      }
    }
  }, [isLoading, stockRequests, backgroundIds, showToast])

  useEffect(() => {
    if (backgroundIds.size === 0) return
    const interval = setInterval(() => { void refetch('pending') }, 15_000)
    return () => clearInterval(interval)
  }, [backgroundIds, refetch])

  const handleApprove = async (id: string) => {
    writeStoredId(id)
    setBgTick((t) => t + 1)
    setApprovingIds((prev) => new Set(prev).add(id))
    try {
      await approveRequest(id, 'Admin')
      deleteStoredId(id)
      setBgTick((t) => t + 1)
      setDoneIds((prev) => new Set(prev).add(id))
      showToast({ message: 'Approved. Stock updated in Loyverse.', durationMs: 6000 })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to approve request.'
      if (msg.includes('Route GET') || msg.includes('timed out')) {
        showToast({
          message: 'Approval submitted. Server is processing — will update in ~1 minute.',
          durationMs: 15000,
        })
      } else {
        deleteStoredId(id)
        setBgTick((t) => t + 1)
        showToast({ message: `Approve failed: ${msg}`, durationMs: 8000 })
      }
    } finally {
      setApprovingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const handleReject = async (id: string) => {
    setRejectingIds((prev) => new Set(prev).add(id))
    try {
      await rejectRequest(id, 'Admin')
      setDoneIds((prev) => new Set(prev).add(id))
      showToast({ message: 'Request rejected.', durationMs: 6000 })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to reject request.'
      showToast({ message: `Reject failed: ${msg}`, durationMs: 6000 })
    } finally {
      setRejectingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Stock approvals</h1>
            <p className="text-sm text-base-content/45 mt-1">Review pending stock changes submitted by operators</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content border border-base-content/10 hover:border-base-content/20 shrink-0"
            onClick={() => refetch('pending')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
        </header>

        {error ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-4 py-3 text-sm text-error mb-5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        ) : null}

        <div className="rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-content/8 bg-base-content/3">
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Branch</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Stock change</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Requested by</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">When</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : stockRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <p className="text-sm text-base-content/40">No pending requests</p>
                    </td>
                  </tr>
                ) : (
                  stockRequests.map((req, index) => {
                    const isApproving = approvingIds.has(req.id)
                    const isRejecting = rejectingIds.has(req.id)
                    const isDone = doneIds.has(req.id)
                    const isBackground = backgroundIds.has(req.id)
                    const isDisabled = isApproving || isRejecting || isDone || isBackground

                    return (
                      <tr
                        key={req.id}
                        className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row"
                        style={{ animationDelay: `${index * 25}ms` }}
                      >
                        <td className="py-3.5 px-4 font-medium text-base-content">{req.itemName}</td>
                        <td className="py-3.5 px-4 text-base-content/60">
                          {req.storeName || storeNameById.get(req.storeId) || req.storeId}
                        </td>
                        <td className="py-3.5 px-4 text-base-content/60 tabular text-xs whitespace-nowrap">{req.newStock}</td>
                        <td className="py-3.5 px-4 text-base-content/60">{req.requestedBy}</td>
                        <td className="py-3.5 px-4 text-base-content/45 text-xs tabular whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {isBackground ? (
                            <span className="flex items-center gap-1.5 text-xs text-base-content/40">
                              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                              </svg>
                              Processing…
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed min-w-[4.5rem] justify-center"
                                disabled={isDisabled}
                                onClick={() => void handleApprove(req.id)}
                              >
                                {isApproving ? (
                                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                                  </svg>
                                ) : (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                                Approve
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed min-w-[3.75rem] justify-center"
                                disabled={isDisabled}
                                onClick={() => void handleReject(req.id)}
                              >
                                {isRejecting ? (
                                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                                  </svg>
                                ) : (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                )}
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
