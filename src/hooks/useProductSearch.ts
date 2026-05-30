import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type { Product, ProductsResponse } from '../api/types'

const DEBOUNCE_MS = 300

export function useProductSearch(query: string, allProducts: Product[]) {
  const [results, setResults] = useState<Product[]>(allProducts)
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestQueryRef = useRef('')

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim()
      latestQueryRef.current = trimmed

      if (!trimmed) {
        setResults(allProducts)
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const res = await apiFetchJson<ProductsResponse>(
          `/products?q=${encodeURIComponent(trimmed)}`,
          { timeoutMs: 30_000 },
        )
        if (latestQueryRef.current === trimmed) {
          setResults(res.products)
        }
      } catch {
        if (latestQueryRef.current === trimmed) {
          setResults([])
        }
      } finally {
        if (latestQueryRef.current === trimmed) {
          setIsSearching(false)
        }
      }
    },
    [allProducts],
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void runSearch(query), DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, runSearch])

  // Sync back when catalog reloads and no search is active
  useEffect(() => {
    if (!query.trim()) {
      setResults(allProducts)
    }
  }, [allProducts, query])

  return { results, isSearching }
}
