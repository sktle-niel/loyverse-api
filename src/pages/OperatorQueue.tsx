import { useEffect, useMemo, useState } from 'react'
import { useMyStockRequests } from '../hooks/useMyStockRequests'
import { useStores } from '../hooks/useStores'
import { useAuth } from '../context/AuthContext'

type Tab = 'all' | 'pending' | 'approved' | 'rejected'

const ITEMS_PER_PAGE = 20

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

const STATUS_CLASSES: Record<string, string> = {
  approved: 'status-badge status-badge-approved',
  rejected: 'status-badge status-badge-rejected',
  pending:  'status-badge status-badge-pending',
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
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const { requests, isLoading, error, refetch } = useMyStockRequests(activeTab)
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
        <div className="flex items-center gap-1 mb-5 border-b border-base-content/8 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-content/8 bg-base-content/3">
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Branch</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Qty</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Reviewed by</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-base-content/40">
                      No requests found.
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req, index) => (
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
                    </tr>
                  ))
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
