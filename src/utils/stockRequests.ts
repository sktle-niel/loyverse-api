import type { StockChangeRequest } from '../api/types'

/**
 * Units the operator asked to add — the number to show in a "Qty" column.
 *
 * Prefers the backend's `changeAmount`. Falls back to deriving it for responses from a backend
 * that predates that field: approval rewrites `newStock` to the absolute stock level, so for
 * approved rows the requested amount is `newStock - oldStock`; every other status still carries
 * the raw amount in `newStock`.
 */
export function requestedQty(req: StockChangeRequest): number {
  if (typeof req.changeAmount === 'number') return req.changeAmount
  if (req.status === 'approved') return Math.round(req.newStock - (req.oldStock ?? 0))
  return req.newStock
}
