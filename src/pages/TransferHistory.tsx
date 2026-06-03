import { useEffect, useMemo, useState } from 'react'
import { useTransferRequests } from '../hooks/useTransferRequests'
import { useAuth } from '../context/AuthContext'
import type { TransferRequest, TransferRequestStatus } from '../api/types'

function localDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA') // YYYY-MM-DD
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDateLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatMonth(monthStr: string): string {
  // monthStr = "06"
  return new Date(`2000-${monthStr}-15`).toLocaleDateString('en-US', { month: 'long' })
}

function formatDayOption(dateStr: string): string {
  // dateStr = "2026-06-03" → "Tue, Jun 3"
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

const STATUS_LABELS: Record<TransferRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

const STATUS_STYLES: Record<TransferRequestStatus, string> = {
  approved:  'bg-success/12 text-success border border-success/20',
  pending:   'bg-warning/12 text-warning border border-warning/20',
  rejected:  'bg-error/12 text-error border border-error/20',
  cancelled: 'bg-base-content/6 text-base-content/35 border border-base-content/10',
}

function StatusBadge({ status }: { status: TransferRequestStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-base-content/6">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <div className="h-3 rounded bg-base-content/8 animate-pulse" style={{ width: `${[18, 42, 30, 10, 20, 18, 22][i] ?? 25}%` }} />
        </td>
      ))}
    </tr>
  )
}

function ReviewedCell({ r }: { r: TransferRequest }) {
  if (!r.reviewedBy) return <span className="text-base-content/25">—</span>
  return (
    <div>
      <span className="text-base-content/60">{r.reviewedBy}</span>
      {r.reviewedAt && (
        <span className="text-base-content/35 ml-1">· {formatTime(r.reviewedAt)}</span>
      )}
      {r.rejectionReason && (
        <p className="text-[11px] text-error/70 mt-0.5 leading-snug">{r.rejectionReason}</p>
      )}
    </div>
  )
}

