'use client'

/**
 * useRestaurantStatus Hook
 * Manages restaurant operational status state and updates
 * 
 * Features:
 * - Load status from API
 * - Update status with optimistic UI
 * - Rollback on failure
 * - Loading and error states
 * - Auto-refresh capability
 */

import { useState, useCallback, useEffect } from 'react'
import { getOperationalStatus, updateOperationalStatus } from '@/lib/api/dashboard'
import type { RestaurantOperationalStatus, OperationalStatus } from '@/types/dashboard'

export interface UseRestaurantStatusOptions {
  branchId: string
  restaurantId: string
  autoRefresh?: boolean
  refreshInterval?: number // milliseconds
}

export interface UseRestaurantStatusReturn {
  status: RestaurantOperationalStatus | null
  isLoading: boolean
  isSaving: boolean
  error: Error | null
  updateStatus: (newStatus: OperationalStatus) => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Hook to manage restaurant operational status
 * Provides loading, error handling, and optimistic updates
 */
export function useRestaurantStatus(options: UseRestaurantStatusOptions): UseRestaurantStatusReturn {
  const { branchId, restaurantId, autoRefresh = false, refreshInterval = 60000 } = options

  const [status, setStatus] = useState<RestaurantOperationalStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch current status from API
   */
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getOperationalStatus(branchId, restaurantId)
      setStatus(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch status')
      setError(error)
      console.error('Error fetching restaurant status:', error)
    } finally {
      setIsLoading(false)
    }
  }, [branchId, restaurantId])

  /**
   * Update status with optimistic UI
   * Shows new status immediately, reverts on error
   * Throws errors with proper status codes for permission handling
   */
  const updateStatus = useCallback(
    async (newStatus: OperationalStatus, overrideDurationMinutes?: number) => {
      if (!status) {
        setError(new Error('Status not yet loaded'))
        return
      }

      // Store previous state for rollback
      const previousStatus = status

      try {
        // Optimistic update
        setIsSaving(true)
        setError(null)
        
        let overrideExpiresAt: string | undefined
        if (overrideDurationMinutes && overrideDurationMinutes > 0) {
          const expiryDate = new Date()
          expiryDate.setMinutes(expiryDate.getMinutes() + overrideDurationMinutes)
          overrideExpiresAt = expiryDate.toISOString()
        }

        setStatus((prev) =>
          prev
            ? {
                ...prev,
                operationalStatus: newStatus,
                isOpen: newStatus === 'OPEN' || newStatus === 'RUSH_HOUR',
                hasManualOverride: !!overrideDurationMinutes,
                overrideExpiresAt,
              }
            : null
        )

        // Call API with optional override duration
        const updatedStatus = await updateOperationalStatus(
          branchId,
          restaurantId,
          newStatus,
          overrideDurationMinutes
        )

        // Update with server response
        setStatus(updatedStatus)
      } catch (err: any) {
        // Rollback on error
        setStatus(previousStatus)
        
        // Create error object with status code
        const error: any = err instanceof Error ? err : new Error('Failed to update status')
        if (err?.status) {
          error.status = err.status
        }
        
        setError(error)
        console.error('Error updating restaurant status:', error)
        throw error
      } finally {
        setIsSaving(false)
      }
    },
    [status, branchId, restaurantId]
  )

  /**
   * Load status on mount
   */
  useEffect(() => {
    refresh()
  }, [refresh])

  /**
   * Auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh) {
      return
    }

    const interval = setInterval(() => {
      refresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refresh])

  return {
    status,
    isLoading,
    isSaving,
    error,
    updateStatus,
    refresh,
  }
}
