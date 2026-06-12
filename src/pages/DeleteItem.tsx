import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDeletableItems } from '../hooks/useDeletableItems'
import { useToast } from '../context/ToastContext'
import type { StockLevelProduct } from '../api/types'

const ITEMS_PER_PAGE = 15

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-base-content/6">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <div className="h-3 rounded bg-base-content/8 animate-pulse" style={{ width: `${i === 0 ? 55 : 30}%` }} />
        </td>
      ))}
    </tr>
  )
}

function MobileSkeletonCard() {
  return (
    <div className="p-4 border-b border-base-content/6 space-y-2.5">
      <div className="h-3.5 w-3/5 rounded bg-base-content/8 animate-pulse" />
      <div className="h-3 w-1/4 rounded bg-base-content/8 animate-pulse" />
      <div className="h-8 w-full rounded-lg bg-base-content/8 animate-pulse" />
    </div>
  )
}

const TrashIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

const Spinner = ({ size = 13 }: { size?: number }) => (
  <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
  </svg>
)

function ConfirmDeleteModal({
  product,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  product: StockLevelProduct
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-base-100 rounded-xl border border-base-content/10 shadow-2xl w-full max-w-sm p-6 space-y-4 animate-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-error/10 flex items-center justify-center shrink-0 text-error">
            <TrashIcon size={16} />
          </div>
          <h2 className="text-base font-semibold text-base-content">Delete item?</h2>
        </div>
        <p className="text-sm text-base-content/60 leading-relaxed">
          <span className="font-medium text-base-content">{product.name}</span> will be permanently deleted from Loyverse.
          This can’t be undone.
        </p>
        <div className="rounded-lg bg-base-200/60 border border-base-content/8 px-3.5 py-2.5 space-y-1">
          {product.stocks.map((s) => (
            <div key={s.storeId} className="flex items-center justify-between text-xs">
              <span className="text-base-content/55">{s.storeName}</span>
              <span className="tabular font-medium text-success">{s.stock}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            className="flex-1 btn btn-sm btn-ghost border border-base-content/10"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 btn btn-sm btn-error"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <Spinner /> : <TrashIcon />}
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function DeleteItem() {
  const { items, stores, isLoading, error, refetch, deleteItem } = useDeletableItems()
  const { showToast } = useToast()

  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmTarget, setConfirmTarget] = useState<StockLevelProduct | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((p) => {
      const hay = `${p.name} ${p.sku}`.toLowerCase()
      return q.split(/\s+/).every((t) => hay.includes(t))
    })
  }, [items, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * ITEMS_PER_PAGE
  const paginated = filtered.slice(pageStart, pageStart + ITEMS_PER_PAGE)

  const handleSearch = (val: string) => {
    setQuery(val)
    setCurrentPage(1)
  }

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return
    setDeletingId(confirmTarget.id)
    try {
      const res = await deleteItem(confirmTarget.id)
      showToast({ message: `"${res.itemName}" deleted from Loyverse.`, durationMs: 6000 })
      setConfirmTarget(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Delete failed'
      showToast({ message: `Failed to delete. ${msg}`, durationMs: 7000 })
    } finally {
      setDeletingId(null)
    }
  }

  const colCount = 2 + stores.length + 1

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Operator</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Delete item</h1>
            <p className="text-sm text-base-content/45 mt-1">Only items with 0 stock in every branch can be deleted.</p>
            {!isLoading && (
              <p className="text-xs text-base-content/35 mt-1.5">
                {query.trim() ? `Showing ${filtered.length} of ${items.length}` : `${items.length} item${items.length === 1 ? '' : 's'} eligible`}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content border border-base-content/10 hover:border-base-content/20 shrink-0"
            disabled={isLoading}
            onClick={() => void refetch()}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </header>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-4 py-3 text-sm text-error mb-5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Info note */}
        <div className="flex items-start gap-2.5 rounded-lg border border-base-content/10 bg-base-content/3 px-4 py-3 text-sm text-base-content/55 mb-5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px text-base-content/40">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Items with stock in any branch are hidden here and can’t be deleted. Stock is re-checked at the moment you delete.</span>
        </div>

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
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-base-content/12 bg-base-100 pl-9 pr-3.5 py-2 text-sm text-base-content placeholder:text-base-content/30 outline-none focus:border-primary/60 transition-colors duration-150"
              disabled={isLoading && items.length === 0}
            />
          </div>
        </div>

        <div className="rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">

          {/* Mobile */}
          <div className="sm:hidden divide-y divide-base-content/6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <MobileSkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-base-content/40">
                  {query ? 'No items match your search.' : 'No zero-stock items to delete.'}
                </p>
              </div>
            ) : (
              paginated.map((p, index) => (
                <div key={p.id} className="px-4 py-3.5 animate-row" style={{ animationDelay: `${index * 20}ms` }}>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-base-content leading-snug break-words">{p.name}</p>
                      {p.sku && <p className="text-xs text-base-content/40 mt-0.5">{p.sku}</p>}
                    </div>
                    <button
                      type="button"
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-error/20 bg-error/5 text-error hover:bg-error/10 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={deletingId === p.id}
                      onClick={() => setConfirmTarget(p)}
                    >
                      {deletingId === p.id ? <Spinner size={11} /> : <TrashIcon size={11} />}
                      Delete
                    </button>
                  </div>
                  <div className="space-y-1">
                    {p.stocks.map((s) => (
                      <div key={s.storeId} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-base-content/45 truncate">{s.storeName}</span>
                        <span className="tabular text-sm text-base-content/50">{s.stock}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-content/8 bg-base-content/3">
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide w-[40%]">Product</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide w-24">SKU</th>
                  {stores.map((s) => (
                    <th key={s.id} className="py-3 px-4 text-center text-xs font-medium text-base-content/45 tracking-wide whitespace-nowrap">{s.name}</th>
                  ))}
                  <th className="py-3 px-4 w-px" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={colCount} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="py-16 text-center text-sm text-base-content/40">
                      {query ? 'No items match your search.' : 'No zero-stock items to delete.'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((p, index) => (
                    <tr key={p.id} className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row" style={{ animationDelay: `${index * 20}ms` }}>
                      <td className="py-3.5 px-4 font-medium text-base-content break-words">{p.name}</td>
                      <td className="py-3.5 px-4 text-base-content/45 text-xs tabular">{p.sku || '—'}</td>
                      {p.stocks.map((s) => (
                        <td key={s.storeId} className="py-3.5 px-4 text-center tabular text-sm text-base-content/50">{s.stock}</td>
                      ))}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-error/80 hover:text-error hover:bg-error/8 border border-transparent hover:border-error/20 transition-colors duration-150 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={deletingId === p.id}
                          onClick={() => setConfirmTarget(p)}
                          title="Delete item"
                        >
                          {deletingId === p.id ? <Spinner size={11} /> : <TrashIcon size={11} />}
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && filtered.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-base-content/8">
              <p className="text-xs text-base-content/40">
                {pageStart + 1}–{Math.min(pageStart + ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
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

      {confirmTarget && (
        <ConfirmDeleteModal
          product={confirmTarget}
          isDeleting={deletingId === confirmTarget.id}
          onCancel={() => { if (!deletingId) setConfirmTarget(null) }}
          onConfirm={() => void handleConfirmDelete()}
        />
      )}
    </main>
  )
}
