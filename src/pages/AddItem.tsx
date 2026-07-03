import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CreateItemBody } from '../api/types'
import { useCreateItem } from '../hooks/useCreateItem'
import { useStores } from '../hooks/useStores'
import { useToast } from '../context/ToastContext'
import { ROUTES } from '../constants/app'

const COLORS: { value: string; className: string }[] = [
  { value: 'GREY', className: 'bg-gray-400' },
  { value: 'RED', className: 'bg-red-500' },
  { value: 'PINK', className: 'bg-pink-500' },
  { value: 'ORANGE', className: 'bg-orange-500' },
  { value: 'YELLOW', className: 'bg-lime-400' },
  { value: 'GREEN', className: 'bg-green-500' },
  { value: 'BLUE', className: 'bg-blue-500' },
  { value: 'PURPLE', className: 'bg-purple-500' },
]

const SHAPES: { value: string; radius: string }[] = [
  { value: 'SQUARE', radius: 'rounded-md' },
  { value: 'CIRCLE', radius: 'rounded-full' },
  { value: 'SCALLOPED', radius: 'rounded-2xl' },
  { value: 'HEXAGON', radius: 'rounded-lg rotate-12' },
]

const PRICE_RE = /^\d+(\.\d{1,2})?$/

type StoreRow = { available: boolean; price: string }

/** An item create attempt shown in the "Recently added" panel. */
type RecentItem = {
  id: string
  name: string
  status: 'success' | 'failed'
  sku?: string
  error?: string
  at: number
}

const RECENT_KEY = 'twz.recentItems.v1'
const RECENT_MAX = 7 // keep only the 7 most recent; older ones drop off (FIFO)

/** Load persisted recently-added items (newest first). Missing/corrupt storage → empty. */
function readRecentItems(): RecentItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    return (arr as RecentItem[])
      .filter((r) => r && typeof r.name === 'string' && typeof r.at === 'number')
      .slice(0, RECENT_MAX)
  } catch {
    return []
  }
}

/** Persist the recently-added list, capped at the 7 most recent. */
function writeRecentItems(items: RecentItem[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, RECENT_MAX)))
  } catch {
    /* storage full/unavailable — non-fatal */
  }
}

