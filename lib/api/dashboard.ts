/**
 * Dashboard API Service
 * All API calls related to dashboard
 */

import { apiGet, apiPatch } from '@/lib/api/client'
import type {
  DashboardSummary,
  RevenueChartData,
  SidebarCounts,
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
  const response = await apiGet<SuccessResponse<DashboardHeader>>(
    `/dashboard/header?branchId=${branchId}`
  )

  if (!response.success) {
    throw new Error(response.message)
  }

  return response.data
}

/**
 * Get dashboard summary statistics
 */
export async function getDashboardSummary(
  branchId: string
): Promise<DashboardSummary> {
  const response = await apiGet<SuccessResponse<DashboardSummary>>(
    `/dashboard/summary?branchId=${branchId}&date=today`
  )

  if (!response.success) {
    throw new Error(response.message)
  }

  return response.data
}

/**
 * Get revenue chart data
 */
export async function getRevenueChart(
  branchId: string,
  range: 'today' | 'week' = 'today'
): Promise<RevenueChartData> {
  const response = await apiGet<SuccessResponse<RevenueChartData>>(
    `/dashboard/revenue-chart?branchId=${branchId}&range=${range}`
  )

  if (!response.success) {
    throw new Error(response.message)
  }

  return response.data
}

/**
 * Get sidebar badge counts
 */
export async function getSidebarCounts(branchId: string): Promise<SidebarCounts> {
  const response = await apiGet<SuccessResponse<SidebarCounts>>(
    `/dashboard/sidebar-counts?branchId=${branchId}`
  )

  if (!response.success) {
    throw new Error(response.message)
  }

  return response.data
}

/**
 * Get current restaurant status
 */
export async function getRestaurantStatus(branchId: string): Promise<RestaurantStatus> {
  const response = await apiGet<SuccessResponse<RestaurantStatus>>(
    `/restaurants/current-status?branchId=${branchId}`
  )

  if (!response.success) {
    throw new Error(response.message)
  }

  return response.data
}

/**
 * Get notifications
 */
export async function getNotifications(limit: number = 10) {
  const response = await apiGet<any>(
    `/notifications?limit=${limit}`
  )

  if (!response.success) {
    throw new Error(response.message)
  }

  return response.data.notifications
}

/**
 * Get restaurant operational status
 */
export async function getOperationalStatus(
  branchId: string,
  restaurantId: string
): Promise<RestaurantOperationalStatus> {
  const response = await apiGet<SuccessResponse<RestaurantOperationalStatus>>(
    `/dashboard/status?branchId=${branchId}&restaurantId=${restaurantId}`
  )

  if (!response.success) {
    throw new Error(response.message)
  }

  return response.data
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
  const response = await apiPatch<SuccessResponse<RestaurantOperationalStatus>>(
    `/dashboard/status`,
    {
      branchId,
      restaurantId,
      operationalStatus,
      ...(overrideDurationMinutes !== undefined && { overrideDurationMinutes }),
    }
  )

  if (!response.success) {
    throw new Error(response.message)
  }

  return response.data
}
