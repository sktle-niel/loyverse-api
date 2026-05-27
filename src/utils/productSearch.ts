import type { Product } from '../api/types'

export function filterProducts(products: Product[], query: string): Product[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  if (terms.length === 0) return products

  return products.filter((p) => {
    const hay = `${p.name} ${p.sku}`.toLowerCase()
    return terms.every((term) => hay.includes(term))
  })
}
