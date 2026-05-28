import { useEffect, useMemo, useState } from 'react'
import type { Product, StoreInfo } from '../api/types'
import { useProducts } from '../hooks/useProducts'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { filterProducts } from '../utils/productSearch'

const ITEMS_PER_PAGE = 10

type ProductDraft = {
  storeId: string
  stock: string
}

export function Inventory() {
  const { showToast } = useToast()
  const { user } = useAuth()
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
    loadingHint,
    submitStockChange,
    refreshCatalog,
  } = useProducts()

  const [currentPage, setCurrentPage] = useState(1)
  const [drafts, setDrafts] = useState<Record<string, ProductDraft>>({})
  const [savingProductId, setSavingProductId] = useState<string | null>(null)

  const products = useMemo(() => filterProducts(allProducts, query), [allProducts, query])

  const isLoading = productsLoading
  const errorMessage = productsError
  const isSearchActive = query.trim().length > 0

  useEffect(() => {
    setCurrentPage(1)
  }, [query, products.length])

  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = products.slice(startIndex, endIndex)

  const getDraft = (productId: string): ProductDraft =>
    drafts[productId] ?? { storeId: '', stock: '' }

  const setDraftField = (productId: string, field: keyof ProductDraft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: { ...getDraft(productId), [field]: value },
    }))
  }

  const validateStock = (raw: string): number | null => {
    const v = raw.trim()
    if (v === '') return null
    if (!/^\d+$/.test(v)) return null
    return Number(v)
  }

  const submitProduct = async (p: Product) => {
    const draft = getDraft(p.id)

    if (!draft.storeId) {
      showToast({ message: `Select a branch for ${p.name}.`, durationMs: 5000 })
      return
    }

    const stock = validateStock(draft.stock)
    if (stock === null) {
      showToast({ message: `Enter a valid stock quantity (0 or higher) for ${p.name}.`, durationMs: 5000 })
      return
    }

    setSavingProductId(p.id)

    let toastShown = false
    let toastTimer: ReturnType<typeof setTimeout> | null = null

    try {
      const branchName =
        stores.find((s: StoreInfo) => s.id === draft.storeId)?.name ?? 'branch'

      // Optimistic UX: show success toast in 3-6s even if the request is slow.
      // If the request fails quickly, we cancel this toast and show an error instead.
      toastTimer = setTimeout(() => {
        toastShown = true
        showToast({
          message: `${p.name} → ${branchName}: ${stock} units submitted for admin approval.`,
          durationMs: 6000,
        })
      }, 4500)

       const result = await submitStockChange(p.id, {
         storeId: draft.storeId,
         stock,
         requestedBy: user?.username ?? '',
       })

      if (!toastShown) {
        clearTimeout(toastTimer)
        showToast({
          message:
            result.message ||
            `${p.name} → ${branchName}: ${stock} units submitted for admin approval.`,
          durationMs: 6000,
        })
      }

      setDrafts((prev) => {
        const next = { ...prev }
        delete next[p.id]
        return next
      })
    } catch (e) {
      // If the success toast already appeared, avoid showing a scary "failed" toast.
      if (!toastShown && toastTimer) clearTimeout(toastTimer)

      if (!toastShown) {
        const msg = e instanceof Error ? e.message : 'Request failed'
        showToast({
          message: `Failed to submit stock change for ${p.name}. ${msg}`,
          durationMs: 6000,
        })
      }
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
              To update stock, select a{' '}
              <strong>branch</strong>, enter the <strong>quantity to add</strong>, then submit for
              admin approval.
            </p>
            {isLoading ? (
              <p className="text-sm text-primary/80 mt-2">
                {loadingHint ?? 'Loading product catalog from Loyverse…'}
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
            {isRefreshing ? 'Refreshing…' : 'Refresh products'}
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

        <div className="space-y-4">
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
                  {isSearchActive ? 'No products match your search.' : 'No products loaded.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile (xs): stacked card UI */}
              <div className="sm:hidden space-y-3">
                {paginatedProducts.map((p) => {
                  const draft = getDraft(p.id)
                  const isSaving = savingProductId === p.id
                  const canSubmit = Boolean(draft.storeId && draft.stock.trim() !== '')
                  const branchName =
                    stores.find((s: StoreInfo) => s.id === draft.storeId)?.name ?? ''

                  return (
                    <div key={p.id} className="card bg-base-100 shadow border border-base-200">
                      <div className="card-body p-4">
                        <div className="mb-3">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-base-content/60 mt-1">
                            SKU: {p.sku}
                          </div>
                          {draft.storeId ? (
                            <div className="text-xs text-base-content/60 mt-1">
                              Branch: {branchName || draft.storeId}
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <select
                            className="select select-bordered select-sm w-full"
                            value={draft.storeId}
                            disabled={isSaving || stores.length === 0}
                            onChange={(e) => setDraftField(p.id, 'storeId', e.target.value)}
                          >
                            <option value="">Select branch…</option>
                            {stores.map((store: StoreInfo) => (
                              <option key={store.id} value={store.id}>
                                {store.name}
                              </option>
                            ))}
                          </select>

                          <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="input input-bordered input-sm w-full"
                            placeholder="Qty to add"
                            value={draft.stock}
                            disabled={isSaving}
                            onChange={(e) => setDraftField(p.id, 'stock', e.target.value)}
                          />

                          <button
                            type="button"
                            className="btn btn-primary btn-sm w-full"
                            disabled={isSaving || !canSubmit}
                            onClick={() => void submitProduct(p)}
                          >
                            {isSaving ? 'Submitting…' : 'Submit'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop/tablet (sm+): original table UI */}
              <div className="hidden sm:block card bg-base-100 shadow border border-base-200 overflow-x-auto">
                <table className="table table-sm sm:table-md">
                  <thead>
                    <tr>
                      <th className="w-[40%]">Product</th>
                      <th className="w-24">SKU</th>
                      <th>Branch</th>
                      <th className="w-36 sm:w-44">Add qty</th>
                      <th className="w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((p) => {
                      const draft = getDraft(p.id)
                      const isSaving = savingProductId === p.id
                      const canSubmit = Boolean(draft.storeId && draft.stock.trim() !== '')

                      return (
                        <tr key={p.id}>
                          <td className="max-w-0">
                            <div className="font-medium truncate">{p.name}</div>
                          </td>
                          <td className="text-base-content/70 text-xs">{p.sku}</td>
                          <td>
                            <select
                              className="select select-bordered select-sm w-full max-w-xs"
                              value={draft.storeId}
                              disabled={isSaving || stores.length === 0}
                              onChange={(e) => setDraftField(p.id, 'storeId', e.target.value)}
                            >
                              <option value="">Select branch…</option>
                              {stores.map((store: StoreInfo) => (
                                <option key={store.id} value={store.id}>
                                  {store.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="input input-bordered input-sm w-full"
                              placeholder="Qty to add"
                              value={draft.stock}
                              disabled={isSaving}
                              onChange={(e) => setDraftField(p.id, 'stock', e.target.value)}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={isSaving || !canSubmit}
                              onClick={() => void submitProduct(p)}
                            >
                              {isSaving ? '…' : 'Submit'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
                <div className="text-xs sm:text-sm text-base-content/60">
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
