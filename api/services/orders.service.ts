/**
 * Orders Service
 * Handles order-related queries
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 */

import { TenantContext } from '@/api/middleware/tenant'

export interface LiveOrder {
  id: string
  orderNumber: string
  tableNumber: string | null
  status: string
  items: Array<{
    name: string
    quantity: number
  }>
  totalAmount: number
  createdAt: Date
  waiterName: string | null
}

export interface LiveOrdersResponse {
  activeCount: number
  orders: LiveOrder[]
}

/**
 * Get active live orders for a branch
 * Active statuses: pending, confirmed, preparing, ready
 * TODO: Implement with Firestore OrderRepository
 */
export const getLiveOrders = async (
  branchId: string,
  tenantContext: TenantContext
): Promise<LiveOrdersResponse> => {
  // Stub with mock data
  return {
    activeCount: 0,
    orders: [],
  }
}

/**
 * Get order details
 * TODO: Implement with Firestore OrderRepository
 */
export const getOrderById = async (
  orderId: string,
  tenantContext: TenantContext
) => {
  // Stub implementation
  return null
}
