import { useState } from 'react'
import type { AuditRecord } from '../components/AuditTable'

interface UseAuditFiltersReturn {
  filteredRecords: AuditRecord[]
  searchTerm: string
  selectedItem: string
  dateFrom: string
  dateTo: string
  items: string[]
  onSearchChange: (search: string) => void
  onItemChange: (item: string) => void
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onClearFilters: () => void
}

export function useAuditFilters(
  records: AuditRecord[],
): UseAuditFiltersReturn {
  const safeRecords = records ?? []

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Extract unique items from records
  const items = Array.from(new Set(safeRecords.map((r) => r.itemName)))

  // Filter records based on selected filters
  const filteredRecords = safeRecords.filter((record) => {

    const searchMatch =
      !searchTerm ||
      record.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.adminName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const itemMatch =
      !selectedItem || record.itemName === selectedItem

    let dateMatch = true
    if (dateFrom) {
      const recordDate = new Date(record.timestamp).toDateString()
      const fromDate = new Date(dateFrom).toDateString()
      dateMatch = dateMatch && recordDate >= fromDate
    }

    if (dateTo) {
      const recordDate = new Date(record.timestamp).toDateString()
      const toDate = new Date(dateTo).toDateString()
      dateMatch = dateMatch && recordDate <= toDate
    }

    return searchMatch && itemMatch && dateMatch
  })

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedItem('')
    setDateFrom('')
    setDateTo('')
  }

  return {
    filteredRecords,
    searchTerm,
    selectedItem,
    dateFrom,
    dateTo,
    items,
    onSearchChange: setSearchTerm,
    onItemChange: setSelectedItem,
    onDateFromChange: setDateFrom,
    onDateToChange: setDateTo,
    onClearFilters: handleClearFilters,
  }
}
