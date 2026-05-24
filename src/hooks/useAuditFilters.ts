import { useState } from 'react'
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

const BRANCHES: { id: string; name: string }[] = [
  { id: 'branch-001', name: 'Main Branch' },
  { id: 'branch-002', name: 'North Branch' },
  { id: 'branch-003', name: 'South Branch' },
]

export function useAuditFilters(records: AuditRecord[]): UseAuditFiltersReturn {
  const safeRecords = records ?? []

  const [searchTerm, setSearchTerm] = useState('')
  const [branchId, setBranchId] = useState('')
  const [direction, setDirection] = useState<'all' | 'decrease' | 'increase'>('all')

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
    branches: BRANCHES,
    onSearchChange: setSearchTerm,
    onBranchChange: setBranchId,
    onDirectionChange: setDirection,
    onClearFilters: handleClearFilters,
  }
}

