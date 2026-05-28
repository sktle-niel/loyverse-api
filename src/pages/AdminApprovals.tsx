import { useEffect, useMemo, useState } from 'react'
import { useStockRequests } from '../hooks/useStockRequests'
import { useStores } from '../hooks/useStores'
import { useToast } from '../context/ToastContext'

const STORAGE_KEY = 'submittedApprovals'
const STALE_MS = 10 * 60 * 1000 // 10 minutes

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

  // bgTick increments whenever localStorage changes, forcing backgroundIds to re-derive
  const [bgTick, setBgTick] = useState(0)
  const backgroundIds = useMemo(() => readStoredIds(), [bgTick])

  const storeNameById = useMemo(
    () => new Map(stores.map((s) => [s.id, s.name])),
    [stores],
  )

  // When pending list loads, check if any backgroundIds have already been approved
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

  // Auto-poll every 15s while there are background approvals in progress
  useEffect(() => {
    if (backgroundIds.size === 0) return
    const interval = setInterval(() => { void refetch('pending') }, 15_000)
    return () => clearInterval(interval)
  }, [backgroundIds, refetch])

  const handleApprove = async (id: string) => {
    // Write to localStorage FIRST — survives a Ctrl+R mid-flight
    writeStoredId(id)
    setBgTick((t) => t + 1)
    setApprovingIds((prev) => new Set(prev).add(id))
    try {
      await approveRequest(id, 'Admin')
      // Success — remove from background tracker, mark done
      deleteStoredId(id)
      setBgTick((t) => t + 1)
      setDoneIds((prev) => new Set(prev).add(id))
      showToast({ message: 'Approved. Stock updated in Loyverse.', durationMs: 6000 })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to approve request.'
      if (msg.includes('Route GET') || msg.includes('timed out')) {
        // Keep in localStorage — backend is still processing
        showToast({
          message: 'Approval submitted. Server is processing — will update in ~1 minute.',
          durationMs: 15000,
        })
      } else {
        // Real error — remove from localStorage so admin can retry
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
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-2">
              Stock Approvals
            </h1>
            <p className="text-base-content/60 text-sm sm:text-base">
              Review pending stock changes submitted by operators.
            </p>
          </div>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => refetch('pending')}>
            Refresh
          </button>
        </div>

        {error ? (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        ) : null}

        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 min-h-32 w-full">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : stockRequests.length === 0 ? (
              <p className="text-base-content/60 py-8 text-center">No pending requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table text-sm">
                  <thead className="bg-base-200">
                    <tr>
                      <th>Item</th>
                      <th>Branch</th>
                      <th>Stock change</th>
                      <th>Requested by</th>
                      <th>When</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockRequests.map((req) => {
                      const isApproving = approvingIds.has(req.id)
                      const isRejecting = rejectingIds.has(req.id)
                      const isDone = doneIds.has(req.id)
                      const isBackground = backgroundIds.has(req.id)
                      const isDisabled = isApproving || isRejecting || isDone || isBackground

                      return (
                        <tr key={req.id} className="border-b border-base-200">
                          <td className="font-medium text-base-content">{req.itemName}</td>
                          <td className="text-base-content/80">
                            {req.storeName ||
                              storeNameById.get(req.storeId) ||
                              req.storeId}
                          </td>
                          <td className="text-base-content/70 text-xs whitespace-nowrap">
                            {req.newStock}
                          </td>
                          <td className="text-base-content/70">{req.requestedBy}</td>
                          <td className="text-base-content/60 text-xs whitespace-nowrap">
                            {new Date(req.createdAt).toLocaleString()}
                          </td>
                          <td>
                            {isBackground ? (
                              <span className="flex items-center gap-1.5 text-xs text-base-content/50">
                                <span className="loading loading-spinner loading-xs" />
                                Processing…
                              </span>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-success min-w-[72px]"
                                  disabled={isDisabled}
                                  onClick={() => void handleApprove(req.id)}
                                >
                                  {isApproving ? (
                                    <span className="loading loading-spinner loading-xs" />
                                  ) : (
                                    'Approve'
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-error min-w-[60px]"
                                  disabled={isDisabled}
                                  onClick={() => void handleReject(req.id)}
                                >
                                  {isRejecting ? (
                                    <span className="loading loading-spinner loading-xs" />
                                  ) : (
                                    'Reject'
                                  )}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
