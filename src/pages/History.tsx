import { useEffect, useMemo, useState } from 'react'
import { useStockRequests } from '../hooks/useStockRequests'
import { useStores } from '../hooks/useStores'

type Tab = 'all' | 'approved' | 'rejected'

const ITEMS_PER_PAGE = 20

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

const STATUS_BADGE: Record<string, string> = {
  approved: 'badge-success',
  rejected: 'badge-error',
  pending: 'badge-warning',
}

export function History() {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const { requests, isLoading, error, refetch } = useStockRequests(activeTab, true)
  const { stores } = useStores()

  const storeNameById = useMemo(
    () => new Map(stores.map((s) => [s.id, s.name])),
    [stores],
  )

  const totalPages = Math.max(1, Math.ceil(requests.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRequests = requests.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  // Reset to page 1 when tab changes
  useEffect(() => { setCurrentPage(1) }, [activeTab])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    void refetch(tab)
  }

  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-2">
            History
          </h1>
          <p className="text-base-content/60 text-sm sm:text-base">
            Stock change requests history from the database.
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 w-fit mb-4 shadow border border-base-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        ) : null}

        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body p-0 sm:p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 min-h-32 w-full">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <p className="text-base-content/60 py-8 text-center">No requests found.</p>
            ) : (
              <>
              <div className="overflow-x-auto">
                <table className="table text-sm">
                  <thead className="bg-base-200">
                    <tr>
                      <th>Item</th>
                      <th>Branch</th>
                      <th>Qty</th>
                      <th>Requested by</th>
                      <th>Status</th>
                      <th>Reviewed by</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequests.map((req) => (
                      <tr key={req.id} className="border-b border-base-200">
                        <td className="font-medium text-base-content">{req.itemName}</td>
                        <td className="text-base-content/80">
                          {req.storeName || storeNameById.get(req.storeId) || req.storeId}
                        </td>
                        <td className="text-base-content/70 text-xs">
                          +{req.newStock}
                        </td>
                        <td className="text-base-content/70">{req.requestedBy}</td>
                        <td>
                          <span className={`badge badge-sm ${STATUS_BADGE[req.status] ?? 'badge-ghost'}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="text-base-content/60 text-xs">
                          {req.reviewedBy ?? '—'}
                        </td>
                        <td className="text-base-content/60 text-xs whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-base-200">
                <div className="text-xs text-base-content/60">
                  Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, requests.length)} of {requests.length}
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline text-xs"
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ← Prev
                  </button>
                  <span className="text-xs font-medium text-base-content whitespace-nowrap">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline text-xs"
                    disabled={safePage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next →
                  </button>
                </div>
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
