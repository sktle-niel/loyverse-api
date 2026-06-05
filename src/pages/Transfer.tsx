import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStockLevels } from '../hooks/useStockLevels'
import { useTransferRequests } from '../hooks/useTransferRequests'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import type { StockLevelProduct, StoreInfo } from '../api/types'

const ITEMS_PER_PAGE = 15
const LOCK_KEY = 'sktle_transfer_last_active'
const INACTIVITY_LOCK_MS = 30 * 60 * 1000

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

interface TransferModalProps {
  product: StockLevelProduct
  stores: StoreInfo[]
  onClose: () => void
  onSubmit: (fromStoreId: string, toStoreId: string, quantity: number) => Promise<void>
}

function TransferModal({ product, stores, onClose, onSubmit }: TransferModalProps) {
  const storesWithStock = product.stocks.filter((s) => s.stock > 0)
  const defaultFrom = storesWithStock.length > 0
    ? storesWithStock.reduce((a, b) => (a.stock >= b.stock ? a : b)).storeId
    : stores[0]?.id ?? ''

  const [fromStoreId, setFromStoreId] = useState(defaultFrom)
  const [toStoreId, setToStoreId] = useState(
    stores.find((s) => s.id !== defaultFrom)?.id ?? ''
  )
  const [quantityRaw, setQuantityRaw] = useState('1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fromStock = product.stocks.find((s) => s.storeId === fromStoreId)?.stock ?? 0
  const toStockCurrent = product.stocks.find((s) => s.storeId === toStoreId)?.stock ?? 0
  // effective quantity used for preview and submit — always a valid clamped number
  const quantity = Math.min(fromStock, Math.max(1, parseInt(quantityRaw, 10) || 1))

  const handleFromChange = (id: string) => {
    setFromStoreId(id)
    if (id === toStoreId) {
      const other = stores.find((s) => s.id !== id)
      if (other) setToStoreId(other.id)
    }
    setQuantityRaw('1')
    setError(null)
  }

  const handleSubmit = async () => {
    if (!fromStoreId || !toStoreId || fromStoreId === toStoreId) {
      setError('Please select different source and destination stores.')
      return
    }
    if (quantity <= 0 || quantity > fromStock) {
      setError(`Quantity must be between 1 and ${fromStock}.`)
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(fromStoreId, toStoreId, quantity)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit transfer request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-base-100 rounded-xl border border-base-content/10 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-base-content">Transfer stock</h2>
            <p className="text-sm text-base-content/50 mt-0.5 leading-snug">{product.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-base-content/35 hover:text-base-content transition-colors mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-3.5">
          {/* From store */}
          <div>
            <label className="block text-xs font-medium text-base-content/55 mb-1.5">From (source)</label>
            <select
              className="w-full rounded-lg border border-base-content/12 bg-base-100 px-3 py-2 text-sm text-base-content outline-none focus:border-primary/60 transition-colors"
              value={fromStoreId}
              onChange={(e) => handleFromChange(e.target.value)}
            >
              {stores.map((s) => {
                const stock = product.stocks.find((ps) => ps.storeId === s.id)?.stock ?? 0
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} — {stock} units
                  </option>
                )
              })}
            </select>
          </div>

          {/* To store */}
          <div>
            <label className="block text-xs font-medium text-base-content/55 mb-1.5">To (destination)</label>
            <select
              className="w-full rounded-lg border border-base-content/12 bg-base-100 px-3 py-2 text-sm text-base-content outline-none focus:border-primary/60 transition-colors"
              value={toStoreId}
              onChange={(e) => { setToStoreId(e.target.value); setError(null) }}
            >
              {stores
                .filter((s) => s.id !== fromStoreId)
                .map((s) => {
                  const stock = product.stocks.find((ps) => ps.storeId === s.id)?.stock ?? 0
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} — {stock} units
                    </option>
                  )
                })}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-base-content/55 mb-1.5">
              Quantity <span className="text-base-content/35">(max {fromStock})</span>
            </label>
            <input
              type="number"
              min={1}
              max={fromStock}
              value={quantityRaw}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') { setQuantityRaw(''); setError(null); return }
                const num = parseInt(raw, 10)
                if (!isNaN(num)) setQuantityRaw(String(Math.min(fromStock, Math.max(1, num))))
                setError(null)
              }}
              onBlur={() => { if (!quantityRaw) setQuantityRaw('1') }}
              className="w-full rounded-lg border border-base-content/12 bg-base-100 px-3 py-2 text-sm text-base-content outline-none focus:border-primary/60 transition-colors tabular"
            />
          </div>

          {/* Preview */}
          {fromStoreId && toStoreId && fromStoreId !== toStoreId && (
            <div className="rounded-lg bg-base-200/60 border border-base-content/8 px-3.5 py-2.5 text-xs space-y-1 text-base-content/60">
              <p className="font-medium text-base-content/80 mb-1.5">After transfer (if approved)</p>
              <div className="flex justify-between">
                <span>{stores.find(s => s.id === fromStoreId)?.name}</span>
                <span className="tabular font-medium">{fromStock} → <span className="text-error">{fromStock - quantity}</span></span>
              </div>
              <div className="flex justify-between">
                <span>{stores.find(s => s.id === toStoreId)?.name}</span>
                <span className="tabular font-medium">{toStockCurrent} → <span className="text-success">{toStockCurrent + quantity}</span></span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-error">{error}</p>
          )}
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            className="flex-1 btn btn-sm btn-ghost border border-base-content/10"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 btn btn-sm btn-primary"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || fromStock === 0 || fromStoreId === toStoreId}
          >
            {isSubmitting ? (
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
              </svg>
            ) : null}
            {isSubmitting ? 'Submitting…' : 'Request transfer'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function Transfer() {
  const { products, stores, source, cachedAt, isLoading, isResetting, isServerLoading, syncProgress, isPaused, error, pause, resume, reset } =
    useStockLevels()
  const { submitTransfer } = useTransferRequests()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [requiresReset, setRequiresReset] = useState(false)

  // Lock Transfer buttons after 30 min of inactivity (tab hidden or away).
  // localStorage tracks last-active so a close+reopen after 30 min also locks.
  useEffect(() => {
    const stored = localStorage.getItem(LOCK_KEY)
    if (stored && Date.now() - Number(stored) >= INACTIVITY_LOCK_MS) {
      setRequiresReset(true)
    }
    localStorage.setItem(LOCK_KEY, String(Date.now()))

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem(LOCK_KEY, String(Date.now()))
      } else {
        const s = localStorage.getItem(LOCK_KEY)
        if (s && Date.now() - Number(s) >= INACTIVITY_LOCK_MS) {
          setRequiresReset(true)
        } else {
          localStorage.setItem(LOCK_KEY, String(Date.now()))
        }
      }
    }

    // Keep localStorage fresh every 5 min while tab is visible
    const keepAlive = setInterval(() => {
      if (document.visibilityState === 'visible') {
        localStorage.setItem(LOCK_KEY, String(Date.now()))
      }
    }, 5 * 60 * 1000)

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearInterval(keepAlive)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const [transferTarget, setTransferTarget] = useState<StockLevelProduct | null>(null)

  const handleTransferSubmit = async (fromStoreId: string, toStoreId: string, quantity: number) => {
    if (!transferTarget) return
    await submitTransfer({
      itemId: transferTarget.id,
      fromStoreId,
      toStoreId,
      quantity,
      requestedBy: user?.displayName ?? 'Operator',
    })
    showToast({ message: 'Transfer done. Stock updated in Loyverse.', durationMs: 6000 })
  }

  function formatEta(seconds: number): string {
    if (seconds < 60) return `~${seconds}s remaining`
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return sec > 0 ? `~${min}m ${sec}s remaining` : `~${min}m remaining`
  }
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
              {source === 'loyverse' ? 'Live from Loyverse' : 'Mock data'} · items with stock &gt; 2 in any branch
            </p>
            {isLoading ? (
              <p className="text-xs text-primary/70 mt-1.5">Loading stock levels…</p>
            ) : isPaused ? (
              <p className="text-xs text-base-content/40 mt-1.5 flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                Sync paused — click Resume to continue
              </p>
            ) : isServerLoading && syncProgress != null ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-warning/80 flex items-center gap-1.5">
                    <svg className="animate-spin shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                    </svg>
                    Syncing from Loyverse…
                    <span className="font-semibold text-warning">
                      {syncProgress ? `${syncProgress.percent}%` : '0%'}
                    </span>
                  </p>
                  {syncProgress?.etaSeconds != null && (
                    <p className="text-xs text-base-content/35 shrink-0">
                      {formatEta(syncProgress.etaSeconds)}
                    </p>
                  )}
                </div>
                <div className="w-full max-w-xs h-1.5 rounded-full bg-base-content/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-warning transition-all duration-500"
                    style={{ width: `${syncProgress?.percent ?? 0}%` }}
                  />
                </div>
                {syncProgress && (
                  <p className="text-[10px] text-base-content/30">
                    {syncProgress.recordsFetched.toLocaleString()} / {syncProgress.totalExpected.toLocaleString()} records
                  </p>
                )}
              </div>
            ) : cachedAt ? (
              <p className="text-xs text-base-content/35 mt-1.5">
                Updated {new Date(cachedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Stop / Resume */}
            <button
              type="button"
              className={`btn btn-sm btn-ghost border shrink-0 ${isPaused ? 'text-success border-success/20 hover:bg-success/8' : 'text-base-content/50 border-base-content/10 hover:text-base-content hover:border-base-content/20'}`}
              disabled={isLoading || isResetting}
              onClick={() => isPaused ? resume() : pause()}
            >
              {isPaused ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Resume
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                  </svg>
                  {isServerLoading ? 'Stop' : 'Stop'}
                </>
              )}
            </button>

            {/* Reset — full re-fetch from scratch */}
            <button
              type="button"
              className="btn btn-sm btn-ghost text-base-content/50 hover:text-base-content border border-base-content/10 hover:border-base-content/20 shrink-0"
              disabled={isLoading || isResetting}
              onClick={() => {
                if (requiresReset) {
                  setRequiresReset(false)
                  localStorage.setItem(LOCK_KEY, String(Date.now()))
                }
                reset()
              }}
            >
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={isResetting ? 'animate-spin' : ''}
              >
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              {isResetting ? 'Resetting…' : requiresReset ? 'Reset to unlock' : 'Reset'}
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/8 px-4 py-3 text-sm text-error mb-5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {requiresReset && !isServerLoading && !isResetting && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/8 px-4 py-3 text-sm text-warning mb-5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="font-medium">Transfer buttons locked</p>
              <p className="text-xs text-warning/70 mt-0.5">You've been away for 30+ minutes. Click <strong>Reset to unlock</strong> to sync the latest stock data before transferring.</p>
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
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-base-content/12 bg-base-100 pl-9 pr-3.5 py-2 text-sm text-base-content placeholder:text-base-content/30 outline-none focus:border-primary/60 transition-colors duration-150"
              disabled={(isLoading || isServerLoading) && products.length === 0}
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

          {/* Mobile: table-row layout */}
          <div className="sm:hidden divide-y divide-base-content/6">
            {(isLoading || isServerLoading) && products.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => <MobileSkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-base-content/40">
                  {query ? 'No products match your search.' : 'No items with transferable stock (> 2 in any branch).'}
                </p>
              </div>
            ) : (
              paginated.map((p, index) => (
                <div
                  key={p.id}
                  className="px-4 py-3.5 animate-row"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  {/* Product header + transfer button */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-base-content leading-snug">{p.name}</p>
                      {p.sku && <p className="text-xs text-base-content/40 mt-0.5">{p.sku}</p>}
                    </div>
                    <button
                      type="button"
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
                      disabled={isServerLoading || requiresReset}
                      onClick={() => setTransferTarget(p)}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
                        <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
                      </svg>
                      Transfer
                    </button>
                  </div>
                  {/* Branch stock rows */}
                  <div className="space-y-1">
                    {p.stocks.map((s) => (
                      <div key={s.storeId} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-base-content/45 truncate">{s.storeName}</span>
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
                  <th className="py-3 px-4 w-px" />
                </tr>
              </thead>
              <tbody>
                {(isLoading || isServerLoading) && products.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={colCount} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="py-16 text-center text-sm text-base-content/40">
                      {query ? 'No products match your search.' : 'No items with transferable stock (> 2 in any branch).'}
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
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-base-content/45 hover:text-primary hover:bg-primary/8 border border-transparent hover:border-primary/20 transition-colors duration-150 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                          disabled={isServerLoading || requiresReset}
                          onClick={() => setTransferTarget(p)}
                          title="Request stock transfer"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
                            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
                          </svg>
                          Transfer
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

      {transferTarget && (
        <TransferModal
          product={transferTarget}
          stores={stores}
          onClose={() => setTransferTarget(null)}
          onSubmit={handleTransferSubmit}
        />
      )}
    </main>
  )
}