export function AddItem() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { stores, isLoading: storesLoading, error: storesError, refetch: refetchStores } = useStores()
  const { categories, categoriesLoading, createItem } = useCreateItem()

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [soldByWeight, setSoldByWeight] = useState(false)
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [barcode, setBarcode] = useState('')
  const [trackStock, setTrackStock] = useState(false)
  const [allStores, setAllStores] = useState(true)
  const [storeRows, setStoreRows] = useState<Record<string, StoreRow>>({})
  const [color, setColor] = useState('GREY')
  const [shape, setShape] = useState('SQUARE')
  const [saving, setSaving] = useState(false)
  const [recentItems, setRecentItems] = useState<RecentItem[]>(() => readRecentItems())

  // Seed store rows once stores load (available by default, like Loyverse).
  useEffect(() => {
    if (stores.length === 0) return
    setStoreRows((prev) => {
      const next = { ...prev }
      for (const s of stores) if (!next[s.id]) next[s.id] = { available: true, price: '' }
      return next
    })
  }, [stores])

  // Persist successful adds so the "Recently added" list survives navigation/reloads.
  // Failed attempts stay session-only — they're transient errors already surfaced by a toast.
  useEffect(() => {
    writeRecentItems(recentItems.filter((r) => r.status === 'success'))
  }, [recentItems])

  const allChecked = useMemo(
    () => stores.length > 0 && stores.every((s) => storeRows[s.id]?.available),
    [stores, storeRows],
  )

  const toggleAllStores = (checked: boolean) => {
    setAllStores(checked)
    setStoreRows((prev) => {
      const next = { ...prev }
      for (const s of stores) next[s.id] = { ...(next[s.id] ?? { price: '' }), available: checked }
      return next
    })
  }

  const setStoreField = (storeId: string, field: keyof StoreRow, value: boolean | string) => {
    setStoreRows((prev) => ({
      ...prev,
      [storeId]: { ...(prev[storeId] ?? { available: true, price: '' }), [field]: value },
    }))
  }

  const pushRecent = (entry: Omit<RecentItem, 'id' | 'at'>) => {
    setRecentItems((prev) =>
      [
        { ...entry, id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, at: Date.now() },
        ...prev,
      ].slice(0, RECENT_MAX),
    )
  }

  // Clear the form back to its initial state so the operator can immediately add another item
  // without leaving the page.
  const resetForm = () => {
    setName('')
    setCategoryId('')
    setDescription('')
    setSoldByWeight(false)
    setPrice('')
    setCost('')
    setBarcode('')
    setTrackStock(false)
    setAllStores(true)
    setStoreRows(() => {
      const next: Record<string, StoreRow> = {}
      for (const s of stores) next[s.id] = { available: true, price: '' }
      return next
    })
    setColor('GREY')
    setShape('SQUARE')
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast({ message: 'Item name is required.', durationMs: 4000, variant: 'error' })
      return
    }
    // Validate numeric fields
    const numericFields: [string, string][] = [['Cost', cost], ['Price', price]]
    for (const [label, v] of numericFields) {
      if (v.trim() && !PRICE_RE.test(v.trim())) {
        showToast({ message: `${label} must be a valid amount (e.g. 160 or 160.50).`, durationMs: 4000, variant: 'error' })
        return
      }
    }
    for (const s of stores) {
      const p = storeRows[s.id]?.price ?? ''
      if (p.trim() && !PRICE_RE.test(p.trim())) {
        showToast({ message: `Price for ${s.name} must be a valid amount.`, durationMs: 4000, variant: 'error' })
        return
      }
    }

    const itemName = name.trim()
    const body: CreateItemBody = {
      name: itemName,
      categoryId: categoryId || null,
      description: description.trim() || undefined,
      soldByWeight,
      trackStock,
      cost: cost.trim() ? Number(cost) : 0,
      // SKU is intentionally omitted — Loyverse assigns it on create and returns it in the response.
      barcode: barcode.trim() || undefined,
      defaultPrice: price.trim() ? Number(price) : null,
      color,
      form: shape,
      stores: stores.map((s) => ({
        storeId: s.id,
        available: storeRows[s.id]?.available ?? true,
        price: storeRows[s.id]?.price?.trim() ? Number(storeRows[s.id].price) : null,
      })),
    }

    setSaving(true)
    try {
      const res = await createItem(body)
      pushRecent({ name: res.itemName || itemName, status: 'success', sku: res.sku })
      showToast({
        message: res.sku
          ? `"${res.itemName}" created in Loyverse · SKU ${res.sku}`
          : `"${res.itemName}" created in Loyverse.`,
        durationMs: 6000,
      })
      // Stay on the Add item page and clear the form so the operator can add another right away.
      resetForm()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Create failed'
      pushRecent({ name: itemName, status: 'failed', error: msg })
      showToast({ message: `Failed to create item. ${msg}`, durationMs: 7000, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-base-content/12 bg-base-100 px-3.5 py-2 text-sm text-base-content placeholder:text-base-content/30 outline-none focus:border-primary/60 transition-colors duration-150'
  const labelClass = 'block text-xs font-medium text-base-content/45 mb-1.5'
  const cardClass = 'rounded-xl border border-base-content/8 bg-base-100 p-5 sm:p-6'

  const successCount = recentItems.filter((r) => r.status === 'success').length

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8 page-enter">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <p className="text-xs font-medium text-base-content/35 uppercase tracking-widest mb-1">Operator</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">Add item</h1>
          <p className="text-sm text-base-content/45 mt-1">Create a new product — saved directly to Loyverse.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_21rem] gap-5 items-start">
          {/* LEFT — form */}
          <div className="space-y-5">
            {/* Item details */}
            <section className={cardClass}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-1">
                  <label className={labelClass}>Name <span className="text-error">*</span></label>
                  <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" />
                </div>
                <div className="sm:col-span-1">
                  <label className={labelClass}>Category</label>
                  <select className={`${inputClass} appearance-none`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={categoriesLoading}>
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className={labelClass}>Description</label>
                <textarea className={`${inputClass} min-h-[72px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
              </div>

              <div className="mt-4">
                <label className={labelClass}>Sold by</label>
                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-base-content/80">
                    <input type="radio" className="radio radio-sm radio-primary" checked={!soldByWeight} onChange={() => setSoldByWeight(false)} />
                    Each
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-base-content/80">
                    <input type="radio" className="radio radio-sm radio-primary" checked={soldByWeight} onChange={() => setSoldByWeight(true)} />
                    Weight / Volume
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={labelClass}>Price</label>
                  <input className={inputClass} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Leave blank for price upon sale" />
                  <p className="text-[11px] text-base-content/35 mt-1">Default selling price. Per-store prices below override this.</p>
                </div>
                <div>
                  <label className={labelClass}>Cost</label>
                  <input className={inputClass} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              <div className="mt-4">
                <label className={labelClass}>Barcode</label>
                <input className={inputClass} value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Optional" />
                <p className="text-[11px] text-base-content/35 mt-1">SKU is auto-assigned by Loyverse on save and shown under “Recently added”.</p>
              </div>
            </section>

            {/* Inventory */}
            <section className={cardClass}>
              <h2 className="text-sm font-semibold text-base-content mb-4">Inventory</h2>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-sm text-base-content/80">Track stock</span>
                <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={trackStock} onChange={(e) => setTrackStock(e.target.checked)} />
              </label>
            </section>

            {/* Stores */}
            <section className={cardClass}>
              <h2 className="text-sm font-semibold text-base-content mb-4">Stores</h2>
              <label className="flex items-center gap-2.5 cursor-pointer mb-3">
                <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={allStores && allChecked} onChange={(e) => toggleAllStores(e.target.checked)} />
                <span className="text-sm text-base-content/80">Available for sale in all stores</span>
              </label>

              {storesLoading ? (
                <p className="text-xs text-base-content/40 flex items-center gap-1.5">
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  Loading stores…
                </p>
              ) : storesError || stores.length === 0 ? (
                <div className="rounded-lg border border-base-content/10 bg-base-content/3 px-4 py-4 text-center">
                  <p className="text-xs text-base-content/55">{storesError ? `Couldn't load stores. ${storesError}` : 'No stores found.'}</p>
                  <button
                    type="button"
                    onClick={() => void refetchStores()}
                    className="btn btn-xs btn-ghost mt-2 text-primary border border-primary/25 hover:bg-primary/10"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-base-content/8 divide-y divide-base-content/6 overflow-hidden">
                  <div className="grid grid-cols-[auto_1fr_8rem] items-center gap-3 px-3 py-2 bg-base-content/3 text-[11px] font-medium text-base-content/45 uppercase tracking-wide">
                    <span>Avail.</span><span>Store</span><span className="text-right">Price</span>
                  </div>
                  {stores.map((s) => {
                    const row = storeRows[s.id] ?? { available: true, price: '' }
                    return (
                      <div key={s.id} className="grid grid-cols-[auto_1fr_8rem] items-center gap-3 px-3 py-2.5">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm checkbox-primary"
                          checked={row.available}
                          onChange={(e) => setStoreField(s.id, 'available', e.target.checked)}
                        />
                        <span className="text-sm text-base-content/80 break-words">{s.name}</span>
                        <input
                          inputMode="decimal"
                          className="rounded-md border border-base-content/12 bg-base-100 px-2.5 py-1.5 text-sm text-right tabular outline-none focus:border-primary/60"
                          placeholder="—"
                          value={row.price}
                          onChange={(e) => setStoreField(s.id, 'price', e.target.value)}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Representation on POS */}
            <section className={cardClass}>
              <h2 className="text-sm font-semibold text-base-content mb-4">Representation on POS</h2>
              <label className={labelClass}>Color</label>
              <div className="flex flex-wrap gap-2 mb-5">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-9 h-9 rounded-lg ${c.className} flex items-center justify-center transition-transform ${color === c.value ? 'ring-2 ring-offset-2 ring-base-content/40 ring-offset-base-100 scale-105' : 'hover:scale-105'}`}
                    aria-label={c.value}
                  >
                    {color === c.value && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <label className={labelClass}>Shape</label>
              <div className="flex flex-wrap gap-2">
                {SHAPES.map((sh) => (
                  <button
                    key={sh.value}
                    type="button"
                    onClick={() => setShape(sh.value)}
                    className={`w-9 h-9 flex items-center justify-center border-2 transition-colors ${sh.radius} ${shape === sh.value ? 'border-primary text-primary' : 'border-base-content/20 text-base-content/30 hover:border-base-content/40'}`}
                    aria-label={sh.value}
                    title={sh.value}
                  >
                    {shape === sh.value && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={sh.value === 'HEXAGON' ? '-rotate-12' : ''}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pb-4">
              <button
                type="button"
                className="btn btn-ghost btn-sm text-base-content/60 hover:text-base-content border border-base-content/10"
                disabled={saving}
                onClick={() => navigate(ROUTES.INVENTORY)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm min-w-[7rem]"
                disabled={saving}
                onClick={() => void handleSubmit()}
              >
                {saving ? (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                  </svg>
                ) : 'Save item'}
              </button>
            </div>
          </div>

          {/* RIGHT — recently added */}
          <aside className="lg:sticky lg:top-8">
            <section className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-base-content">Recently added</h2>
                {recentItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRecentItems([])}
                    className="text-[11px] text-base-content/40 hover:text-base-content/70 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {successCount > 0 && (
                <p className="text-[11px] text-base-content/40 mb-3">
                  {successCount} item{successCount === 1 ? '' : 's'} added recently
                </p>
              )}

              {recentItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-base-content/12 px-4 py-10 text-center">
                  <p className="text-xs text-base-content/45">No items yet.</p>
                  <p className="text-[11px] text-base-content/35 mt-1">Items you add appear here with the SKU Loyverse assigned.</p>
                </div>
              ) : (
                <ul className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                  {recentItems.map((it) => (
                    <li
                      key={it.id}
                      className="rounded-lg border border-base-content/8 bg-base-100 px-3 py-2.5 flex items-start gap-2.5"
                    >
                      {it.status === 'success' ? (
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      ) : (
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-error/15 text-error flex items-center justify-center shrink-0">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-base-content/90 font-medium truncate">{it.name}</p>
                        {it.status === 'success' ? (
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            <span className="text-[11px] font-mono text-base-content/60">SKU {it.sku || '—'}</span>
                            <span className="text-[10px] font-medium uppercase tracking-wide text-success bg-success/10 px-1.5 py-0.5 rounded">
                              Success
                            </span>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-error bg-error/10 px-1.5 py-0.5 rounded">
                              Failed
                            </span>
                            {it.error && <p className="text-[11px] text-error/80 mt-1 break-words">{it.error}</p>}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
