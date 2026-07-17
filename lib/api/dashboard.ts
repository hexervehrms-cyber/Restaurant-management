/**
 * Dashboard API Service
 * All API calls related to dashboard
 */

import { apiGet, apiPatch } from '@/lib/api/client'
import type {
  RevenueChartData,
  RestaurantStatus,
  DashboardHeader,
  RestaurantOperationalStatus,
} from '@/types/dashboard'
import type { SuccessResponse } from '@/types/api'

/**
 * Get dashboard header information
 * Includes user name, greeting, restaurant/branch names, and business status
 */
export async function getDashboardHeader(
  branchId: string
): Promise<DashboardHeader> {
  const response = await apiGet<DashboardHeader>(
    `/api/dashboard/header?branchId=${branchId}`
  )

  return response
}

/**
 * Get revenue chart data
 */
export async function getRevenueChart(
  branchId: string,
  range: 'today' | 'week' = 'today'
): Promise<RevenueChartData> {
  const response = await apiGet<RevenueChartData>(
    `/api/dashboard/revenue-chart?branchId=${branchId}&range=${range}`
  )

  return response
}

/**
 * Get current restaurant status
 */
export async function getRestaurantStatus(branchId: string): Promise<RestaurantStatus> {
  const response = await apiGet<RestaurantStatus>(
    `/api/restaurants/current-status?branchId=${branchId}`
  )

  return response
}

/**
 * Get notifications
 */
export async function getNotifications(limit: number = 10) {
  const response = await apiGet<any>(
    `/api/notifications?limit=${limit}`
  )

  // Response is directly the notifications array from extractApiData
  return Array.isArray(response) ? response : response.notifications || []
}

/**
 * Get restaurant operational status
 */
export async function getOperationalStatus(
  branchId: string,
  restaurantId: string
): Promise<RestaurantOperationalStatus> {
  const response = await apiGet<RestaurantOperationalStatus>(
    `/api/dashboard/status?branchId=${branchId}&restaurantId=${restaurantId}`
  )

  return response
}

/**
 * Update restaurant operational status
 * 
 * @param branchId - Branch ID
 * @param restaurantId - Restaurant ID
 * @param operationalStatus - New operational status (OPEN, CLOSED, RUSH_HOUR)
 * @param overrideDurationMinutes - Optional: how long to override (in minutes). If provided, sets a temporary override instead of permanent status
 */
export async function updateOperationalStatus(
  branchId: string,
  restaurantId: string,
  operationalStatus: string,
  overrideDurationMinutes?: number
): Promise<RestaurantOperationalStatus> {
  const response = await apiPatch<RestaurantOperationalStatus>(
    `/api/dashboard/status`,
    {
      branchId,
      restaurantId,
      operationalStatus,
      ...(overrideDurationMinutes !== undefined && { overrideDurationMinutes }),
    }
  )

  return response
}
