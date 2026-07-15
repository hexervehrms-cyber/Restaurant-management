/**
 * useDashboardHeader Hook
 * Fetches and manages dashboard header information
 * Returns: user name, greeting, restaurant/branch info, and business status
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getDashboardHeader } from '@/lib/api/dashboard'
import type { DashboardHeader } from '@/types/dashboard'

interface UseDashboardHeaderReturn {
  data: DashboardHeader | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboardHeader(branchId: string | null): UseDashboardHeaderReturn {
  const [data, setData] = useState<DashboardHeader | null>(null)
  const [loading, setLoading] = useState(!branchId)
  const [error, setError] = useState<string | null>(null)
  const hasInitializedRef = useRef(false)

  const refetch = useCallback(async () => {
    if (!branchId) {
      setData(null)
      setError('Branch ID is required')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const headerData = await getDashboardHeader(branchId)
      setData(headerData)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard header')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [branchId])

  // FIX: Only fetch once on mount per branchId
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Skip if we've already initialized for this branchId
    if (hasInitializedRef.current) {
      return
    }
    
    hasInitializedRef.current = true
    refetch()
  }, [branchId])

  return { data, loading, error, refetch }
}
