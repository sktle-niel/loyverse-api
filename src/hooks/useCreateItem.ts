import { useCallback, useEffect, useState } from 'react'
import { apiFetchJson, apiPostJson } from '../api/client'
import type {
  CategoriesResponse,
  Category,
  CreateItemBody,
  CreateItemResponse,
} from '../api/types'

export function useCreateItem() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const res = await apiFetchJson<CategoriesResponse>('/categories')
        if (active) setCategories(res.categories)
      } catch {
        if (active) setCategories([])
      } finally {
        if (active) setCategoriesLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  // SKU is no longer entered or previewed in the form — Loyverse assigns it on create and echoes
  // it back in the response (shown in the "Recently added" panel).
  // 60s: the create AND the optional initial-stock write each carry a full Loyverse retry budget
  // (~27s worst case); a 30s abort here could report an already-created item as failed and
  // invite a duplicate retry.
  const createItem = useCallback(async (body: CreateItemBody): Promise<CreateItemResponse> => {
    return apiPostJson<CreateItemResponse>('/items', body, { timeoutMs: 60_000 })
  }, [])

  return { categories, categoriesLoading, createItem }
}
