/**
 * Tables Service
 * Handles table-related queries
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 */

import { TenantContext } from '@/api/middleware/tenant'

export interface TableInfo {
  id: string
  tableNumber: string
  capacity: number
  section: string | null
  status: string
  occupiedSince: Date | null
  guestCount: number | null
  waiterName: string | null
  x: number | null
  y: number | null
}

/**
 * Get all tables for a branch
 * TODO: Implement with Firestore RestaurantTableRepository
 */
export const getTablesByBranch = async (
  branchId: string,
  tenantContext: TenantContext
): Promise<TableInfo[]> => {
  // Stub with mock data
  return []
}

/**
 * Get table counts for dashboard
 * TODO: Implement with Firestore RestaurantTableRepository
 */
export const getTableCounts = async (
  branchId: string,
  tenantContext: TenantContext
) => {
  // Stub with mock data
  return {
    available: 0,
    occupied: 0,
    reserved: 0,
    cleaning: 0,
    total: 0,
  }
}
