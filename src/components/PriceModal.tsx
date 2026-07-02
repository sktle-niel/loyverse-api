import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ItemPrice, PriceHistoryEntry } from '../api/types'
import { useToast } from '../context/ToastContext'

export function formatPeso(n: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const ListIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

const PencilIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)

const Spinner = () => (
  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
  </svg>
)

/** Modal showing one item's per-store price, with inline editing + change history. */
export function PriceModal({
  item,
  onClose,
  onSave,
  onLoadHistory,
}: {
  item: ItemPrice
  onClose: () => void
  onSave: (storeId: string, storeName: string, price: number) => Promise<void>
  onLoadHistory: (itemId: string) => Promise<PriceHistoryEntry[]>
}) {
  const { showToast } = useToast()
  const [prices, setPrices] = useState(item.prices)
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [savingStoreId, setSavingStoreId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<PriceHistoryEntry[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    setPrices(item.prices)
    setEditingStoreId(null)
  }, [item])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  const startEdit = (storeId: string, current: number | null) => {
    setEditingStoreId(storeId)
    setDraft(current != null ? String(current) : '')
  }
  const cancelEdit = () => { setEditingStoreId(null); setDraft('') }

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      setHistory(await onLoadHistory(item.id))
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const toggleHistory = () => {
    const next = !showHistory
    setShowHistory(next)
    if (next && history === null) void loadHistory()
  }

  const saveEdit = async (storeId: string, storeName: string) => {
    const v = draft.trim()
    if (!/^\d+(\.\d{1,2})?$/.test(v)) {
      showToast({ message: 'Enter a valid price (e.g. 160 or 160.50).', durationMs: 4000, variant: 'error' })
      return
    }
    const price = Number(v)
    setSavingStoreId(storeId)
    try {
      await onSave(storeId, storeName, price)
      setPrices((prev) => prev.map((p) => (p.storeId === storeId ? { ...p, price } : p)))
      setEditingStoreId(null)
      showToast({ message: `${storeName}: ${formatPeso(price)} saved to Loyverse.`, durationMs: 6000 })
      if (showHistory) void loadHistory()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Update failed'
      showToast({ message: `Failed to update price. ${msg}`, durationMs: 7000, variant: 'error' })
    } finally {
      setSavingStoreId(null)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-base-content/10 bg-base-100 shadow-2xl max-h-[85vh] flex flex-col animate-row">
        {/* Header */}
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

        {/* Per-store prices (editable) */}
        <div className="overflow-y-auto px-5 py-2">
          <div className="divide-y divide-base-content/6">
            {prices.map((p) => {
              const isEditing = editingStoreId === p.storeId
              const isSaving = savingStoreId === p.storeId
              return (
                <div key={p.storeId} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm text-base-content/70 break-words pr-2 min-w-0">{p.storeName}</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm text-base-content/45">₱</span>
                      <input
                        autoFocus
                        inputMode="decimal"
                        value={draft}
                        disabled={isSaving}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void saveEdit(p.storeId, p.storeName)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        className="input input-xs input-bordered bg-base-100 w-24 text-right tabular"
                        placeholder="0.00"
                      />
                      <button
                        type="button"
                        onClick={() => void saveEdit(p.storeId, p.storeName)}
                        disabled={isSaving}
                        className="btn btn-xs btn-primary px-2"
                        aria-label="Save price"
                      >
                        {isSaving ? <Spinner /> : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isSaving}
                        className="btn btn-xs btn-ghost px-2 text-base-content/50"
                        aria-label="Cancel"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-medium text-base-content tabular">{formatPeso(p.price)}</span>
                      <button
                        type="button"
                        onClick={() => startEdit(p.storeId, p.price)}
                        className="btn btn-xs btn-ghost px-1.5 text-base-content/40 hover:text-primary"
                        aria-label={`Edit ${p.storeName} price`}
                        title="Edit price"
                      >
                        <PencilIcon />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* History */}
        <div className="border-t border-base-content/8 px-5 py-3">
          <button
            type="button"
            onClick={toggleHistory}
            className="flex items-center gap-1.5 text-xs font-medium text-base-content/50 hover:text-base-content transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${showHistory ? 'rotate-90' : ''}`}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Price change history
          </button>

          {showHistory && (
            <div className="mt-2.5">
              {historyLoading ? (
                <p className="text-xs text-base-content/40 flex items-center gap-1.5"><Spinner /> Loading history…</p>
              ) : !history || history.length === 0 ? (
                <p className="text-xs text-base-content/35">No price changes recorded yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {history.map((h) => (
                    <div key={h.id} className="text-xs text-base-content/55 flex items-center justify-between gap-2">
                      <span className="truncate">
                        <span className="text-base-content/75">{h.storeName}</span>{' '}
                        {formatPeso(h.oldPrice)} → <span className="text-base-content">{formatPeso(h.newPrice)}</span>
                      </span>
                      <span className="text-base-content/30 shrink-0 whitespace-nowrap">
                        {h.changedBy} · {new Date(h.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
