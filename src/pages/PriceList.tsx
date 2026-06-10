import { useEffect, useMemo, useState } from 'react'
import type { ItemPrice } from '../api/types'
import { useItemPrices } from '../hooks/useItemPrices'

const ITEMS_PER_PAGE = 10

function formatPeso(n: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const ListIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

/** Modal showing one item's selling price per store. */
function PriceModal({ item, onClose }: { item: ItemPrice; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-base-content/10 bg-base-100 shadow-xl max-h-[85vh] flex flex-col animate-row">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-base-content/8">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-base-content/35 mb-0.5">Price per branch</p>
            <h2 className="text-base font-semibold text-base-content break-words">{item.name}</h2>
            <p className="text-xs text-base-content/40 mt-0.5">SKU: {item.sku || '—'} · Cost {formatPeso(item.cost)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle text-base-content/50 hover:text-base-content shrink-0"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-2">
          <div className="divide-y divide-base-content/6">
            {item.prices.map((p) => (
              <div key={p.storeId} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-sm text-base-content/70 break-words pr-2">{p.storeName}</span>
                <span className="text-sm font-medium text-base-content tabular shrink-0">{formatPeso(p.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-base-content/6">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <div className="h-3 rounded bg-base-content/8 animate-pulse" style={{ width: i === 0 ? '60%' : '40%' }} />
        </td>
      ))}
    </tr>
  )
}

export function PriceList() {
  const { items, stores, source, cachedAt, isLoading, progress, error, refresh } = useItemPrices()
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<ItemPrice | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    const terms = q.split(/\s+/).filter(Boolean)
    return items.filter((it) => {
      const hay = `${it.name} ${it.sku}`.toLowerCase()
      return terms.every((t) => hay.includes(t))
    })
  }, [query, items])

  useEffect(() => { setCurrentPage(1) }, [query, filtered.length])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginated = filtered.slice(startIndex, endIndex)

  const isSearchActive = query.trim().length > 0
  const sourceLabel = source === 'loyverse' ? 'Live from Loyverse' : 'Mock data'
  // Product · Cost · Prices action
  const tableCols = 3

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Operator</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Price list</h1>
            <p className="text-sm text-base-content/45 mt-1">{sourceLabel} · cost is fixed per item · tap a row to see the price per branch</p>

            {isLoading ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <svg className="animate-spin shrink-0 text-primary/80" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  <span className="text-xs text-base-content/55">Loading price list from Loyverse…</span>
                  <span className="text-xs font-semibold text-primary">{progress ? `${progress.percent}%` : '0%'}</span>
                </div>
                <div className="w-full max-w-xs h-1.5 rounded-full bg-base-content/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progress?.percent ?? 0}%` }}
                  />
                </div>
                {progress && (
                  <p className="text-[10px] text-base-content/30">
                    {progress.itemsFetched.toLocaleString()} / {progress.totalExpected.toLocaleString()} items
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-base-content/35 mt-1.5">
                {isSearchActive
                  ? `Showing ${filtered.length} of ${items.length} items`
                  : `${items.length} items · ${stores.length} branches`}
                {cachedAt && ` · updated ${new Date(cachedAt).toLocaleString()}`}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content border border-base-content/10 hover:border-base-content/20 shrink-0"
            disabled={isLoading}
            onClick={() => void refresh()}
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
            <div>
              <p className="font-medium">Error loading price list</p>
              <p className="text-xs mt-0.5 text-error/70">{error}</p>
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
              disabled={isLoading && items.length === 0}
            />
          </div>
        </div>

        {/* Mobile: card layout */}
        <div className="sm:hidden space-y-3">
          {isLoading && items.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-base-content/8 bg-base-100 p-4 space-y-3">
                <div className="h-3.5 rounded bg-base-content/8 animate-pulse w-3/5" />
                <div className="h-3 rounded bg-base-content/8 animate-pulse w-1/4" />
                <div className="h-9 rounded-lg bg-base-content/8 animate-pulse w-full" />
              </div>
            ))
          ) : paginated.length === 0 ? (
            <div className="rounded-xl border border-base-content/8 bg-base-100 py-12 text-center">
              <p className="text-sm text-base-content/40">
                {isSearchActive ? 'No items match your search.' : 'No items loaded.'}
              </p>
            </div>
          ) : (
            paginated.map((it: ItemPrice) => (
              <div key={it.id} className="rounded-xl border border-base-content/8 bg-base-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-medium text-base-content text-sm break-words">{it.name}</p>
                    <p className="text-xs text-base-content/40 mt-0.5">SKU: {it.sku || '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] uppercase tracking-wide text-base-content/35">Cost</p>
                    <p className="text-sm font-semibold text-base-content tabular">{formatPeso(it.cost)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(it)}
                  className="btn btn-sm btn-ghost w-full justify-center text-primary border border-primary/25 hover:bg-primary/10 gap-1.5"
                >
                  <ListIcon /> View price list
                </button>
              </div>
            ))
          )}

          {!isLoading && filtered.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-base-content/40">
                {startIndex + 1}–{Math.min(endIndex, filtered.length)} of {filtered.length}
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
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Product</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-base-content/45 tracking-wide w-32">Cost</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-base-content/45 tracking-wide w-44">Price per branch</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && items.length === 0 ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={tableCols} />)
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={tableCols} className="py-16 text-center text-sm text-base-content/40">
                        {isSearchActive ? 'No items match your search.' : 'No items loaded.'}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((it, index) => (
                      <tr
                        key={it.id}
                        className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row"
                        style={{ animationDelay: `${index * 20}ms` }}
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-base-content break-words">{it.name}</p>
                          <p className="text-xs text-base-content/40 mt-0.5">SKU: {it.sku || '—'}</p>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-base-content tabular whitespace-nowrap">
                          {formatPeso(it.cost)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedItem(it)}
                            className="btn btn-xs btn-ghost text-primary hover:bg-primary/10 border border-primary/25 gap-1.5"
                          >
                            <ListIcon /> View prices
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && filtered.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-base-content/8">
                <p className="text-xs text-base-content/40">
                  {startIndex + 1}–{Math.min(endIndex, filtered.length)} of {filtered.length} items
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

      {selectedItem && <PriceModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </main>
  )
}
