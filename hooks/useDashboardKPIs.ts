/**
 * useDashboardKPIs Hook
 * 
 * Manages real-time dashboard KPI data via polling.
 * 
 * OPTIMIZATIONS:
 * - React StrictMode: Uses ref to track whether already fetching to prevent double-calls
 * - Single poll loop: Ensures only one interval running at a time
 * - Proper cleanup: Clears timeouts on unmount
 * - No duplicate effects: Single effect handles all initialization
 * 
 * USAGE:
 * const { data, loading, error, refresh, isLive } = useDashboardKPIs(branchId)
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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

  // Refs to prevent duplicate calls in React StrictMode
  const isMountedRef = useRef(true)
  const isFetchingRef = useRef(false)
  const pollTimeoutRef = useRef<NodeJS.Timeout>()
  const loadingTimeoutRef = useRef<NodeJS.Timeout>()

  const fetchKPIs = useCallback(async () => {
    // Skip if already fetching (prevents duplicate requests in StrictMode)
    if (isFetchingRef.current || !isMountedRef.current) {
      console.log('[useDashboardKPIs.fetchKPIs] Skipping: already fetching or unmounted')
      return
    }

    isFetchingRef.current = true

    try {
      const url = `/api/dashboard/kpis?branchId=${encodeURIComponent(branchId)}`
      console.log('[useDashboardKPIs] Fetching KPIs from:', url)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const result = await response.json()

      // Only update if mounted
      if (isMountedRef.current) {
        console.log('[useDashboardKPIs] Raw API response:', result)
        console.log('[useDashboardKPIs] result.data:', result?.data)
        console.log('[useDashboardKPIs] Extracting data...')
        // Extract data from API response wrapper (successResponse format)
        const kpiData = result?.data || result
        console.log('[useDashboardKPIs] Extracted kpiData:', kpiData)
        console.log('[useDashboardKPIs] Setting state with:', { 
          hasData: !!kpiData,
          revenue: kpiData?.revenue?.current,
          orders: kpiData?.orders?.count,
        })
        // Clear loading timeout since data arrived
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current)
        }
        setData(kpiData)
        setLoading(false)
        setError(null)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      if (isMountedRef.current) {
        console.error('[useDashboardKPIs] Error fetching KPIs:', error.message)
        setError(error)
        setLoading(false)
      }
    } finally {
      isFetchingRef.current = false
    }
  }, [branchId])

  /**
   * Manual refresh (clear loading state for immediate retry)
   */
  const refresh = useCallback(async () => {
    console.log('[useDashboardKPIs] Manual refresh requested')
    isFetchingRef.current = false
    await fetchKPIs()
  }, [fetchKPIs])

  /**
   * Effect: Fetch on mount and set up polling
   * - Only runs once when enabled/branchId/pollInterval change
   * - Does NOT include fetchKPIs in dependencies to avoid infinite loop
   * - Recreates polling when these specific values change
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!enabled) {
      console.log('[useDashboardKPIs] Disabled, skipping')
      return
    }

    console.log('[useDashboardKPIs] Setting up polling for branchId:', branchId)

    // Set a timeout to fail the loading if it takes too long
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && loading && !data) {
        console.error('[useDashboardKPIs] Loading timeout after 8 seconds, forcing error state')
        setLoading(false)
        setError(new Error('Failed to load KPI data. Please refresh the page.'))
      }
    }, 8000)

    // Start polling loop
    const startPolling = async () => {
      console.log('[useDashboardKPIs.startPolling] Fetching immediately...')
      await fetchKPIs()

      if (isMountedRef.current) {
        console.log('[useDashboardKPIs.startPolling] Scheduling next poll in', pollInterval, 'ms')
        pollTimeoutRef.current = setTimeout(startPolling, pollInterval)
      }
    }

    startPolling()

    return () => {
      console.log('[useDashboardKPIs] Cleanup: clearing timeout')
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [enabled, branchId, pollInterval]) // ✅ FIXED: Removed fetchKPIs from deps
  // Note: fetchKPIs depends on branchId, so including it directly prevents infinite loops
  // in React.StrictMode

  /**
   * Effect: Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      console.log('[useDashboardKPIs] Unmounting: marking not mounted')
      isMountedRef.current = false
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    refresh,
    isLive: false, // Not using SSE yet
  }
}