export function TransferHistory() {
  const { requests, isLoading, error, fetchRequests } = useTransferRequests()
  const { isAdmin } = useAuth()

  const [selectedYear,  setSelectedYear]  = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedDate,  setSelectedDate]  = useState('')
  const [statusFilter,  setStatusFilter]  = useState('all')

  useEffect(() => { void fetchRequests() }, [fetchRequests])

  // ── Cascaded filter values ─────────────────────────────────────────────────

  const availableYears = useMemo(() => {
    const years = new Set(requests.map(r => localDate(r.createdAt).slice(0, 4)))
    return [...years].sort((a, b) => b.localeCompare(a)) // newest first
  }, [requests])

  const availableMonths = useMemo(() => {
    if (!selectedYear) return []
    const months = new Set(
      requests
        .filter(r => localDate(r.createdAt).startsWith(selectedYear))
        .map(r => localDate(r.createdAt).slice(5, 7)),
    )
    return [...months].sort((a, b) => b.localeCompare(a)) // newest first
  }, [requests, selectedYear])

  const availableDates = useMemo(() => {
    if (!selectedYear || !selectedMonth) return []
    const prefix = `${selectedYear}-${selectedMonth}`
    const dates = new Set(
      requests
        .filter(r => localDate(r.createdAt).startsWith(prefix))
        .map(r => localDate(r.createdAt)),
    )
    return [...dates].sort((a, b) => b.localeCompare(a)) // newest first
  }, [requests, selectedYear, selectedMonth])

  // Auto-cascade: pick first valid option at each level when data loads/changes
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

  const dateRequests = useMemo(
    () => requests.filter(r => localDate(r.createdAt) === selectedDate),
    [requests, selectedDate],
  )

  const filtered = useMemo(() => {
    const base = statusFilter === 'all' ? dateRequests : dateRequests.filter(r => r.status === statusFilter)
    return [...base].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [dateRequests, statusFilter])

  const summary = useMemo(() => ({
    total:     dateRequests.length,
    approved:  dateRequests.filter(r => r.status === 'approved').length,
    pending:   dateRequests.filter(r => r.status === 'pending').length,
    rejected:  dateRequests.filter(r => r.status === 'rejected').length,
    cancelled: dateRequests.filter(r => r.status === 'cancelled').length,
  }), [dateRequests])

  const colCount = isAdmin ? 7 : 6

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="mb-7">
          <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">
            {isAdmin ? 'Admin' : 'Operator'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Transfer history</h1>
          <p className="text-sm text-base-content/45 mt-1">
            {isAdmin ? 'All transfer requests filtered by date' : 'Your transfer requests filtered by date'}
          </p>
        </header>

        {/* Filter bar */}
        <div className="rounded-xl border border-base-content/8 bg-base-100 px-4 py-3.5 mb-5 overflow-x-auto">
          <div className="flex items-end gap-5 min-w-fit">

            {/* Period: Year → Month → Date joined */}
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

            {/* Vertical divider */}
            <div className="w-px bg-base-content/10 h-8 mb-0.5 shrink-0" />

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-base-content/45 pl-0.5">Status</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                disabled={isLoading || noData}
                className="select select-sm select-bordered bg-base-100 w-36 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

          </div>
        </div>

        {/* Date label + summary chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <p className="text-sm font-medium text-base-content/70">
            {selectedDate ? formatDateLabel(selectedDate) : ''}
          </p>
          {!isLoading && summary.total > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="text-base-content/40">{summary.total} total</span>
              {summary.approved  > 0 && <span className="text-success font-medium">{summary.approved} approved</span>}
              {summary.pending   > 0 && <span className="text-warning font-medium">{summary.pending} pending</span>}
              {summary.rejected  > 0 && <span className="text-error font-medium">{summary.rejected} rejected</span>}
              {summary.cancelled > 0 && <span className="text-base-content/35">{summary.cancelled} cancelled</span>}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-4 py-3 text-sm text-error mb-5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ── Mobile: card layout ── */}
        <div className="sm:hidden space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-base-content/8 bg-base-100 p-4 space-y-2.5">
                <div className="h-3.5 w-3/5 rounded bg-base-content/8 animate-pulse" />
                <div className="h-3 w-1/4 rounded bg-base-content/8 animate-pulse" />
                <div className="h-3 w-2/5 rounded bg-base-content/8 animate-pulse" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-base-content/8 bg-base-100 py-16 text-center">
              <p className="text-sm text-base-content/40">
                {noData ? 'No transfer requests yet.' : 'No requests match the selected filter.'}
              </p>
            </div>
          ) : (
            filtered.map((r, index) => (
              <div
                key={r.id}
                className="rounded-xl border border-base-content/8 bg-base-100 p-4 space-y-2 animate-row"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-base-content leading-snug truncate">{r.itemName}</p>
                    {r.sku && <p className="text-xs text-base-content/40 mt-0.5">{r.sku}</p>}
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-base-content/60 flex-wrap">
                  <span>{r.fromStoreName}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <span>{r.toStoreName}</span>
                  <span className="text-base-content/25">·</span>
                  <span className="font-medium text-base-content">{r.quantity} units</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-base-content/40">
                  <span>{formatTime(r.createdAt)}</span>
                  {isAdmin && <span>by {r.requestedBy}</span>}
                  {r.reviewedBy && (
                    <span>
                      reviewed by {r.reviewedBy}
                      {r.reviewedAt ? ` · ${formatTime(r.reviewedAt)}` : ''}
                    </span>
                  )}
                </div>

                {r.rejectionReason && (
                  <p className="text-xs text-error/70 leading-snug">{r.rejectionReason}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Desktop: table layout ── */}
        <div className="hidden sm:block rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-content/8 bg-base-content/3">
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide w-20">Time</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Item</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Transfer</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-base-content/45 tracking-wide w-14">Qty</th>
                  {isAdmin && (
                    <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide w-32">Requested By</th>
                  )}
                  <th className="py-3 px-4 text-center text-xs font-medium text-base-content/45 tracking-wide w-28">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Reviewed</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={colCount} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="py-16 text-center text-sm text-base-content/40">
                      {noData ? 'No transfer requests yet.' : 'No requests match the selected filter.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, index) => (
                    <tr
                      key={r.id}
                      className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row"
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <td className="py-3.5 px-4 text-xs text-base-content/45 tabular whitespace-nowrap">
                        {formatTime(r.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 max-w-0">
                        <p className="font-medium text-base-content truncate">{r.itemName}</p>
                        {r.sku && <p className="text-xs text-base-content/40 mt-0.5">{r.sku}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-base-content/60 whitespace-nowrap">
                        {r.fromStoreName}
                        <span className="mx-1.5 text-base-content/25">→</span>
                        {r.toStoreName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-base-content tabular">
                        {r.quantity}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-xs text-base-content/55 max-w-0">
                          <p className="truncate">{r.requestedBy}</p>
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <ReviewedCell r={r} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  )
}
