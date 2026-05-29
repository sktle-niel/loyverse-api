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

function SkeletonRow() {
  return (
    <tr className="border-b border-base-content/6">
      {[42, 18, 26, 22, 10].map((w, i) => (
        <td key={i} className="py-3.5 px-4">
          <div className="h-3 rounded bg-base-content/8 animate-pulse" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  )
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
  const isSearchActive = query.trim().length > 0

  useEffect(() => { setCurrentPage(1) }, [query, products.length])

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
      const branchName = stores.find((s: StoreInfo) => s.id === draft.storeId)?.name ?? 'branch'

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
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Operator</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Inventory stock</h1>
            <p className="text-sm text-base-content/45 mt-1">{sourceLabel} · select a branch, enter qty to add, then submit</p>
            {isLoading ? (
              <p className="text-xs text-primary/70 mt-1.5">{loadingHint ?? 'Loading product catalog…'}</p>
            ) : catalogNote ? (
              <p className="text-xs text-base-content/35 mt-1.5">{catalogNote}</p>
            ) : null}
            {isSearchActive && !isLoading ? (
              <p className="text-xs text-base-content/35 mt-1">
                Showing {products.length} of {catalogTotal} loaded items
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content border border-base-content/10 hover:border-base-content/20 shrink-0"
            disabled={isLoading || isRefreshing}
            onClick={() => void refreshCatalog()}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>

        {productsError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-4 py-3 text-sm text-error mb-5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="font-medium">Error loading products</p>
              <p className="text-xs mt-0.5 text-error/70">{productsError}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-5 max-w-xs">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Product name or SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-base-content/12 bg-base-100 pl-9 pr-3.5 py-2 text-sm text-base-content placeholder:text-base-content/30 outline-none focus:border-primary/60 transition-colors duration-150"
              disabled={isLoading && allProducts.length === 0}
            />
          </div>
        </div>

        {/* Mobile: card layout */}
        <div className="sm:hidden">
        <div className="space-y-3">
          {isLoading && allProducts.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-base-content/8 bg-base-100 p-4 space-y-3">
                <div className="h-3.5 rounded bg-base-content/8 animate-pulse w-3/5" />
                <div className="h-3 rounded bg-base-content/8 animate-pulse w-1/4" />
                <div className="flex gap-2">
                  <div className="h-8 rounded-lg bg-base-content/8 animate-pulse flex-1" />
                  <div className="h-8 rounded-lg bg-base-content/8 animate-pulse w-24" />
                  <div className="h-8 rounded-lg bg-base-content/8 animate-pulse w-16" />
                </div>
              </div>
            ))
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-base-content/8 bg-base-100 py-12 text-center">
              <p className="text-sm text-base-content/40">
                {isSearchActive ? 'No products match your search.' : 'No products loaded.'}
              </p>
            </div>
          ) : (
            paginatedProducts.map((p) => {
              const draft = getDraft(p.id)
              const isSaving = savingProductId === p.id
              const canSubmit = Boolean(draft.storeId && draft.stock.trim() !== '')
              const branchName = stores.find((s: StoreInfo) => s.id === draft.storeId)?.name ?? ''

              return (
                <div key={p.id} className="rounded-xl border border-base-content/8 bg-base-100 p-4">
                  <div className="mb-3">
                    <p className="font-medium text-base-content text-sm">{p.name}</p>
                    <p className="text-xs text-base-content/40 mt-0.5">SKU: {p.sku}</p>
                    {draft.storeId && (
                      <p className="text-xs text-base-content/40 mt-0.5">Branch: {branchName || draft.storeId}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <select
                      className="select select-sm select-bordered bg-base-100 w-full text-sm"
                      value={draft.storeId}
                      disabled={isSaving || stores.length === 0}
                      onChange={(e) => setDraftField(p.id, 'storeId', e.target.value)}
                    >
                      <option value="">Select branch…</option>
                      {stores.map((store: StoreInfo) => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="input input-sm input-bordered bg-base-100 flex-1 text-sm"
                        placeholder="Qty to add"
                        value={draft.stock}
                        disabled={isSaving}
                        onChange={(e) => setDraftField(p.id, 'stock', e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-primary min-w-[4.5rem]"
                        disabled={isSaving || !canSubmit}
                        onClick={() => void submitProduct(p)}
                      >
                        {isSaving ? (
                          <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                          </svg>
                        ) : 'Submit'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Mobile pagination */}
        {!isLoading && products.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between gap-3 mt-4">
            <p className="text-xs text-base-content/40">
              {startIndex + 1}–{Math.min(endIndex, products.length)} of {products.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content border border-base-content/10"
                onClick={() => setCurrentPage((pg) => Math.max(1, pg - 1))}
                disabled={safePage === 1}
              >← Prev</button>
              <span className="text-xs text-base-content/60 tabular px-1">{safePage} / {totalPages}</span>
              <button
                type="button"
                className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content border border-base-content/10"
                onClick={() => setCurrentPage((pg) => Math.min(totalPages, pg + 1))}
                disabled={safePage === totalPages}
              >Next →</button>
            </div>
          </div>
        )}
        </div>

        {/* Desktop: table layout */}
        <div className="hidden sm:block">
          <div className="rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-base-content/8 bg-base-content/3">
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide w-[40%]">Product</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide w-24">SKU</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Branch</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide w-36 sm:w-44">Add qty</th>
                    <th className="py-3 px-4 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {isLoading && allProducts.length === 0 ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-sm text-base-content/40">
                        {isSearchActive ? 'No products match your search.' : 'No products loaded.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((p, index) => {
                      const draft = getDraft(p.id)
                      const isSaving = savingProductId === p.id
                      const canSubmit = Boolean(draft.storeId && draft.stock.trim() !== '')

                      return (
                        <tr
                          key={p.id}
                          className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row"
                          style={{ animationDelay: `${index * 20}ms` }}
                        >
                          <td className="py-3.5 px-4 max-w-0">
                            <p className="font-medium text-base-content truncate">{p.name}</p>
                          </td>
                          <td className="py-3.5 px-4 text-base-content/45 text-xs tabular">{p.sku}</td>
                          <td className="py-3.5 px-4">
                            <select
                              className="select select-sm select-bordered bg-base-100 w-full max-w-xs text-sm"
                              value={draft.storeId}
                              disabled={isSaving || stores.length === 0}
                              onChange={(e) => setDraftField(p.id, 'storeId', e.target.value)}
                            >
                              <option value="">Select branch…</option>
                              {stores.map((store: StoreInfo) => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <input
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="input input-sm input-bordered bg-base-100 w-full text-sm"
                              placeholder="Qty"
                              value={draft.stock}
                              disabled={isSaving}
                              onChange={(e) => setDraftField(p.id, 'stock', e.target.value)}
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary w-full"
                              disabled={isSaving || !canSubmit}
                              onClick={() => void submitProduct(p)}
                            >
                              {isSaving ? (
                                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                                </svg>
                              ) : 'Submit'}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && products.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-base-content/8">
                <p className="text-xs text-base-content/40">
                  {startIndex + 1}–{Math.min(endIndex, products.length)} of {products.length} products
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost text-base-content/50 hover:text-base-content"
                    onClick={() => setCurrentPage((pg) => Math.max(1, pg - 1))}
                    disabled={safePage === 1}
                  >← Prev</button>
                  <span className="text-xs text-base-content/60 tabular px-1">{safePage} / {totalPages}</span>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost text-base-content/50 hover:text-base-content"
                    onClick={() => setCurrentPage((pg) => Math.min(totalPages, pg + 1))}
                    disabled={safePage === totalPages}
                  >Next →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
