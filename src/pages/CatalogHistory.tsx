import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCatalogHistory } from '../hooks/useCatalogHistory'
import { useAuth } from '../context/AuthContext'

type Tab = 'prices' | 'items' | 'deleted'

const ITEMS_PER_PAGE = 20
const VALID_TABS = new Set<Tab>(['prices', 'items', 'deleted'])

// ── Date helpers ──────────────────────────────────────────────────────────────

function localDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA')
}

function formatMonth(m: string): string {
  return new Date(`2000-${m}-15`).toLocaleDateString('en-US', { month: 'long' })
}

function formatDayOption(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function formatDateLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatPeso(n: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function priceDir(oldPrice: number | null, newPrice: number): 'up' | 'down' | 'same' | 'new' {
  if (oldPrice === null || oldPrice === undefined) return 'new'
  if (newPrice > oldPrice) return 'up'
  if (newPrice < oldPrice) return 'down'
  return 'same'
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-base-content/30 shrink-0">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

const TrendUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
  </svg>
)

const TrendDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
  </svg>
)

// Price-change "old → new" cell, shared by desktop and mobile.
function PriceChange({ oldPrice, newPrice }: { oldPrice: number | null; newPrice: number }) {
  const dir = priceDir(oldPrice, newPrice)
  const newCls =
    dir === 'up' ? 'text-warning' : dir === 'down' ? 'text-success' : 'text-base-content'
  return (
    <span className="inline-flex items-center gap-1.5 tabular">
      <span className="text-base-content/45">{formatPeso(oldPrice)}</span>
      <ArrowRight />
      <span className={`font-medium inline-flex items-center gap-0.5 ${newCls}`}>
        {dir === 'up' && <TrendUp />}
        {dir === 'down' && <TrendDown />}
        {formatPeso(newPrice)}
      </span>
    </span>
  )
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function MobileSkeletonCard() {
  return (
    <div className="p-4 border-b border-base-content/6 space-y-2.5">
      <div className="h-3.5 rounded bg-base-content/8 animate-pulse w-3/5" />
      <div className="space-y-1.5">
        <div className="h-3 rounded bg-base-content/8 animate-pulse w-4/5" />
        <div className="h-3 rounded bg-base-content/8 animate-pulse w-3/5" />
      </div>
    </div>
  )
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-base-content/6">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <div className="h-3 rounded bg-base-content/8 animate-pulse" style={{ width: `${[45, 22, 24, 18, 16][i] ?? 20}%` }} />
        </td>
      ))}
    </tr>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CatalogHistory() {
  const { isAdmin } = useAuth()
  const { priceHistory, createdItems, deletedItems, isLoading, error } = useCatalogHistory()

  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') as Tab | null
  const activeTab: Tab = rawTab && VALID_TABS.has(rawTab) ? rawTab : 'prices'
  const setActiveTab = (tab: Tab) => setSearchParams({ tab }, { replace: true })

  const [currentPage, setCurrentPage] = useState(1)
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  // Period options come from whichever tab's dataset is active.
  const activeDates = useMemo<string[]>(() => {
    const src: Array<{ createdAt: string }> =
      activeTab === 'prices' ? priceHistory : activeTab === 'items' ? createdItems : deletedItems
    return src.map((r) => r.createdAt)
  }, [activeTab, priceHistory, createdItems, deletedItems])

  const availableYears = useMemo(() => {
    const years = new Set(activeDates.map((d) => localDate(d).slice(0, 4)))
    return [...years].sort((a, b) => b.localeCompare(a))
  }, [activeDates])

  const availableMonths = useMemo(() => {
    if (!selectedYear) return []
    const months = new Set(
      activeDates.filter((d) => localDate(d).startsWith(selectedYear)).map((d) => localDate(d).slice(5, 7)),
    )
    return [...months].sort((a, b) => b.localeCompare(a))
  }, [activeDates, selectedYear])

  const availableDates = useMemo(() => {
    if (!selectedYear || !selectedMonth) return []
    const prefix = `${selectedYear}-${selectedMonth}`
    const dates = new Set(
      activeDates.filter((d) => localDate(d).startsWith(prefix)).map((d) => localDate(d)),
    )
    return [...dates].sort((a, b) => b.localeCompare(a))
  }, [activeDates, selectedYear, selectedMonth])

  useEffect(() => {
    if (availableYears.length === 0) return
    if (!availableYears.includes(selectedYear)) setSelectedYear(availableYears[0])
  }, [availableYears]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (availableMonths.length === 0) return
    if (!availableMonths.includes(selectedMonth)) setSelectedMonth(availableMonths[0])
  }, [availableMonths]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (availableDates.length === 0) return
    if (!availableDates.includes(selectedDate)) setSelectedDate(availableDates[0])
  }, [availableDates]) // eslint-disable-line react-hooks/exhaustive-deps

  const noData = availableYears.length === 0

  // ── Filtered data ───────────────────────────────────────────────────────────

  const visiblePrices = useMemo(
    () => priceHistory.filter((r) => localDate(r.createdAt) === selectedDate),
    [priceHistory, selectedDate],
  )
  const visibleItems = useMemo(
    () => createdItems.filter((r) => localDate(r.createdAt) === selectedDate),
    [createdItems, selectedDate],
  )
  const visibleDeleted = useMemo(
    () => deletedItems.filter((r) => localDate(r.createdAt) === selectedDate),
    [deletedItems, selectedDate],
  )

  const records = activeTab === 'prices' ? visiblePrices : activeTab === 'items' ? visibleItems : visibleDeleted
  const totalPages = Math.max(1, Math.ceil(records.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * ITEMS_PER_PAGE
  const pagedPrices = visiblePrices.slice(pageStart, pageStart + ITEMS_PER_PAGE)
  const pagedItems = visibleItems.slice(pageStart, pageStart + ITEMS_PER_PAGE)
  const pagedDeleted = visibleDeleted.slice(pageStart, pageStart + ITEMS_PER_PAGE)

  useEffect(() => { setCurrentPage(1) }, [activeTab, selectedDate])

  const emptyMessage = noData
    ? activeTab === 'prices'
      ? 'No price changes recorded yet.'
      : activeTab === 'items'
        ? 'No items added yet.'
        : 'No items deleted yet.'
    : 'No records on the selected date.'

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">

        <header className="mb-7">
          <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">{isAdmin ? 'Admin' : 'Operator'}</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Catalog history</h1>
          <p className="text-sm text-base-content/45 mt-1">Price changes and newly added items</p>
        </header>

        {/* Period filter bar */}
        <div className="rounded-xl border border-base-content/8 bg-base-100 px-4 py-3.5 mb-5 overflow-x-auto">
          <div className="flex items-end gap-5 min-w-fit">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-base-content/45 pl-0.5">Period</span>
              <div className="join">
                <select
                  value={selectedYear}
                  onChange={e => { setSelectedYear(e.target.value); setSelectedMonth(''); setSelectedDate('') }}
                  disabled={isLoading || noData}
                  className="join-item select select-sm select-bordered bg-base-100 w-20 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {noData
                    ? <option value="">—</option>
                    : availableYears.map(y => <option key={y} value={y}>{y}</option>)
                  }
                </select>
                <select
                  value={selectedMonth}
                  onChange={e => { setSelectedMonth(e.target.value); setSelectedDate('') }}
                  disabled={isLoading || availableMonths.length === 0}
                  className="join-item select select-sm select-bordered bg-base-100 w-28 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {availableMonths.length === 0
                    ? <option value="">—</option>
                    : availableMonths.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)
                  }
                </select>
                <select
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  disabled={isLoading || availableDates.length === 0}
                  className="join-item select select-sm select-bordered bg-base-100 w-32 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {availableDates.length === 0
                    ? <option value="">—</option>
                    : availableDates.map(d => <option key={d} value={d}>{formatDayOption(d)}</option>)
                  }
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Date label */}
        {selectedDate && (
          <p className="text-sm font-medium text-base-content/70 mb-3">
            {formatDateLabel(selectedDate)}
          </p>
        )}

        {/* Tabs */}
        <div className="relative flex items-center gap-0.5 mb-4 overflow-x-auto after:absolute after:bottom-0 after:inset-x-0 after:h-px after:bg-base-content/8">
          {([
            { id: 'prices' as Tab, label: 'Price changes', count: visiblePrices.length },
            { id: 'items' as Tab, label: 'Added items', count: visibleItems.length },
            { id: 'deleted' as Tab, label: 'Deleted items', count: visibleDeleted.length },
          ]).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                activeTab === tab.id ? 'text-primary' : 'text-base-content/45 hover:text-base-content'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] font-semibold tabular px-1.5 py-px rounded-full ${
                  activeTab === tab.id ? 'bg-primary/12 text-primary' : 'bg-base-content/8 text-base-content/40'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />
              )}
            </button>
          ))}
        </div>

        {error ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-4 py-3 text-sm text-error mb-5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        ) : null}

        <div className="rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">

          {/* ── PRICE CHANGES ─────────────────────────────────────────────── */}
          {activeTab === 'prices' && (
            <>
              {/* Mobile */}
              <div className="sm:hidden divide-y divide-base-content/6">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <MobileSkeletonCard key={i} />)
                ) : visiblePrices.length === 0 ? (
                  <div className="py-16 text-center"><p className="text-sm text-base-content/40">{emptyMessage}</p></div>
                ) : (
                  pagedPrices.map((h, index) => (
                    <div key={h.id} className="p-4 space-y-2 animate-row" style={{ animationDelay: `${index * 25}ms` }}>
                      <p className="font-medium text-sm text-base-content leading-snug">{h.itemName}</p>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-base-content/55">{h.storeName}</span>
                        <PriceChange oldPrice={h.oldPrice} newPrice={h.newPrice} />
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-base-content/40">
                        <span>{h.changedBy}</span>
                        <span className="tabular">{formatTime(h.createdAt)}</span>
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
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Branch</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Old → New price</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Changed by</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                    ) : visiblePrices.length === 0 ? (
                      <tr><td colSpan={5} className="py-16 text-center text-sm text-base-content/40">{emptyMessage}</td></tr>
                    ) : (
                      pagedPrices.map((h, index) => (
                        <tr key={h.id} className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row" style={{ animationDelay: `${index * 25}ms` }}>
                          <td className="py-3.5 px-4 font-medium text-base-content">{h.itemName}</td>
                          <td className="py-3.5 px-4 text-base-content/60">{h.storeName}</td>
                          <td className="py-3.5 px-4 whitespace-nowrap"><PriceChange oldPrice={h.oldPrice} newPrice={h.newPrice} /></td>
                          <td className="py-3.5 px-4 text-base-content/60">{h.changedBy}</td>
                          <td className="py-3.5 px-4 text-base-content/45 text-xs tabular whitespace-nowrap">{formatTime(h.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── ADDED ITEMS ───────────────────────────────────────────────── */}
          {activeTab === 'items' && (
            <>
              {/* Mobile */}
              <div className="sm:hidden divide-y divide-base-content/6">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <MobileSkeletonCard key={i} />)
                ) : visibleItems.length === 0 ? (
                  <div className="py-16 text-center"><p className="text-sm text-base-content/40">{emptyMessage}</p></div>
                ) : (
                  pagedItems.map((it, index) => (
                    <div key={it.id} className="p-4 space-y-2 animate-row" style={{ animationDelay: `${index * 25}ms` }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm text-base-content leading-snug">{it.itemName}</p>
                        <span className="text-sm font-semibold text-base-content tabular shrink-0">{formatPeso(it.defaultPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-base-content/55">
                        <span>SKU: {it.sku || '—'}</span>
                        <span>Cost {formatPeso(it.cost)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-base-content/40">
                        <span>{it.createdBy}</span>
                        <span className="tabular">{formatTime(it.createdAt)}</span>
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
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">SKU</th>
                      <th className="py-3 px-4 text-right text-xs font-medium text-base-content/45 tracking-wide">Cost</th>
                      <th className="py-3 px-4 text-right text-xs font-medium text-base-content/45 tracking-wide">Price</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Added by</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                    ) : visibleItems.length === 0 ? (
                      <tr><td colSpan={6} className="py-16 text-center text-sm text-base-content/40">{emptyMessage}</td></tr>
                    ) : (
                      pagedItems.map((it, index) => (
                        <tr key={it.id} className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row" style={{ animationDelay: `${index * 25}ms` }}>
                          <td className="py-3.5 px-4 font-medium text-base-content break-words">{it.itemName}</td>
                          <td className="py-3.5 px-4 text-base-content/45 text-xs tabular">{it.sku || '—'}</td>
                          <td className="py-3.5 px-4 text-right text-base-content/60 tabular whitespace-nowrap">{formatPeso(it.cost)}</td>
                          <td className="py-3.5 px-4 text-right font-medium text-base-content tabular whitespace-nowrap">{formatPeso(it.defaultPrice)}</td>
                          <td className="py-3.5 px-4 text-base-content/60">{it.createdBy}</td>
                          <td className="py-3.5 px-4 text-base-content/45 text-xs tabular whitespace-nowrap">{formatTime(it.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── DELETED ITEMS ─────────────────────────────────────────────── */}
          {activeTab === 'deleted' && (
            <>
              {/* Mobile */}
              <div className="sm:hidden divide-y divide-base-content/6">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <MobileSkeletonCard key={i} />)
                ) : visibleDeleted.length === 0 ? (
                  <div className="py-16 text-center"><p className="text-sm text-base-content/40">{emptyMessage}</p></div>
                ) : (
                  pagedDeleted.map((it, index) => (
                    <div key={it.id} className="p-4 space-y-2 animate-row" style={{ animationDelay: `${index * 25}ms` }}>
                      <p className="font-medium text-sm text-base-content leading-snug">{it.itemName}</p>
                      <div className="flex items-center justify-between gap-2 text-xs text-base-content/40">
                        <span>SKU: {it.sku || '—'}</span>
                        <span>{it.deletedBy} · <span className="tabular">{formatTime(it.createdAt)}</span></span>
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
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">SKU</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Deleted by</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
                    ) : visibleDeleted.length === 0 ? (
                      <tr><td colSpan={4} className="py-16 text-center text-sm text-base-content/40">{emptyMessage}</td></tr>
                    ) : (
                      pagedDeleted.map((it, index) => (
                        <tr key={it.id} className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row" style={{ animationDelay: `${index * 25}ms` }}>
                          <td className="py-3.5 px-4 font-medium text-base-content break-words">{it.itemName}</td>
                          <td className="py-3.5 px-4 text-base-content/45 text-xs tabular">{it.sku || '—'}</td>
                          <td className="py-3.5 px-4 text-base-content/60">{it.deletedBy}</td>
                          <td className="py-3.5 px-4 text-base-content/45 text-xs tabular whitespace-nowrap">{formatTime(it.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {!isLoading && records.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-base-content/8">
              <p className="text-xs text-base-content/40">
                {pageStart + 1}–{Math.min(pageStart + ITEMS_PER_PAGE, records.length)} of {records.length}
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
