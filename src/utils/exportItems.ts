import type { ExportItemsResponse } from '../api/types'

/** Escapes a single CSV cell — quotes it when it contains a comma, quote, or newline. */
function cell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Builds a CSV string for the in-stock items export.
 * Columns: Handle, SKU, Name, Category, Cost, then In stock [Store] for every branch.
 * Uses CRLF line endings so it opens cleanly in Excel.
 */
export function buildItemsCsv(data: ExportItemsResponse): string {
  const headers = [
    'Handle',
    'SKU',
    'Name',
    'Category',
    'Cost',
    ...data.stores.map((s) => `In stock [${s.name}]`),
  ]

  const lines = [headers.map(cell).join(',')]

  for (const item of data.items) {
    const stockByStore = new Map(item.stocks.map((s) => [s.storeId, s.inStock]))
    const row = [
      item.handle,
      item.sku,
      item.name,
      item.category,
      item.cost === null || item.cost === undefined ? '' : item.cost.toFixed(2),
      ...data.stores.map((s) => String(stockByStore.get(s.id) ?? 0)),
    ]
    lines.push(row.map(cell).join(','))
  }

  return lines.join('\r\n')
}

/** Triggers a browser download of CSV text, with a UTF-8 BOM so Excel reads the encoding. */
export function downloadCsv(filename: string, csv: string): void {
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]) // UTF-8 BOM
  const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
