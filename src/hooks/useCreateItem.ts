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

  const createItem = useCallback(async (body: CreateItemBody): Promise<CreateItemResponse> => {
    return apiPostJson<CreateItemResponse>('/items', body, { timeoutMs: 30_000 })
  }, [])

  return { categories, categoriesLoading, createItem }
}
