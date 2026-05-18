import { useState } from 'react'
import type { AuditRecord } from '../components/AuditTable'

interface UseAuditFiltersReturn {
  filteredRecords: AuditRecord[]
  selectedAdmin: string
  selectedItem: string
  dateFrom: string
  dateTo: string
  admins: string[]
  items: string[]
  onAdminChange: (admin: string) => void
  onItemChange: (item: string) => void
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onClearFilters: () => void
}

export function useAuditFilters(
  records: AuditRecord[],
): UseAuditFiltersReturn {
  const [selectedAdmin, setSelectedAdmin] = useState('')
  const [selectedItem, setSelectedItem] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Extract unique admins and items from records
  const admins = Array.from(new Set(records.map((r) => r.adminName)))
  const items = Array.from(new Set(records.map((r) => r.itemName)))

  // Filter records based on selected filters
  const filteredRecords = records.filter((record) => {
    const adminMatch =
      !selectedAdmin || record.adminName === selectedAdmin
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

    return adminMatch && itemMatch && dateMatch
  })

  const handleClearFilters = () => {
    setSelectedAdmin('')
    setSelectedItem('')
    setDateFrom('')
    setDateTo('')
  }

  return {
    filteredRecords,
    selectedAdmin,
    selectedItem,
    dateFrom,
    dateTo,
    admins,
    items,
    onAdminChange: setSelectedAdmin,
    onItemChange: setSelectedItem,
    onDateFromChange: setDateFrom,
    onDateToChange: setDateTo,
    onClearFilters: handleClearFilters,
  }
}
