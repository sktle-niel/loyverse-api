import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStockRequests } from '../hooks/useStockRequests'
import { useStores } from '../hooks/useStores'

type Tab = 'all' | 'approved' | 'rejected' | 'cancelled'

const ITEMS_PER_PAGE = 20
const VALID_TABS = new Set<Tab>(['all', 'approved', 'rejected', 'cancelled'])

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

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<string, string> = {
  approved:  'status-badge status-badge-approved',
  rejected:  'status-badge status-badge-rejected',
  pending:   'status-badge status-badge-pending',
  cancelled: 'status-badge status-badge-cancelled',
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function MobileSkeletonCard() {
  return (
    <div className="p-4 border-b border-base-content/6 space-y-2.5">
      <div className="flex justify-between gap-2">
        <div className="h-3.5 rounded bg-base-content/8 animate-pulse w-3/5" />
        <div className="h-5 w-16 rounded-full bg-base-content/8 animate-pulse" />
      </div>
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
          <div className="h-3 rounded bg-base-content/8 animate-pulse" style={{ width: `${[45, 22, 12, 18, 16, 14, 20][i] ?? 20}%` }} />
        </td>
      ))}
    </tr>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') as Tab | null
  const activeTab: Tab = rawTab && VALID_TABS.has(rawTab) ? rawTab : 'all'
  const setActiveTab = (tab: Tab) => setSearchParams({ tab }, { replace: true })

  const [currentPage, setCurrentPage] = useState(1)
  const [selectedYear,  setSelectedYear]  = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedDate,  setSelectedDate]  = useState('')

  // Always fetch all requests — filtering is done client-side so badge counts are always available
  const { requests: allRequests, isLoading, error } = useStockRequests('all', true)
  const { stores } = useStores()

  const storeNameById = useMemo(
    () => new Map(stores.map((s) => [s.id, s.name])),
    [stores],
  )

  // ── Cascaded period filter ─────────────────────────────────────────────────

  const availableYears = useMemo(() => {
    const years = new Set(allRequests.map(r => localDate(r.createdAt).slice(0, 4)))
    return [...years].sort((a, b) => b.localeCompare(a))
  }, [allRequests])

  const availableMonths = useMemo(() => {
    if (!selectedYear) return []
    const months = new Set(
      allRequests
        .filter(r => localDate(r.createdAt).startsWith(selectedYear))
        .map(r => localDate(r.createdAt).slice(5, 7)),
    )
    return [...months].sort((a, b) => b.localeCompare(a))
  }, [allRequests, selectedYear])

  const availableDates = useMemo(() => {
    if (!selectedYear || !selectedMonth) return []
    const prefix = `${selectedYear}-${selectedMonth}`
    const dates = new Set(
      allRequests
        .filter(r => localDate(r.createdAt).startsWith(prefix))
        .map(r => localDate(r.createdAt)),
    )
    return [...dates].sort((a, b) => b.localeCompare(a))
  }, [allRequests, selectedYear, selectedMonth])

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

  // ── Filtered data + counts ─────────────────────────────────────────────────

  const dateRequests = useMemo(
    () => allRequests.filter(r => localDate(r.createdAt) === selectedDate),
    [allRequests, selectedDate],
  )

  const summary = useMemo(() => ({
    all:       dateRequests.length,
    approved:  dateRequests.filter(r => r.status === 'approved').length,
    rejected:  dateRequests.filter(r => r.status === 'rejected').length,
    cancelled: dateRequests.filter(r => r.status === 'cancelled').length,
  }), [dateRequests])

  const requests = useMemo(
    () => activeTab === 'all' ? dateRequests : dateRequests.filter(r => r.status === activeTab),
    [dateRequests, activeTab],
  )

  const totalPages = Math.max(1, Math.ceil(requests.length / ITEMS_PER_PAGE))
  const safePage   = Math.min(currentPage, totalPages)
  const paginatedRequests = requests.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  useEffect(() => { setCurrentPage(1) }, [activeTab, selectedDate])

  const handleTabChange = (tab: Tab) => setActiveTab(tab)

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">

        <header className="mb-7">
          <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">History</h1>
          <p className="text-sm text-base-content/45 mt-1">Stock change requests from the database</p>
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

        {/* Status tabs */}
        <div className="relative flex items-center gap-0.5 mb-4 overflow-x-auto after:absolute after:bottom-0 after:inset-x-0 after:h-px after:bg-base-content/8">
          {([
            { id: 'all'       as Tab, label: 'All',       count: summary.all       },
            { id: 'approved'  as Tab, label: 'Approved',  count: summary.approved  },
            { id: 'rejected'  as Tab, label: 'Rejected',  count: summary.rejected  },
            { id: 'cancelled' as Tab, label: 'Cancelled', count: summary.cancelled },
          ]).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-base-content/45 hover:text-base-content'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] font-semibold tabular px-1.5 py-px rounded-full ${
                  activeTab === tab.id
                    ? 'bg-primary/12 text-primary'
                    : 'bg-base-content/8 text-base-content/40'
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

          {/* Mobile: card layout */}
          <div className="sm:hidden divide-y divide-base-content/6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <MobileSkeletonCard key={i} />)
            ) : requests.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-base-content/40">
                  {noData ? 'No requests yet.' : 'No requests match the selected filter.'}
                </p>
              </div>
            ) : (
              paginatedRequests.map((req, index) => (
                <div
                  key={req.id}
                  className="p-4 space-y-2.5 animate-row"
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <p className="font-medium text-sm text-base-content leading-snug">{req.itemName}</p>
                    <span className={`${STATUS_CLASSES[req.status] ?? STATUS_CLASSES.pending} shrink-0`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-base-content/55 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span>{req.storeName || storeNameById.get(req.storeId) || req.storeId}</span>
                      <span className="tabular font-medium text-base-content/70">+{req.newStock}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>{req.requestedBy}</span>
                      <span className="text-base-content/40 tabular">{new Date(req.createdAt).toLocaleString()}</span>
                    </div>
                    {req.reviewedBy && (
                      <p className="text-base-content/40">Reviewed by {req.reviewedBy}</p>
                    )}
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
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Branch</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Qty</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Requested by</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Reviewed by</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Time</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-base-content/40">
                      {noData ? 'No requests yet.' : 'No requests match the selected filter.'}
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req, index) => (
                    <tr
                      key={req.id}
                      className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row"
                      style={{ animationDelay: `${index * 25}ms` }}
                    >
                      <td className="py-3.5 px-4 font-medium text-base-content">{req.itemName}</td>
                      <td className="py-3.5 px-4 text-base-content/60">
                        {req.storeName || storeNameById.get(req.storeId) || req.storeId}
                      </td>
                      <td className="py-3.5 px-4 text-base-content/60 tabular text-xs">+{req.newStock}</td>
                      <td className="py-3.5 px-4 text-base-content/60">{req.requestedBy}</td>
                      <td className="py-3.5 px-4">
                        <span className={STATUS_CLASSES[req.status] ?? STATUS_CLASSES.pending}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-base-content/45 text-xs">{req.reviewedBy ?? '—'}</td>
                      <td className="py-3.5 px-4 text-base-content/45 text-xs tabular whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && requests.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-base-content/8">
              <p className="text-xs text-base-content/40">
                {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, requests.length)} of {requests.length}
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
