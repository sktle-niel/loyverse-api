import { useCallback, useEffect, useState } from 'react'
import { apiFetchJson, apiPostJson } from '../api/client'
import type {
  CategoriesResponse,
  Category,
  CreateItemBody,
  CreateItemResponse,
  NextSkuResponse,
} from '../api/types'

export function useCreateItem() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [nextSku, setNextSku] = useState('')
  const [nextSkuLoading, setNextSkuLoading] = useState(true)

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

  // Loyverse-style: preview the SKU that will be auto-assigned so it shows in the field immediately.
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const res = await apiFetchJson<NextSkuResponse>('/items/next-sku')
        if (active) setNextSku(res.sku ?? '')
      } catch {
        if (active) setNextSku('')
      } finally {
        if (active) setNextSkuLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const createItem = useCallback(async (body: CreateItemBody): Promise<CreateItemResponse> => {
    return apiPostJson<CreateItemResponse>('/items', body, { timeoutMs: 30_000 })
  }, [])

  return { categories, categoriesLoading, nextSku, nextSkuLoading, createItem }
}
