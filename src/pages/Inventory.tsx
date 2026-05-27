import { useEffect, useMemo, useState } from 'react'
import type { Product, StoreInfo } from '../api/types'
import { useProducts } from '../hooks/useProducts'
import { useToast } from '../context/ToastContext'
import { filterProducts } from '../utils/productSearch'

function stockKey(productId: string, storeId: string) {
  return `${productId}::${storeId}`
}

function getStock(product: Product, storeId: string): number {
  return product.stocks.find((s) => s.storeId === storeId)?.stock ?? 0
}

const ITEMS_PER_PAGE = 10

export function Inventory() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')

  const {
    allProducts,
    stores,
    source,
    catalogNote,
    catalogTotal,
    isLoading: productsLoading,
    isRefreshing,
    error: productsError,
    submitStockChange,
    refreshCatalog,
  } = useProducts()

  const [currentPage, setCurrentPage] = useState(1)

  const products = useMemo(() => filterProducts(allProducts, query), [allProducts, query])

  const isLoading = productsLoading
  const errorMessage = productsError
  const isSearchActive = query.trim().length > 0

  const [draftStocks, setDraftStocks] = useState<Record<string, string>>({})
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(() => new Set())
  const [savingProductId, setSavingProductId] = useState<string | null>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [query, products.length])

  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = products.slice(startIndex, endIndex)

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

  const sourceLabel = source === 'loyverse' ? 'Live from Loyverse' : 'Mock data'

  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-2">
              Inventory Stock
            </h1>
            <p className="text-base-content/60 text-sm sm:text-base">{sourceLabel}</p>
            <p className="text-base-content/60 text-sm sm:text-base">
              Edit stock per store. Saves as <strong>pending</strong> until an admin approves — Loyverse
              is not updated immediately.
            </p>
            {isLoading && source !== 'mock' ? (
              <p className="text-sm text-primary/80 mt-2">
                Loading full Loyverse catalog… this happens once, then search is instant.
              </p>
            ) : catalogNote ? (
              <p className="text-sm text-base-content/55 mt-2">{catalogNote}</p>
            ) : null}
            {isSearchActive && !isLoading ? (
              <p className="text-sm text-base-content/55 mt-1">
                Showing {products.length} of {catalogTotal} loaded items.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm shrink-0"
            disabled={isLoading || isRefreshing}
            onClick={() => void refreshCatalog()}
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh from Loyverse'}
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
                disabled={isLoading && allProducts.length === 0}
              />
            </div>

        <div className="space-y-6">
          {isLoading && allProducts.length === 0 ? (
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body py-10 flex flex-col items-center justify-center min-h-48 w-full">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            </div>
              ) : !isLoading && products.length === 0 ? (
                <div className="card bg-base-100 shadow border border-base-200">
                  <div className="card-body py-10">
                    <p className="text-base-content/60">
                      {isSearchActive
                        ? 'No products match your search.'
                        : 'No products loaded.'}
                    </p>
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
                                {stores.map((store: StoreInfo) => (
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
                      Showing {startIndex + 1} to {Math.min(endIndex, products.length)} of{' '}
                      {products.length} products
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
      </div>
    </div>
  )
}
