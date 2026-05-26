import { useMemo, useState } from 'react'
import type { AuditRecord } from '../components/AuditTable'

interface UseAuditFiltersReturn {
  filteredRecords: AuditRecord[]
  searchTerm: string
  branchId: string
  direction: 'all' | 'decrease' | 'increase'
  branches: { id: string; name: string }[]
  onSearchChange: (search: string) => void
  onBranchChange: (branchId: string) => void
  onDirectionChange: (direction: 'all' | 'decrease' | 'increase') => void
  onClearFilters: () => void
}

export function useAuditFilters(records: AuditRecord[]): UseAuditFiltersReturn {
  const safeRecords = records ?? []

  const [searchTerm, setSearchTerm] = useState('')
  const [branchId, setBranchId] = useState('')
  const [direction, setDirection] = useState<'all' | 'decrease' | 'increase'>('all')

  const branches = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of safeRecords) {
      if (r.branchId && !map.has(r.branchId)) {
        map.set(r.branchId, r.branchId)
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [safeRecords])

  const filteredRecords = safeRecords.filter((record) => {
    const searchMatch =
      !searchTerm ||
      record.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.adminName.toLowerCase().includes(searchTerm.toLowerCase())

    const branchMatch = !branchId || record.branchId === branchId

    const directionMatch =
      direction === 'all'
        ? true
        : direction === 'decrease'
          ? record.changeAmount < 0
          : record.changeAmount > 0

    return searchMatch && branchMatch && directionMatch
  })

  const handleClearFilters = () => {
    setSearchTerm('')
    setBranchId('')
    setDirection('all')
  }

  return {
    filteredRecords,
    searchTerm,
    branchId,
    direction,
    branches,
    onSearchChange: setSearchTerm,
    onBranchChange: setBranchId,
    onDirectionChange: setDirection,
    onClearFilters: handleClearFilters,
  }
}

