import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useReceipts } from '../hooks/useReceipts'
import type { Receipt, ReceiptsSummary } from '../api/types'

const ITEMS_PER_PAGE = 25

function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
}
function dayStartISO(d: string): string {
  return new Date(`${d}T00:00:00`).toISOString()
}
function dayEndISO(d: string): string {
  return new Date(`${d}T23:59:59.999`).toISOString()
}
function formatPeso(n: number): string {
  return `₱${(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function formatReceiptDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const ReceiptIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
    <line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="13" y2="16" />
  </svg>
)
const RefundIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" /><path d="M3.51 13a9 9 0 1 0 .49-4.51L3 13" />
  </svg>
)
const StoreIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1-5h16l1 5M4 9v11h16V9M4 9h16" /><path d="M9 20v-6h6v6" />
  </svg>
)
const EmployeeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
)
const ChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-base-content/40 shrink-0">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

/** Loyverse-style dropdown with a checkbox per option + a "select all" header. null = all selected. */
function MultiSelectDropdown({ icon, allLabel, noun, options, selected, onChange }: {
  icon?: ReactNode
  allLabel: string
  noun: string
  options: { id: string; name: string }[]
  selected: Set<string> | null
  onChange: (next: Set<string> | null) => void
}) {
  const [open, setOpen] = useState(false)
  const total = options.length
  const allSelected = selected === null || selected.size === total
  const isChecked = (id: string) => (selected === null ? true : selected.has(id))
  const count = selected === null ? total : selected.size

  const label = allSelected
    ? allLabel
    : count === 0
      ? `No ${noun}`
      : count === 1
        ? options.find((o) => isChecked(o.id))?.name ?? `1 ${noun}`
        : `${count} ${noun}`

  const toggleAll = (checked: boolean) => onChange(checked ? new Set(options.map((o) => o.id)) : new Set())
  const toggleOne = (id: string) => {
    const base = selected === null ? new Set(options.map((o) => o.id)) : new Set(selected)
    if (base.has(id)) base.delete(id)
    else base.add(id)
    onChange(base)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-base-content/12 bg-base-100 px-3 py-1.5 text-sm text-base-content hover:border-base-content/25 transition-colors min-w-[10rem]"
      >
        {icon && <span className="text-base-content/45 shrink-0">{icon}</span>}
        <span className="truncate flex-1 text-left">{label}</span>
        <ChevronDown />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-30 w-64 max-h-72 overflow-y-auto rounded-lg border border-base-content/10 bg-base-100 shadow-xl py-1">
            <label className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-base-content/5 border-b border-base-content/8">
              <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} />
              <span className="text-sm font-medium text-base-content">{allLabel}</span>
            </label>
            {options.length === 0 ? (
              <p className="px-3 py-2 text-xs text-base-content/40">None available.</p>
            ) : (
              options.map((o) => (
                <label key={o.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-base-content/5">
                  <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={isChecked(o.id)} onChange={() => toggleOne(o.id)} />
                  <span className="text-sm text-base-content/80 break-words">{o.name}</span>
                </label>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ReceiptDrawer({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = 'unset' }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 w-full sm:max-w-md bg-base-100 shadow-2xl flex flex-col animate-row">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-base-content/8">
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost btn-circle text-base-content/50 hover:text-base-content" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {receipt.type === 'REFUND' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/20">Refund</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Total */}
          <div className="text-center mb-5">
            <p className="text-3xl font-semibold text-base-content tabular">{formatPeso(receipt.total)}</p>
            <p className="text-xs text-base-content/45 mt-1">Total</p>
          </div>

          <div className="border-t border-base-content/8 pt-4 space-y-0.5 text-sm">
            <p className="text-base-content/70"><span className="text-base-content/45">Employee:</span> {receipt.employeeName}</p>
            {receipt.posDeviceName && (
              <p className="text-base-content/70"><span className="text-base-content/45">POS:</span> {receipt.posDeviceName}</p>
            )}
            <p className="text-base-content/70"><span className="text-base-content/45">Store:</span> {receipt.storeName}</p>
          </div>

          {/* Line items */}
          <div className="border-t border-base-content/8 mt-4 pt-3 divide-y divide-base-content/6">
            {receipt.lineItems.length === 0 ? (
              <p className="text-sm text-base-content/40 py-2">No line items.</p>
            ) : (
              receipt.lineItems.map((li, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-base-content break-words">{li.itemName}{li.variantName ? ` (${li.variantName})` : ''}</p>
                    <p className="text-xs text-base-content/45 mt-0.5 tabular">{li.quantity} × {formatPeso(li.price)}</p>
                  </div>
                  <span className="text-sm font-medium text-base-content tabular whitespace-nowrap">{formatPeso(li.total)}</span>
                </div>
              ))
            )}
          </div>

          {/* Total + payments */}
          <div className="border-t border-base-content/8 mt-1 pt-3 space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-base-content">Total</span>
              <span className="text-base-content tabular">{formatPeso(receipt.total)}</span>
            </div>
            {receipt.payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm text-base-content/70">
                <span>{p.name}</span>
                <span className="tabular">{formatPeso(p.amount)}</span>
              </div>
            ))}
          </div>

          {/* Footer meta */}
          <div className="border-t border-base-content/8 mt-4 pt-3 flex items-center justify-between text-xs text-base-content/40">
            <span>{formatReceiptDate(receipt.date)}</span>
            <span className="tabular">№ {receipt.receiptNumber}</span>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  )
}

function SummaryCard({ icon, label, value, sub, tint }: {
  icon: ReactNode; label: string; value: string | number; sub?: string; tint: string
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-base-content/8 bg-base-100 px-5 py-4">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tint}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-base-content/45">{label}</p>
        <p className="text-2xl font-semibold text-base-content tabular leading-tight">{value}</p>
        {sub && <p className="text-xs text-base-content/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-base-content/6">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4"><div className="h-3 rounded bg-base-content/8 animate-pulse" style={{ width: `${[40, 55, 40, 45, 20, 25, 30][i] ?? 30}%` }} /></td>
      ))}
    </tr>
  )
}

export function Receipts() {
  const { receipts, stores, employees, source, isLoading, error, load } = useReceipts()

  const [fromDate, setFromDate] = useState(todayLocal)
  const [toDate, setToDate] = useState(todayLocal)
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string> | null>(null)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string> | null>(null)
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selected, setSelected] = useState<Receipt | null>(null)

  // Date range is fetched server-side; store/employee multi-select filters client-side (no refetch).
  useEffect(() => {
    void load({ from: dayStartISO(fromDate), to: dayEndISO(toDate) })
  }, [fromDate, toDate, load])

  const scopeFiltered = useMemo(() => {
    const allStores = selectedStoreIds === null || selectedStoreIds.size === stores.length
    const allEmps = selectedEmployeeIds === null || selectedEmployeeIds.size === employees.length
    return receipts.filter((r) => {
      if (!allStores && !selectedStoreIds!.has(r.storeId)) return false
      if (!allEmps && !selectedEmployeeIds!.has(r.employeeId)) return false
      return true
    })
  }, [receipts, selectedStoreIds, selectedEmployeeIds, stores.length, employees.length])

  // Summary reflects the date + store + employee filters (not the text search), like Loyverse.
  const summary = useMemo<ReceiptsSummary>(() => {
    const sales = scopeFiltered.filter((r) => r.type === 'SALE')
    return {
      receipts: scopeFiltered.length,
      sales: sales.length,
      refunds: scopeFiltered.filter((r) => r.type === 'REFUND').length,
      totalSales: sales.reduce((sum, r) => sum + r.total, 0),
    }
  }, [scopeFiltered])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return scopeFiltered
    return scopeFiltered.filter((r) => {
      const hay = `${r.receiptNumber} ${r.storeName} ${r.employeeName}`.toLowerCase()
      return q.split(/\s+/).every((t) => hay.includes(t))
    })
  }, [scopeFiltered, query])

  useEffect(() => { setCurrentPage(1) }, [query, fromDate, toDate, selectedStoreIds, selectedEmployeeIds])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * ITEMS_PER_PAGE
  const paginated = filtered.slice(pageStart, pageStart + ITEMS_PER_PAGE)

  const inputClass = 'rounded-lg border border-base-content/12 bg-base-100 px-3 py-1.5 text-sm text-base-content outline-none focus:border-primary/60 transition-colors'

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-7xl mx-auto">
        <header className="mb-5">
          <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Operator</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Receipts</h1>
          <p className="text-sm text-base-content/45 mt-1">
            {source === 'loyverse' ? 'Live sales from Loyverse' : 'Mock data'} · pick a date range and tap a receipt for details
          </p>
        </header>

        {/* Filters */}
        <div className="rounded-xl border border-base-content/8 bg-base-100 px-4 py-3 mb-5 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-base-content/45">From</span>
            <input type="date" className={inputClass} value={fromDate} max={toDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-base-content/45">To</span>
            <input type="date" className={inputClass} value={toDate} min={fromDate} max={todayLocal()} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-base-content/45">Store</span>
            <MultiSelectDropdown
              icon={<StoreIcon />}
              allLabel="All stores"
              noun="stores"
              options={stores.map((s) => ({ id: s.id, name: s.name }))}
              selected={selectedStoreIds}
              onChange={setSelectedStoreIds}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-base-content/45">Employee</span>
            <MultiSelectDropdown
              icon={<EmployeeIcon />}
              allLabel="All employees"
              noun="employees"
              options={employees}
              selected={selectedEmployeeIds}
              onChange={setSelectedEmployeeIds}
            />
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content border border-base-content/10 hover:border-base-content/20 ml-auto"
            disabled={isLoading}
            onClick={() => void load({ from: dayStartISO(fromDate), to: dayEndISO(toDate) })}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <SummaryCard icon={<ReceiptIcon />} label="All receipts" value={summary.receipts} tint="bg-base-content/8 text-base-content/60" />
          <SummaryCard icon={<ReceiptIcon />} label="Sales" value={summary.sales} sub={formatPeso(summary.totalSales)} tint="bg-success/12 text-success" />
          <SummaryCard icon={<RefundIcon />} label="Refunds" value={summary.refunds} tint="bg-error/12 text-error" />
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-4 py-3 text-sm text-error mb-5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Search */}
        <div className="mb-4 max-w-xs">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Receipt no., store, employee…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-base-content/12 bg-base-100 pl-9 pr-3.5 py-2 text-sm text-base-content placeholder:text-base-content/30 outline-none focus:border-primary/60 transition-colors duration-150"
            />
          </div>
        </div>

        <div className="rounded-xl border border-base-content/8 bg-base-100 overflow-hidden">
          {/* Mobile */}
          <div className="sm:hidden divide-y divide-base-content/6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2"><div className="h-3.5 w-2/5 rounded bg-base-content/8 animate-pulse" /><div className="h-3 w-3/5 rounded bg-base-content/8 animate-pulse" /></div>
              ))
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center"><p className="text-sm text-base-content/40">No receipts for this filter.</p></div>
            ) : (
              paginated.map((r, index) => (
                <button
                  key={r.receiptNumber}
                  type="button"
                  onClick={() => setSelected(r)}
                  className="w-full text-left px-4 py-3.5 animate-row hover:bg-base-content/3 transition-colors"
                  style={{ animationDelay: `${index * 15}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-base-content tabular">{r.receiptNumber}</p>
                      <p className="text-xs text-base-content/45 mt-0.5">{formatReceiptDate(r.date)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold tabular ${r.type === 'REFUND' ? 'text-error' : 'text-base-content'}`}>{formatPeso(r.total)}</p>
                      <p className="text-[11px] text-base-content/40">{r.type === 'REFUND' ? 'Refund' : 'Sale'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-base-content/50 mt-1.5">{r.storeName} · {r.employeeName}</p>
                </button>
              ))
            )}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-content/8 bg-base-content/3">
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Receipt no.</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Store</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Employee</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Customer</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-base-content/45 tracking-wide">Type</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-base-content/45 tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-sm text-base-content/40">No receipts for this filter.</td></tr>
                ) : (
                  paginated.map((r, index) => (
                    <tr
                      key={r.receiptNumber}
                      onClick={() => setSelected(r)}
                      className="border-b border-base-content/6 hover:bg-base-content/3 transition-colors duration-100 animate-row cursor-pointer"
                      style={{ animationDelay: `${index * 15}ms` }}
                    >
                      <td className="py-3.5 px-4 font-medium text-base-content tabular">{r.receiptNumber}</td>
                      <td className="py-3.5 px-4 text-base-content/60 whitespace-nowrap">{formatReceiptDate(r.date)}</td>
                      <td className="py-3.5 px-4 text-base-content/60">{r.storeName}</td>
                      <td className="py-3.5 px-4 text-base-content/60">{r.employeeName}</td>
                      <td className="py-3.5 px-4 text-base-content/40">{r.customerName || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.type === 'REFUND' ? 'bg-error/10 text-error' : 'bg-base-content/8 text-base-content/55'}`}>
                          {r.type === 'REFUND' ? 'Refund' : 'Sale'}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 text-right font-medium tabular whitespace-nowrap ${r.type === 'REFUND' ? 'text-error' : 'text-base-content'}`}>{formatPeso(r.total)}</td>
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
                <button type="button" className="btn btn-xs btn-ghost text-base-content/50 hover:text-base-content" disabled={safePage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>← Prev</button>
                <span className="text-xs text-base-content/60 tabular px-1">{safePage} / {totalPages}</span>
                <button type="button" className="btn btn-xs btn-ghost text-base-content/50 hover:text-base-content" disabled={safePage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && <ReceiptDrawer receipt={selected} onClose={() => setSelected(null)} />}
    </main>
  )
}
