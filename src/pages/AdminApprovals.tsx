import { useMemo } from 'react'
import { useStockRequests } from '../hooks/useStockRequests'
import { useProducts } from '../hooks/useProducts'
import { useToast } from '../context/ToastContext'

export function AdminApprovals() {
  const { showToast } = useToast()
  const { stores } = useProducts()
  const {
    requests: stockRequests,
    isLoading,
    error,
    approveRequest,
    rejectRequest,
    refetch,
  } = useStockRequests('pending', true)

  const storeNameById = useMemo(
    () => new Map(stores.map((s) => [s.id, s.name])),
    [stores],
  )

  const handleApprove = async (id: string) => {
    try {
      await approveRequest(id, 'Admin')
      showToast({ message: 'Approved. Stock updated in Loyverse.', durationMs: 6000 })
    } catch {
      showToast({ message: 'Failed to approve request.', durationMs: 6000 })
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectRequest(id, 'Admin')
      showToast({ message: 'Request rejected.', durationMs: 6000 })
    } catch {
      showToast({ message: 'Failed to reject request.', durationMs: 6000 })
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
                      <th>Changes</th>
                      <th>Requested by</th>
                      <th>When</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockRequests.map((req) => (
                      <tr key={req.id} className="border-b border-base-200">
                        <td className="font-medium text-base-content">{req.itemName}</td>
                        <td className="text-base-content/70 text-xs">
                          <ul className="list-disc list-inside space-y-1">
                            {req.lines.map((line) => (
                              <li key={`${req.id}-${line.storeId}`}>
                                {line.storeName || storeNameById.get(line.storeId) || line.storeId}:{' '}
                                {line.oldStock} → {line.newStock}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="text-base-content/70">{req.requestedBy}</td>
                        <td className="text-base-content/60 text-xs whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn btn-xs btn-success"
                              onClick={() => handleApprove(req.id)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-error"
                              onClick={() => handleReject(req.id)}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
