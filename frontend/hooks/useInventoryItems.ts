/**
 * useInventoryItems Hook
 * Fetches inventory items for a branch
 */

'use client'

import { useEffect, useState, useCallback } from 'react'

export interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  unit: string
  reorderLevel: number
  price: number
  supplier: string
  lastRestockDate: string
  expiryDate: string
  status: 'ok' | 'low' | 'critical'
}

export interface InventoryItemsResponse {
  success: boolean
  data: InventoryItem[]
  meta: {
    total: number
    lowStockCount: number
    criticalCount: number
  }
}

interface UseInventoryItemsReturn {
  data: InventoryItem[] | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useInventoryItems(branchId: string | null, lowStockOnly: boolean = false): UseInventoryItemsReturn {
  const [data, setData] = useState<InventoryItem[] | null>(null)
  const [loading, setLoading] = useState(!branchId)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    if (!branchId) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/inventory/items?branchId=${branchId}&lowStock=${lowStockOnly}`)
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`)
      
      const response = (await res.json()) as InventoryItemsResponse
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch inventory items'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [branchId, lowStockOnly])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
