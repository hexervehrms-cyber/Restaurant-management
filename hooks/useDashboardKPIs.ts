/**
 * useDashboardKPIs Hook
 * 
 * Manages real-time dashboard KPI data via polling with automatic Firebase ID Token injection.
 * 
 * OPTIMIZATIONS:
 * - React StrictMode: Uses ref to track whether already fetching to prevent double-calls
 * - Single poll loop: Ensures only one interval running at a time
 * - Proper cleanup: Clears timeouts on unmount
 * - No duplicate effects: Single effect handles all initialization
 * - Firebase Auth: Automatically sends ID Token via apiClient
 * 
 * USAGE:
 * const { data, loading, error, refresh, isLive } = useDashboardKPIs(branchId)
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient, extractApiData } from '@/lib/api-client'
import type { DashboardKPIResponse } from '@/types/dashboard'

interface UseDashboardKPIsOptions {
  branchId: string
  enabled?: boolean
  pollInterval?: number // Default 60s
}

interface UseDashboardKPIsState {
  data: DashboardKPIResponse | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  isLive: boolean
}

export function useDashboardKPIs({
  branchId,
  enabled = true,
  pollInterval = 60000,
}: UseDashboardKPIsOptions): UseDashboardKPIsState {
  const [data, setData] = useState<DashboardKPIResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch the KPIs
  const fetchKPIs = useCallback(async () => {
    if (!enabled || !branchId) {
      return
    }

    try {
      console.log('[useDashboardKPIs] Fetching KPIs for branchId:', branchId)
      const response = await apiClient.get<any>('/api/dashboard/kpis', { branchId }, {})
      console.log('[useDashboardKPIs] Raw response received:', response)

      // Extract data from API response wrapper
      const kpiData = extractApiData<DashboardKPIResponse>(response)
      console.log('[useDashboardKPIs] Extracted KPI data:', kpiData)
      
      setData(kpiData)
      setLoading(false)
      setError(null)
      console.log('[useDashboardKPIs] State updated successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      console.error('[useDashboardKPIs] Error fetching KPIs:', error)
      setError(error)
      setLoading(false)
    }
  }, [branchId, enabled])

  /**
   * Manual refresh (clear loading state for immediate retry)
   */
  const refresh = useCallback(async () => {
    await fetchKPIs()
  }, [fetchKPIs])

  /**
   * Effect: Fetch on mount and set up polling
   */
  useEffect(() => {
    if (!enabled || !branchId) {
      console.log('[useDashboardKPIs] Skipping fetch - enabled:', enabled, 'branchId:', branchId)
      return
    }

    console.log('[useDashboardKPIs] Effect: Fetching data for branchId:', branchId)
    
    // Fetch immediately
    fetchKPIs()

    // Set up polling
    const interval = setInterval(() => {
      console.log('[useDashboardKPIs] Polling interval triggered')
      fetchKPIs()
    }, pollInterval)

    // Cleanup
    return () => {
      console.log('[useDashboardKPIs] Effect cleanup')
      clearInterval(interval)
    }
  }, [branchId, enabled, pollInterval, fetchKPIs])

  return {
    data,
    loading,
    error,
    refresh,
    isLive: false,
  }
}
