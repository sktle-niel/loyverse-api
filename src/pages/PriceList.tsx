import { useEffect, useMemo, useState } from 'react'
import type { ItemPrice } from '../api/types'
import { useItemPrices } from '../hooks/useItemPrices'

const ITEMS_PER_PAGE = 10

function formatPeso(n: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
  const { items, stores, source, isLoading, isRefreshing, error, refresh } = useItemPrices()
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

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
  // Cost column + one column per store
  const tableCols = 2 + stores.length

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Operator</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Price list</h1>
            <p className="text-sm text-base-content/45 mt-1">{sourceLabel} · cost is fixed per item · selling price varies per branch</p>
            {!isLoading && (
              <p className="text-xs text-base-content/35 mt-1.5">
                {isSearchActive
                  ? `Showing ${filtered.length} of ${items.length} items`
                  : `${items.length} items · ${stores.length} branches`}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content border border-base-content/10 hover:border-base-content/20 shrink-0"
            disabled={isLoading || isRefreshing}
            onClick={() => void refresh()}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
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
                <div className="h-10 rounded-lg bg-base-content/8 animate-pulse w-full" />
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
                    <p className="font-medium text-base-content text-sm">{it.name}</p>
                    <p className="text-xs text-base-content/40 mt-0.5">SKU: {it.sku || '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] uppercase tracking-wide text-base-content/35">Cost</p>
                    <p className="text-sm font-semibold text-base-content tabular">{formatPeso(it.cost)}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-base-content/3 divide-y divide-base-content/6">
                  {it.prices.map((p) => (
                    <div key={p.storeId} className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs text-base-content/55 truncate pr-2">{p.storeName}</span>
                      <span className="text-sm text-base-content tabular shrink-0">{formatPeso(p.price)}</span>
                    </div>
                  ))}
                </div>
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
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide min-w-[14rem]">Product</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-base-content/45 tracking-wide w-28">Cost</th>
                    {stores.map((s) => (
                      <th key={s.id} className="py-3 px-4 text-right text-xs font-medium text-base-content/45 tracking-wide whitespace-nowrap">
                        {s.name}
                      </th>
                    ))}
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
                        <td className="py-3.5 px-4 max-w-0">
                          <p className="font-medium text-base-content truncate">{it.name}</p>
                          <p className="text-xs text-base-content/40 mt-0.5 truncate">SKU: {it.sku || '—'}</p>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-base-content tabular whitespace-nowrap">
                          {formatPeso(it.cost)}
                        </td>
                        {it.prices.map((p) => (
                          <td key={p.storeId} className="py-3.5 px-4 text-right text-base-content/80 tabular whitespace-nowrap">
                            {formatPeso(p.price)}
                          </td>
                        ))}
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
    </main>
  )
}
