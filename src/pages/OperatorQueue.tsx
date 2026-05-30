import { useEffect, useMemo, useState } from 'react'
import { useMyStockRequests } from '../hooks/useMyStockRequests'
import { useStores } from '../hooks/useStores'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

type Tab = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'

const ITEMS_PER_PAGE = 20

const TABS: { id: Tab; label: string }[] = [
  { id: 'all',       label: 'All' },
  { id: 'pending',   label: 'Pending' },
  { id: 'approved',  label: 'Approved' },
  { id: 'rejected',  label: 'Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
]

const STATUS_CLASSES: Record<string, string> = {
  approved:  'status-badge status-badge-approved',
  rejected:  'status-badge status-badge-rejected',
  pending:   'status-badge status-badge-pending',
  cancelled: 'status-badge status-badge-cancelled',
}

function MobileSkeletonCard() {
  return (
    <div className="p-4 border-b border-base-content/6 space-y-2.5">
      <div className="flex justify-between gap-2">
        <div className="h-3.5 rounded bg-base-content/8 animate-pulse w-3/5" />
        <div className="h-5 w-16 rounded-full bg-base-content/8 animate-pulse" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 rounded bg-base-content/8 animate-pulse w-4/5" />
        <div className="h-3 rounded bg-base-content/8 animate-pulse w-3/5" />
      </div>
    </div>
  )
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-base-content/6">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <div className="h-3 rounded bg-base-content/8 animate-pulse" style={{ width: `${[45, 22, 12, 16, 18, 20][i] ?? 20}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function OperatorQueue() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set())

  const { requests, isLoading, error, refetch, cancelRequest } = useMyStockRequests(activeTab)
  const { stores } = useStores()

  const storeNameById = useMemo(
    () => new Map(stores.map((s) => [s.id, s.name])),
    [stores],
  )

  const totalPages = Math.max(1, Math.ceil(requests.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRequests = requests.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  )

  useEffect(() => { setCurrentPage(1) }, [activeTab])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    void refetch(tab)
  }

  const handleCancel = async (id: string) => {
    setCancellingIds((prev) => new Set(prev).add(id))
    try {
      await cancelRequest(id)
      showToast({ message: 'Request cancelled.', durationMs: 5000 })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to cancel request.'
      showToast({ message: `Cancel failed: ${msg}`, durationMs: 6000 })
    } finally {
      setCancellingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const showCancelColumn = activeTab === 'all' || activeTab === 'pending'
  const colSpan = showCancelColumn ? 7 : 6

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="mb-7">
          <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Operator</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">My requests</h1>
          <p className="text-sm text-base-content/45 mt-1">
            Submitted by{' '}
            <span className="font-medium text-base-content/70">
              {user?.displayName ?? user?.username}
            </span>
          </p>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 border-b border-base-content/8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-base-content/45 border-transparent hover:text-base-content hover:border-base-content/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-4 py-3 text-sm text-error mb-5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        ) : null}

        <div className="rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">

          {/* Mobile: card layout */}
          <div className="sm:hidden divide-y divide-base-content/6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <MobileSkeletonCard key={i} />)
            ) : requests.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-base-content/40">No requests found.</p>
              </div>
            ) : (
              paginatedRequests.map((req, index) => {
                const isCancelling = cancellingIds.has(req.id)
                const canCancel = req.status === 'pending' && showCancelColumn

                return (
                  <div
                    key={req.id}
                    className="p-4 space-y-2.5 animate-row"
                    style={{ animationDelay: `${index * 25}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <p className="font-medium text-sm text-base-content leading-snug">{req.itemName}</p>
                      <span className={`${STATUS_CLASSES[req.status] ?? STATUS_CLASSES.pending} shrink-0`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="text-xs text-base-content/55 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span>{req.storeName || storeNameById.get(req.storeId) || req.storeId}</span>
                        <span className="tabular font-medium text-base-content/70">+{req.newStock}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-base-content/40 tabular">{new Date(req.createdAt).toLocaleString()}</span>
                        {req.reviewedBy && (
                          <span className="text-base-content/40">by {req.reviewedBy}</span>
                        )}
                      </div>
                    </div>
                    {canCancel && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-base-content/6 text-base-content/50 border border-base-content/10 hover:bg-error/10 hover:text-error hover:border-error/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={isCancelling}
                        onClick={() => void handleCancel(req.id)}
                      >
                        {isCancelling ? (
                          <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                        Cancel request
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-content/8 bg-base-content/3">
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Branch</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Qty</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Reviewed by</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Date</th>
                  {showCancelColumn && <th className="py-3 px-4 w-20" />}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={colSpan} />)
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="py-16 text-center text-sm text-base-content/40">
                      No requests found.
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req, index) => {
                    const isCancelling = cancellingIds.has(req.id)
                    const canCancel = req.status === 'pending' && showCancelColumn

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
                        <td className="py-3.5 px-4 text-base-content/60 tabular text-xs">+{req.newStock}</td>
                        <td className="py-3.5 px-4">
                          <span className={STATUS_CLASSES[req.status] ?? STATUS_CLASSES.pending}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-base-content/45 text-xs">{req.reviewedBy ?? '—'}</td>
                        <td className="py-3.5 px-4 text-base-content/45 text-xs tabular whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleString()}
                        </td>
                        {showCancelColumn && (
                          <td className="py-3.5 px-4">
                            {canCancel ? (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-base-content/6 text-base-content/50 border border-base-content/10 hover:bg-error/10 hover:text-error hover:border-error/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={isCancelling}
                                onClick={() => void handleCancel(req.id)}
                              >
                                {isCancelling ? (
                                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                                  </svg>
                                ) : (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                )}
                                Cancel
                              </button>
                            ) : null}
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && requests.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-base-content/8">
              <p className="text-xs text-base-content/40">
                {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, requests.length)} of {requests.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="btn btn-xs btn-ghost text-base-content/50 hover:text-base-content"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >← Prev</button>
                <span className="text-xs text-base-content/60 tabular px-1">{safePage} / {totalPages}</span>
                <button
                  type="button"
                  className="btn btn-xs btn-ghost text-base-content/50 hover:text-base-content"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
