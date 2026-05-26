import { useEffect, useMemo, useState } from 'react'
import type { Product, StoreInfo } from '../api/types'
import { useProducts } from '../hooks/useProducts'
import { useStockRequests } from '../hooks/useStockRequests'
import { useToast } from '../context/ToastContext'

function stockKey(productId: string, storeId: string) {
  return `${productId}::${storeId}`
}

function getStock(product: Product, storeId: string): number {
  return product.stocks.find((s) => s.storeId === storeId)?.stock ?? 0
}

const ITEMS_PER_PAGE = 10

export function Inventory() {
  const { showToast } = useToast()
  const {
    products,
    stores,
    source,
    isLoading: productsLoading,
    error: productsError,
    submitStockChange,
    refetch: refetchProducts,
  } = useProducts()
  const {
    requests: stockRequests,
    isLoading: requestsLoading,
    error: requestsError,
    approveRequest,
    rejectRequest,
    refetch: refetchRequests,
  } = useStockRequests()

  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isTabStock, setIsTabStock] = useState(true)

  const isLoading = productsLoading || requestsLoading
  const errorMessage = productsError || requestsError

  const [draftStocks, setDraftStocks] = useState<Record<string, string>>({})
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(() => new Set())
  const [savingProductId, setSavingProductId] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [products, query])

  useEffect(() => {
    setCurrentPage(1)
  }, [query])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const storeNameById = useMemo(
    () => new Map(stores.map((s: StoreInfo) => [s.id, s.name])),
    [stores],
  )

  const ensureDraftValue = (p: Product, storeId: string) => {
    const k = stockKey(p.id, storeId)
    if (draftStocks[k] !== undefined) return
    setDraftStocks((prev) => ({ ...prev, [k]: String(getStock(p, storeId)) }))
  }

  const setDraft = (p: Product, storeId: string, value: string) => {
    const k = stockKey(p.id, storeId)
    setDraftStocks((prev) => ({ ...prev, [k]: value }))
    setDirtyKeys((prev) => new Set(prev).add(k))
  }

  const validateStock = (raw: string): number | null => {
    const v = raw.trim()
    if (v === '') return null
    if (!/^\d+$/.test(v)) return null
    return Number(v)
  }

  const saveProduct = async (p: Product) => {
    const updates: { storeId: string; stock: number }[] = []

    for (const store of stores) {
      const k = stockKey(p.id, store.id)
      if (!dirtyKeys.has(k)) continue

      const validated = validateStock(draftStocks[k] ?? '')
      if (validated === null) continue

      const current = getStock(p, store.id)
      if (current === validated) continue

      updates.push({ storeId: store.id, stock: validated })
    }

    if (updates.length === 0) return

    setSavingProductId(p.id)

    try {
      const result = await submitStockChange(p.id, {
        updates,
        requestedBy: 'Staff',
      })

      const productDirtyKeys = updates.map((u) => stockKey(p.id, u.storeId))
      setDirtyKeys((prev) => {
        const next = new Set(prev)
        for (const k of productDirtyKeys) next.delete(k)
        return next
      })
      setDraftStocks((prev) => {
        const next = { ...prev }
        for (const k of productDirtyKeys) delete next[k]
        return next
      })

      await refetchRequests('pending')
      showToast({
        message: result.message || `Change submitted for ${p.name} — pending admin approval.`,
        durationMs: 6000,
      })
    } catch {
      showToast({
        message: `Failed to submit stock change for ${p.name}.`,
        durationMs: 6000,
      })
    } finally {
      setSavingProductId(null)
    }
  }

  const handleApproveRequest = async (id: string) => {
    try {
      await approveRequest(id, 'Admin')
      await refetchProducts()
      showToast({ message: 'Approved. Stock updated in Loyverse.', durationMs: 6000 })
    } catch {
      showToast({ message: 'Failed to approve request.', durationMs: 6000 })
    }
  }

  const handleRejectRequest = async (id: string) => {
    try {
      await rejectRequest(id, 'Admin')
      showToast({ message: 'Request rejected.', durationMs: 6000 })
    } catch {
      showToast({ message: 'Failed to reject request.', durationMs: 6000 })
    }
  }

  const sourceLabel = source === 'loyverse' ? 'Live from Loyverse' : 'Mock data'

  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-2">
            Inventory Stock
          </h1>
          <p className="text-base-content/60 text-sm sm:text-base">{sourceLabel}</p>
          <p className="text-base-content/60 text-sm sm:text-base">
            Edit stock per store. Saves as <strong>pending</strong> until an admin approves — Loyverse
            is not updated immediately.
          </p>
        </div>

        <div className="tabs tabs-boxed mb-6 max-w-xs">
          <button
            className={`tab ${isTabStock ? 'tab-active' : ''}`}
            onClick={() => setIsTabStock(true)}
            type="button"
          >
            Stock Editor
          </button>
          <button
            className={`tab ${!isTabStock ? 'tab-active' : ''}`}
            onClick={() => setIsTabStock(false)}
            type="button"
          >
            Approval Queue ({stockRequests.length})
          </button>
        </div>

        {errorMessage && (
          <div className="alert alert-error mb-4">
            <div>
              <div className="font-semibold">Error</div>
              <div className="text-xs">{errorMessage}</div>
            </div>
          </div>
        )}

        {isTabStock && (
          <>
            <div className="form-control mb-4 sm:mb-6 max-w-md">
              <label className="label py-2">
                <span className="label-text font-semibold text-base-content text-xs sm:text-sm">
                  Search
                </span>
              </label>
              <input
                type="text"
                placeholder="Product name or SKU..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input input-bordered w-full focus:input-primary text-sm"
              />
            </div>

            <div className="space-y-6">
              {isLoading && products.length === 0 ? (
                <div className="card bg-base-100 shadow border border-base-200">
                  <div className="card-body py-10 flex justify-center">
                    <span className="loading loading-spinner loading-lg text-primary" />
                  </div>
                </div>
              ) : !isLoading && filteredProducts.length === 0 ? (
                <div className="card bg-base-100 shadow border border-base-200">
                  <div className="card-body py-10">
                    <p className="text-base-content/60">No products match your search.</p>
                  </div>
                </div>
              ) : (
                <>
                  {paginatedProducts.map((p) => {
                    const isSaving = savingProductId === p.id
                    const hasChanges = Array.from(dirtyKeys).some((k) => k.startsWith(`${p.id}::`))

                    return (
                      <div key={p.id} className="card bg-base-100 shadow border border-base-200">
                        <div className="card-body">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                            <div>
                              <div className="font-bold text-base-content text-lg">{p.name}</div>
                              <div className="text-xs text-base-content/60">SKU: {p.sku}</div>
                            </div>

                            <button
                              className="btn btn-sm btn-primary"
                              type="button"
                              disabled={isSaving || !hasChanges}
                              onClick={() => saveProduct(p)}
                              title={hasChanges ? 'Submit for approval' : 'No changes'}
                            >
                              {isSaving ? 'Submitting...' : 'Submit for approval'}
                            </button>
                          </div>

                          {stores.length === 0 ? (
                            <p className="text-base-content/60 text-sm">No stores loaded.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="table table-zebra text-sm">
                                <thead>
                                  <tr>
                                    <th className="w-64">Store</th>
                                    {stores.map((store) => (
                                      <th key={store.id} className="text-center">
                                        {store.name}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="font-medium">Stock</td>
                                    {stores.map((store) => {
                                      const k = stockKey(p.id, store.id)
                                      const isDirty = dirtyKeys.has(k)
                                      const value =
                                        draftStocks[k] !== undefined
                                          ? draftStocks[k]
                                          : String(getStock(p, store.id))

                                      return (
                                        <td key={k} className="min-w-[140px]">
                                          <div className="flex items-center justify-center">
                                            <input
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              className={`input input-bordered input-sm w-24 text-right ${isDirty ? 'input-warning' : ''}`}
                                              value={value}
                                              onFocus={() => ensureDraftValue(p, store.id)}
                                              onChange={(ev) => setDraft(p, store.id, ev.target.value)}
                                            />
                                          </div>
                                        </td>
                                      )
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  <div className="card-body border-t border-base-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs sm:text-sm text-base-content/60 text-center sm:text-left">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of{' '}
                      {filteredProducts.length} products
                    </div>

                    <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline text-xs"
                        onClick={() => setCurrentPage((pg) => Math.max(1, pg - 1))}
                        disabled={safePage === 1}
                      >
                        ← Prev
                      </button>
                      <span className="text-xs sm:text-sm font-medium text-base-content whitespace-nowrap">
                        {safePage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline text-xs"
                        onClick={() => setCurrentPage((pg) => Math.min(totalPages, pg + 1))}
                        disabled={safePage === totalPages}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {!isTabStock && (
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-base-content mb-4">Pending Stock Requests</h2>

              {isLoading && stockRequests.length === 0 ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg text-primary" />
                </div>
              ) : stockRequests.length === 0 ? (
                <p className="text-base-content/60">No pending requests.</p>
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
                          <td className="text-base-content font-medium">{req.itemName}</td>
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
                                onClick={() => handleApproveRequest(req.id)}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-error"
                                onClick={() => handleRejectRequest(req.id)}
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
        )}
      </div>
    </div>
  )
}
