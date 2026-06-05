import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStockRequests } from '../hooks/useStockRequests'
import { useTransferRequests } from '../hooks/useTransferRequests'
import { useStores } from '../hooks/useStores'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

const STORAGE_KEY = 'submittedApprovals'
const TRANSFER_STORAGE_KEY = 'submittedTransferApprovals'
const STALE_MS = 10 * 60 * 1000
const TRANSFER_STALE_MS = 4 * 60 * 1000 // transfers timeout after 4 min — clears stuck Processing state

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

function readTransferStoredIds(): Set<string> {
  try {
    const raw = localStorage.getItem(TRANSFER_STORAGE_KEY)
    if (!raw) return new Set()
    const entries = JSON.parse(raw) as Array<{ id: string; submittedAt: number }>
    const now = Date.now()
    return new Set(entries.filter((e) => now - e.submittedAt < TRANSFER_STALE_MS).map((e) => e.id))
  } catch { return new Set() }
}

function writeTransferStoredId(id: string) {
  try {
    const raw = localStorage.getItem(TRANSFER_STORAGE_KEY)
    const entries: Array<{ id: string; submittedAt: number }> = raw ? JSON.parse(raw) : []
    const updated = entries.filter((e) => e.id !== id)
    updated.push({ id, submittedAt: Date.now() })
    localStorage.setItem(TRANSFER_STORAGE_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }
}

function deleteTransferStoredId(id: string) {
  try {
    const raw = localStorage.getItem(TRANSFER_STORAGE_KEY)
    if (!raw) return
    const entries: Array<{ id: string; submittedAt: number }> = JSON.parse(raw)
    localStorage.setItem(TRANSFER_STORAGE_KEY, JSON.stringify(entries.filter((e) => e.id !== id)))
  } catch { /* ignore */ }
}

function MobileSkeletonCard() {
  return (
    <div className="p-4 border-b border-base-content/6 space-y-2.5">
      <div className="h-3.5 rounded bg-base-content/8 animate-pulse w-3/5" />
      <div className="space-y-1.5">
        <div className="h-3 rounded bg-base-content/8 animate-pulse w-4/5" />
        <div className="h-3 rounded bg-base-content/8 animate-pulse w-3/5" />
      </div>
      <div className="flex gap-2 pt-0.5">
        <div className="h-7 rounded bg-base-content/8 animate-pulse w-20" />
        <div className="h-7 rounded bg-base-content/8 animate-pulse w-16" />
      </div>
    </div>
  )
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
  const { user } = useAuth()
  const { stores } = useStores()
  const {
    requests: stockRequests,
    isLoading,
    error,
    approveRequest,
    rejectRequest,
    refetch,
  } = useStockRequests('pending', true)

  const {
    requests: transferRequests,
    isLoading: isTransferLoading,
    hasFetched: transferHasFetched,
    fetchRequests: fetchTransfers,
    approveTransfer,
    rejectTransfer,
    fetchPendingStocks,
  } = useTransferRequests()

  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') === 'transfers' ? 'transfers' : 'stock') as 'stock' | 'transfers'
  const setActiveTab = (tab: 'stock' | 'transfers') => setSearchParams({ tab }, { replace: true })
  const [liveStockMap, setLiveStockMap] = useState<Map<string, number>>(new Map())
  const [isLiveChecking, setIsLiveChecking] = useState(false)
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set())
  const syncTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set())
  const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set())
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [bgTick, setBgTick] = useState(0)
  const [bgTransferTick, setBgTransferTick] = useState(0)
  const backgroundIds = useMemo(() => readStoredIds(), [bgTick])
  const backgroundTransferIds = useMemo(() => readTransferStoredIds(), [bgTransferTick])

  const refreshLiveStocks = useCallback(async () => {
    setIsLiveChecking(true)
    try {
      const stocks = await fetchPendingStocks()
      setLiveStockMap(new Map(stocks.map((s) => [`${s.variantId}:${s.storeId}`, s.stock])))
    } finally {
      setIsLiveChecking(false)
    }
    // errors propagate — callers wrap in .catch() or await inside try/catch
  }, [fetchPendingStocks])

  const handleSyncRequest = useCallback(async (id: string) => {
    setSyncingIds((prev) => new Set(prev).add(id))
    try {
      // Primary: direct Loyverse fetch — accurate, unaffected by cache lag.
      // Falls back to cache-based transfer list refresh if endpoint unavailable.
      try {
        await refreshLiveStocks()
      } catch {
        await fetchTransfers('pending')
      }
      setSyncedIds((prev) => new Set(prev).add(id))
      // Clear any existing 30s timer for this id and start a fresh one
      const existing = syncTimeoutsRef.current.get(id)
      if (existing) clearTimeout(existing)
      const t = setTimeout(() => {
        setSyncedIds((prev) => { const s = new Set(prev); s.delete(id); return s })
        syncTimeoutsRef.current.delete(id)
      }, 30_000)
      syncTimeoutsRef.current.set(id, t)
    } catch {
      showToast({ message: 'Failed to fetch transfer data. Please try again.', durationMs: 4000 })
    } finally {
      setSyncingIds((prev) => { const s = new Set(prev); s.delete(id); return s })
    }
  }, [fetchTransfers, refreshLiveStocks, showToast])

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

  useEffect(() => {
    void fetchTransfers('pending')
  }, [fetchTransfers])

  useEffect(() => {
    if (activeTab === 'transfers') void fetchTransfers('pending')
  }, [activeTab, fetchTransfers])

  // Detect when a background transfer approval completes
  useEffect(() => {
    if (!transferHasFetched || isTransferLoading || backgroundTransferIds.size === 0) return
    const pendingIdSet = new Set(transferRequests.map((r) => r.id))
    for (const id of backgroundTransferIds) {
      if (!pendingIdSet.has(id)) {
        deleteTransferStoredId(id)
        setBgTransferTick((t) => t + 1)
        showToast({ message: 'Transfer approved. Loyverse stock updated.', durationMs: 6000 })
      }
    }
  }, [transferHasFetched, isTransferLoading, transferRequests, backgroundTransferIds, showToast])

  // Poll transfer requests while a background approval is in-flight
  useEffect(() => {
    if (backgroundTransferIds.size === 0) return
    const interval = setInterval(() => { void fetchTransfers('pending') }, 15_000)
    return () => clearInterval(interval)
  }, [backgroundTransferIds, fetchTransfers])

  // Clear all sync timeouts on unmount
  useEffect(() => {
    const timeouts = syncTimeoutsRef.current
    return () => { for (const t of timeouts.values()) clearTimeout(t) }
  }, [])

  // Background live-stock poll while on transfers tab — silent, just keeps liveStockMap fresh.
  // Manual accuracy is handled by the per-row "Sync Now" button.
  useEffect(() => {
    if (activeTab !== 'transfers') return
    void refreshLiveStocks().catch(() => {})
    const interval = setInterval(() => {
      void refreshLiveStocks().catch(() => {})
      void fetchTransfers('pending')
    }, 15_000)
    return () => clearInterval(interval)
  }, [activeTab, refreshLiveStocks, fetchTransfers])

  const handleApproveTransfer = async (id: string) => {
    writeTransferStoredId(id)
    setBgTransferTick((t) => t + 1)
    setApprovingIds((prev) => new Set(prev).add(id))
    try {
      await approveTransfer(id, user?.displayName ?? 'Admin')
      deleteTransferStoredId(id)
      setBgTransferTick((t) => t + 1)
      setDoneIds((prev) => new Set(prev).add(id))
      showToast({ message: 'Transfer approved. Loyverse stock updated.', durationMs: 6000 })
      void fetchTransfers('pending')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to approve transfer.'
      if (msg.includes('timed out')) {
        showToast({ message: 'Approval submitted. Server is processing — will update in ~1 minute.', durationMs: 15000 })
      } else {
        deleteTransferStoredId(id)
        setBgTransferTick((t) => t + 1)
        showToast({ message: `Approve failed: ${msg}`, durationMs: 8000 })
      }
    } finally {
      setApprovingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const handleRejectTransfer = async (id: string) => {
    setRejectingIds((prev) => new Set(prev).add(id))
    try {
      await rejectTransfer(id, user?.displayName ?? 'Admin')
      setDoneIds((prev) => new Set(prev).add(id))
      showToast({ message: 'Transfer rejected.', durationMs: 4000 })
      void fetchTransfers('pending')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to reject transfer.'
      showToast({ message: `Reject failed: ${msg}`, durationMs: 6000 })
    } finally {
      setRejectingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

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
      if (msg.includes('timed out')) {
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

  const ApproveRejectButtons = ({ req }: { req: typeof stockRequests[0] }) => {
    const isApproving = approvingIds.has(req.id)
    const isRejecting = rejectingIds.has(req.id)
    const isDone = doneIds.has(req.id)
    const isBackground = backgroundIds.has(req.id)
    const isDisabled = isApproving || isRejecting || isDone || isBackground

    if (isBackground) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-base-content/40">
          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
          </svg>
          Processing…
        </span>
      )
    }

    return (
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
    )
  }

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Approvals</h1>
            <p className="text-sm text-base-content/45 mt-1">Review pending requests from operators</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content border border-base-content/10 hover:border-base-content/20 shrink-0"
            onClick={() => {
              if (activeTab === 'stock') { refetch('pending') }
              else { void fetchTransfers('pending'); void refreshLiveStocks().catch(() => {}) }
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-base-content/8">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-150 ${activeTab === 'stock' ? 'border-primary text-primary' : 'border-transparent text-base-content/45 hover:text-base-content'}`}
            onClick={() => setActiveTab('stock')}
          >
            Stock changes
            {stockRequests.length > 0 && <span className="ml-2 text-xs bg-warning/15 text-warning rounded-full px-1.5 py-0.5">{stockRequests.length}</span>}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-150 ${activeTab === 'transfers' ? 'border-primary text-primary' : 'border-transparent text-base-content/45 hover:text-base-content'}`}
            onClick={() => setActiveTab('transfers')}
          >
            Transfers
            {transferRequests.length > 0 && <span className="ml-2 text-xs bg-warning/15 text-warning rounded-full px-1.5 py-0.5">{transferRequests.length}</span>}
          </button>
        </div>

        {error ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-4 py-3 text-sm text-error mb-5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        ) : null}

        {activeTab === 'stock' && <div className="rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">

          {/* Mobile: card layout */}
          <div className="sm:hidden divide-y divide-base-content/6">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <MobileSkeletonCard key={i} />)
            ) : stockRequests.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-base-content/40">No pending requests</p>
              </div>
            ) : (
              stockRequests.map((req, index) => (
                <div
                  key={req.id}
                  className="p-4 space-y-2.5 animate-row"
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  <p className="font-medium text-sm text-base-content leading-snug">{req.itemName}</p>
                  <div className="text-xs text-base-content/55 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span>{req.storeName || storeNameById.get(req.storeId) || req.storeId}</span>
                      <span className="tabular font-medium text-base-content/70">+{req.newStock}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>{req.requestedBy}</span>
                      <span className="text-base-content/40 tabular">{new Date(req.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <ApproveRejectButtons req={req} />
                </div>
              ))
            )}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden sm:block overflow-x-auto">
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

        </div>}

        {activeTab === 'transfers' && (
          <div className="rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-base-content/8 bg-base-content/3">
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">From</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">To</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Qty</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">
                      <span className="inline-flex items-center gap-1">
                        From stock
                        {isLiveChecking && (
                          <svg className="animate-spin text-base-content/30" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                          </svg>
                        )}
                      </span>
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Requested by</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">When</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isTransferLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : transferRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-sm text-base-content/40">No pending transfer requests</td>
                    </tr>
                  ) : (
                    transferRequests.map((req, index) => {
                      const isApproving = approvingIds.has(req.id)
                      const isRejecting = rejectingIds.has(req.id)
                      const isDone = doneIds.has(req.id)
                      const isBackground = backgroundTransferIds.has(req.id)
                      const isSyncing = syncingIds.has(req.id)
                      const isSynced = syncedIds.has(req.id)
                      const liveFromStock = liveStockMap.get(`${req.variantId}:${req.fromStoreId}`)
                      const effectiveFromStock = liveFromStock !== undefined ? liveFromStock : req.fromStockCurrent
                      const isInsufficient = effectiveFromStock != null && effectiveFromStock < req.quantity
                      const isBaseDisabled = isApproving || isRejecting || isDone || isBackground
                      return (
                        <tr key={req.id} className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row" style={{ animationDelay: `${index * 25}ms` }}>
                          <td className="py-3.5 px-4 font-medium text-base-content">{req.itemName}</td>
                          <td className="py-3.5 px-4 text-base-content/60 text-xs">{req.fromStoreName}</td>
                          <td className="py-3.5 px-4 text-base-content/60 text-xs">{req.toStoreName}</td>
                          <td className="py-3.5 px-4 text-base-content/80 tabular font-medium">{req.quantity}</td>
                          <td className="py-3.5 px-4 tabular text-xs">
                            {effectiveFromStock == null ? (
                              <span className="text-base-content/30">—</span>
                            ) : isInsufficient ? (
                              <span className="inline-flex items-center gap-1 text-warning font-semibold">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                                {effectiveFromStock}
                              </span>
                            ) : (
                              <span className="text-base-content/70">{effectiveFromStock}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-base-content/60">{req.requestedBy}</td>
                          <td className="py-3.5 px-4 text-base-content/45 text-xs tabular whitespace-nowrap">{new Date(req.createdAt).toLocaleString()}</td>
                          <td className="py-3.5 px-4">
                            {isBackground ? (
                              <span className="flex items-center gap-1.5 text-xs text-base-content/40">
                                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" /></svg>
                                Processing…
                              </span>
                            ) : isSyncing ? (
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 text-xs text-primary/70">
                                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" /></svg>
                                  Syncing…
                                </span>
                                <button type="button" disabled className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-error/10 text-error border border-error/20 opacity-40 cursor-not-allowed min-w-[3.75rem] justify-center">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                  Reject
                                </button>
                              </div>
                            ) : isSynced ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed min-w-[4.5rem] justify-center"
                                  disabled={isBaseDisabled || isInsufficient}
                                  onClick={() => void handleApproveTransfer(req.id)}
                                >
                                  {isApproving ? <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" /></svg> : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed min-w-[3.75rem] justify-center"
                                  disabled={isBaseDisabled}
                                  onClick={() => void handleRejectTransfer(req.id)}
                                >
                                  {isRejecting ? <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" /></svg> : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed min-w-[4.5rem] justify-center"
                                  disabled={isBaseDisabled}
                                  onClick={() => void handleSyncRequest(req.id)}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                                  Sync Now
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed min-w-[3.75rem] justify-center"
                                  disabled={isBaseDisabled}
                                  onClick={() => void handleRejectTransfer(req.id)}
                                >
                                  {isRejecting ? <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" /></svg> : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
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

            {/* Mobile transfers */}
            <div className="sm:hidden divide-y divide-base-content/6">
              {isTransferLoading ? (
                Array.from({ length: 4 }).map((_, i) => <MobileSkeletonCard key={i} />)
              ) : transferRequests.length === 0 ? (
                <div className="py-16 text-center"><p className="text-sm text-base-content/40">No pending transfer requests</p></div>
              ) : (
                transferRequests.map((req, index) => {
                  const isBg = backgroundTransferIds.has(req.id)
                  const mIsSyncing = syncingIds.has(req.id)
                  const mIsSynced = syncedIds.has(req.id)
                  const mobileLiveFromStock = liveStockMap.get(`${req.variantId}:${req.fromStoreId}`)
                  const mobileEffectiveFromStock = mobileLiveFromStock !== undefined ? mobileLiveFromStock : req.fromStockCurrent
                  const mobileInsufficient = mobileEffectiveFromStock != null && mobileEffectiveFromStock < req.quantity
                  const mBaseDisabled = approvingIds.has(req.id) || rejectingIds.has(req.id) || doneIds.has(req.id) || isBg
                  return (
                  <div key={req.id} className="p-4 space-y-2.5 animate-row" style={{ animationDelay: `${index * 25}ms` }}>
                    <p className="font-medium text-sm text-base-content">{req.itemName}</p>
                    <div className="text-xs text-base-content/55 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span>{req.fromStoreName}</span>
                        {mobileEffectiveFromStock != null && (
                          mobileInsufficient ? (
                            <span className="inline-flex items-center gap-0.5 text-warning font-semibold">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                              </svg>
                              {mobileEffectiveFromStock}
                            </span>
                          ) : (
                            <span className="text-base-content/40">({mobileEffectiveFromStock})</span>
                          )
                        )}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        <span>{req.toStoreName}</span>
                        <span className="ml-auto font-semibold text-base-content/80">{req.quantity} units</span>
                      </div>
                      <div className="flex justify-between"><span>{req.requestedBy}</span><span className="text-base-content/40">{new Date(req.createdAt).toLocaleString()}</span></div>
                    </div>
                    {isBg ? (
                      <span className="flex items-center gap-1.5 text-xs text-base-content/40">
                        <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" /></svg>
                        Processing…
                      </span>
                    ) : mIsSyncing ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs text-primary/70">
                          <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" /></svg>
                          Syncing…
                        </span>
                      </div>
                    ) : mIsSynced ? (
                      <div className="flex gap-2">
                        <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed" disabled={mBaseDisabled || mobileInsufficient} onClick={() => void handleApproveTransfer(req.id)}>
                          Approve
                        </button>
                        <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed" disabled={mBaseDisabled} onClick={() => void handleRejectTransfer(req.id)}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed" disabled={mBaseDisabled} onClick={() => void handleSyncRequest(req.id)}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                          Sync Now
                        </button>
                        <button type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed" disabled={mBaseDisabled} onClick={() => void handleRejectTransfer(req.id)}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
