import { useEffect, useState } from 'react'
import { useMyStockRequests } from '../hooks/useMyStockRequests'
import { useTransferRequests } from '../hooks/useTransferRequests'
import { useStores } from '../hooks/useStores'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

type Tab = 'stock' | 'transfer'

const STATUS_CLASSES: Record<string, string> = {
  approved:  'status-badge status-badge-approved',
  rejected:  'status-badge status-badge-rejected',
  pending:   'status-badge status-badge-pending',
  cancelled: 'status-badge status-badge-cancelled',
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-base-content/6">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <div className="h-3 rounded bg-base-content/8 animate-pulse" style={{ width: `${[45, 22, 12, 18, 16, 14][i] ?? 25}%` }} />
        </td>
      ))}
    </tr>
  )
}

function MobileSkeletonCard() {
  return (
    <div className="p-4 border-b border-base-content/6 space-y-2.5">
      <div className="h-3.5 rounded bg-base-content/8 animate-pulse w-3/5" />
      <div className="h-3 rounded bg-base-content/8 animate-pulse w-4/5" />
      <div className="h-3 rounded bg-base-content/8 animate-pulse w-2/5" />
    </div>
  )
}

export function PendingRequests() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [activeTab,     setActiveTab]     = useState<Tab>('stock')
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set())

  const {
    requests: stockRequests,
    isLoading: stockLoading,
    error: stockError,
    cancelRequest: cancelStock,
  } = useMyStockRequests('pending')

  const {
    requests: transferRequests,
    isLoading: transferLoading,
    hasFetched: transferFetched,
    error: transferError,
    fetchRequests: fetchTransfers,
    cancelTransfer,
  } = useTransferRequests()

  const { stores } = useStores()

  useEffect(() => {
    void fetchTransfers('pending')
  }, [fetchTransfers])

  const storeNameById = new Map(stores.map(s => [s.id, s.name]))

  const isLoading = activeTab === 'stock' ? stockLoading : transferLoading && !transferFetched
  const error     = activeTab === 'stock' ? stockError  : transferError

  // ── Cancel handlers ────────────────────────────────────────────────────────

  const handleCancelStock = async (id: string) => {
    setCancellingIds(prev => new Set(prev).add(id))
    try {
      await cancelStock(id)
      showToast({ message: 'Request cancelled.', durationMs: 5000 })
    } catch (e) {
      showToast({ message: `Cancel failed: ${e instanceof Error ? e.message : 'Unknown error'}`, durationMs: 6000, variant: 'error' })
    } finally {
      setCancellingIds(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const handleCancelTransfer = async (id: string) => {
    setCancellingIds(prev => new Set(prev).add(id))
    try {
      await cancelTransfer(id, user?.displayName ?? user?.username ?? 'Operator', false)
      showToast({ message: 'Transfer request cancelled.', durationMs: 5000 })
      void fetchTransfers('pending')
    } catch (e) {
      showToast({ message: `Cancel failed: ${e instanceof Error ? e.message : 'Unknown error'}`, durationMs: 6000, variant: 'error' })
    } finally {
      setCancellingIds(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  function CancelButton({ id, onCancel }: { id: string; onCancel: (id: string) => Promise<void> }) {
    const isCancelling = cancellingIds.has(id)
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-base-content/6 text-base-content/50 border border-base-content/10 hover:bg-error/10 hover:text-error hover:border-error/20 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={isCancelling}
        onClick={() => void onCancel(id)}
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
    )
  }

  const tabs = [
    { id: 'stock'    as Tab, label: 'Stock Changes', count: stockRequests.length    },
    { id: 'transfer' as Tab, label: 'Transfers',     count: transferRequests.length },
  ]

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">

        <header className="mb-7">
          <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Operator</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Pending requests</h1>
          <p className="text-sm text-base-content/45 mt-1">All your pending items awaiting admin approval</p>
        </header>

        {/* Tabs */}
        <div className="relative flex items-center gap-0.5 mb-5 overflow-x-auto after:absolute after:bottom-0 after:inset-x-0 after:h-px after:bg-base-content/8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-base-content/45 hover:text-base-content'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] font-semibold tabular px-1.5 py-px rounded-full ${
                  activeTab === tab.id
                    ? 'bg-primary/12 text-primary'
                    : 'bg-base-content/8 text-base-content/40'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />
              )}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-4 py-3 text-sm text-error mb-5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">

          {/* ── Stock Changes tab ── */}
          {activeTab === 'stock' && (
            <>
              {/* Mobile */}
              <div className="sm:hidden divide-y divide-base-content/6">
                {stockLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <MobileSkeletonCard key={i} />)
                ) : stockRequests.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-sm text-base-content/40">No pending stock change requests.</p>
                  </div>
                ) : (
                  stockRequests.map((req, index) => (
                    <div key={req.id} className="p-4 space-y-2.5 animate-row" style={{ animationDelay: `${index * 25}ms` }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm text-base-content leading-snug">{req.itemName}</p>
                        <span className={`${STATUS_CLASSES[req.status]} shrink-0`}>{req.status}</span>
                      </div>
                      <div className="text-xs text-base-content/55 space-y-0.5">
                        <div className="flex justify-between gap-2">
                          <span>{req.storeName || storeNameById.get(req.storeId) || req.storeId}</span>
                          <span className="tabular font-medium text-base-content/70">+{req.newStock}</span>
                        </div>
                        <span className="text-base-content/40 tabular">{new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                      <CancelButton id={req.id} onCancel={handleCancelStock} />
                    </div>
                  ))
                )}
              </div>

              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-base-content/8 bg-base-content/3">
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Branch</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Qty</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Submitted</th>
                      <th className="py-3 px-4 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {stockLoading ? (
                      Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                    ) : stockRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-sm text-base-content/40">No pending stock change requests.</td>
                      </tr>
                    ) : (
                      stockRequests.map((req, index) => (
                        <tr key={req.id} className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row" style={{ animationDelay: `${index * 25}ms` }}>
                          <td className="py-3.5 px-4 font-medium text-base-content">{req.itemName}</td>
                          <td className="py-3.5 px-4 text-base-content/60">{req.storeName || storeNameById.get(req.storeId) || req.storeId}</td>
                          <td className="py-3.5 px-4 text-base-content/60 tabular text-xs">+{req.newStock}</td>
                          <td className="py-3.5 px-4 text-base-content/45 text-xs tabular whitespace-nowrap">{new Date(req.createdAt).toLocaleString()}</td>
                          <td className="py-3.5 px-4">
                            <CancelButton id={req.id} onCancel={handleCancelStock} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Transfers tab ── */}
          {activeTab === 'transfer' && (
            <>
              {/* Mobile */}
              <div className="sm:hidden divide-y divide-base-content/6">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <MobileSkeletonCard key={i} />)
                ) : transferRequests.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-sm text-base-content/40">No pending transfer requests.</p>
                  </div>
                ) : (
                  transferRequests.map((req, index) => (
                    <div key={req.id} className="p-4 space-y-2.5 animate-row" style={{ animationDelay: `${index * 25}ms` }}>
                      <p className="font-medium text-sm text-base-content leading-snug">{req.itemName}</p>
                      <div className="text-xs text-base-content/55 space-y-0.5">
                        <p>{req.fromStoreName} <span className="text-base-content/30">→</span> {req.toStoreName}</p>
                        <div className="flex justify-between gap-2">
                          <span className="tabular font-medium text-base-content/70">{req.quantity} units</span>
                          <span className="text-base-content/40 tabular">{new Date(req.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <CancelButton id={req.id} onCancel={handleCancelTransfer} />
                    </div>
                  ))
                )}
              </div>

              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-base-content/8 bg-base-content/3">
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">From</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">To</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Qty</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Submitted</th>
                      <th className="py-3 px-4 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                    ) : transferRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-sm text-base-content/40">No pending transfer requests.</td>
                      </tr>
                    ) : (
                      transferRequests.map((req, index) => (
                        <tr key={req.id} className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row" style={{ animationDelay: `${index * 25}ms` }}>
                          <td className="py-3.5 px-4 font-medium text-base-content">{req.itemName}</td>
                          <td className="py-3.5 px-4 text-base-content/60 text-xs">{req.fromStoreName}</td>
                          <td className="py-3.5 px-4 text-base-content/60 text-xs">{req.toStoreName}</td>
                          <td className="py-3.5 px-4 text-base-content/60 tabular text-xs">{req.quantity}</td>
                          <td className="py-3.5 px-4 text-base-content/45 text-xs tabular whitespace-nowrap">{new Date(req.createdAt).toLocaleString()}</td>
                          <td className="py-3.5 px-4">
                            <CancelButton id={req.id} onCancel={handleCancelTransfer} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      </div>
    </main>
  )
}
