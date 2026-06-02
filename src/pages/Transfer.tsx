import { useMemo, useState } from 'react'
import { useStockLevels } from '../hooks/useStockLevels'

const ITEMS_PER_PAGE = 15

function stockColor(count: number): string {
  if (count === 0) return 'text-error font-semibold'
  if (count < 5) return 'text-warning font-semibold'
  return 'text-success font-medium'
}

function StockBadge({ count }: { count: number }) {
  return <span className={`tabular text-sm ${stockColor(count)}`}>{count}</span>
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-base-content/6">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <div
            className="h-3 rounded bg-base-content/8 animate-pulse"
            style={{ width: `${i === 0 ? 55 : i === 1 ? 22 : 40}%` }}
          />
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
      <div className="grid grid-cols-2 gap-2">
        <div className="h-8 rounded-lg bg-base-content/8 animate-pulse" />
        <div className="h-8 rounded-lg bg-base-content/8 animate-pulse" />
      </div>
    </div>
  )
}

export function Transfer() {
  const { products, stores, source, cachedAt, isLoading, isRefreshing, isServerLoading, error, refresh } =
    useStockLevels()
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => {
      const hay = `${p.name} ${p.sku}`.toLowerCase()
      return q.split(/\s+/).every((t) => hay.includes(t))
    })
  }, [products, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const handleSearch = (val: string) => {
    setQuery(val)
    setCurrentPage(1)
  }

  const colCount = 2 + stores.length

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Operator</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Stock levels</h1>
            <p className="text-sm text-base-content/45 mt-1">
              {source === 'loyverse' ? 'Live from Loyverse' : 'Mock data'} · current stock per branch
            </p>
            {isLoading ? (
              <p className="text-xs text-primary/70 mt-1.5">Loading stock levels…</p>
            ) : isServerLoading ? (
              <p className="text-xs text-warning/80 mt-1.5 flex items-center gap-1.5">
                <svg className="animate-spin shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                </svg>
                Server is syncing latest stock from Loyverse — data updates automatically
              </p>
            ) : cachedAt ? (
              <p className="text-xs text-base-content/35 mt-1.5">
                Updated {new Date(cachedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content border border-base-content/10 hover:border-base-content/20 shrink-0"
            disabled={isLoading || isRefreshing}
            onClick={() => void refresh()}
          >
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={isRefreshing ? 'animate-spin' : ''}
            >
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
            <span>{error}</span>
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
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-base-content/12 bg-base-100 pl-9 pr-3.5 py-2 text-sm text-base-content placeholder:text-base-content/30 outline-none focus:border-primary/60 transition-colors duration-150"
              disabled={isLoading && products.length === 0}
            />
          </div>
        </div>

        {/* Stock legend */}
        {!isLoading && products.length > 0 && (
          <div className="flex items-center gap-4 mb-4 text-xs text-base-content/50">
            <span className="flex items-center gap-1.5"><span className="text-success font-medium">■</span> In stock (5+)</span>
            <span className="flex items-center gap-1.5"><span className="text-warning font-semibold">■</span> Low (1–4)</span>
            <span className="flex items-center gap-1.5"><span className="text-error font-semibold">■</span> Out (0)</span>
          </div>
        )}

        <div className="rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">

          {/* Mobile: card layout */}
          <div className="sm:hidden divide-y divide-base-content/6">
            {isLoading && products.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => <MobileSkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-base-content/40">
                  {query ? 'No products match your search.' : 'No products loaded.'}
                </p>
              </div>
            ) : (
              paginated.map((p, index) => (
                <div
                  key={p.id}
                  className="p-4 space-y-2.5 animate-row"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div>
                    <p className="font-medium text-sm text-base-content leading-snug">{p.name}</p>
                    {p.sku && <p className="text-xs text-base-content/40 mt-0.5">{p.sku}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {p.stocks.map((s) => (
                      <div
                        key={s.storeId}
                        className="rounded-lg border border-base-content/8 bg-base-200/50 px-3 py-2"
                      >
                        <p className="text-[10px] text-base-content/45 truncate mb-0.5">{s.storeName}</p>
                        <StockBadge count={s.stock} />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-content/8 bg-base-content/3">
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide w-[45%]">Product</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide w-24">SKU</th>
                  {stores.map((s) => (
                    <th key={s.id} className="py-3 px-4 text-center text-xs font-medium text-base-content/45 tracking-wide whitespace-nowrap">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && products.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={colCount} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="py-16 text-center text-sm text-base-content/40">
                      {query ? 'No products match your search.' : 'No products loaded.'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((p, index) => (
                    <tr
                      key={p.id}
                      className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row"
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <td className="py-3.5 px-4 font-medium text-base-content max-w-0">
                        <p className="truncate">{p.name}</p>
                      </td>
                      <td className="py-3.5 px-4 text-base-content/45 text-xs tabular">{p.sku}</td>
                      {p.stocks.map((s) => (
                        <td key={s.storeId} className="py-3.5 px-4 text-center">
                          <StockBadge count={s.stock} />
                        </td>
                      ))}
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
                {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                {query && products.length !== filtered.length ? ` (filtered from ${products.length})` : ''}
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
