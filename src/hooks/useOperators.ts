import { useCallback, useEffect, useState } from 'react'
import { apiFetchJson } from '../api/client'
import type { PublicUser } from '../api/types'

export function useOperators() {
  const [operators, setOperators] = useState<PublicUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOperators = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiFetchJson<{ operators: PublicUser[] }>('/users/operators')
      setOperators(data.operators)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load operators')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchOperators()
  }, [fetchOperators])

  return { operators, isLoading, error, refetch: fetchOperators }
}
