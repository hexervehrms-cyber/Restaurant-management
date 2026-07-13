/**
 * Orders Service
 * Handles order-related queries - Firestore-backed
 */

import { TenantContext } from '@/api/middleware/tenant'
import { OrderRepository } from '@/src/repositories'

const orderRepo = new OrderRepository()

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
 */
export const getLiveOrders = async (
  branchId: string,
  tenantContext: TenantContext
): Promise<LiveOrdersResponse> => {
  try {
    const activeStatuses = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
    ]

    const orders = await orderRepo.findMany({
      filters: [
        { field: 'organizationId', operator: '==', value: tenantContext.organizationId },
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'status', operator: 'in', value: activeStatuses },
        { field: 'isDeleted', operator: '==', value: false },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 50,
    })

    const formattedOrders: LiveOrder[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber || null,
      status: order.status,
      items: order.items ? order.items.map((item: any) => ({
        name: item.itemName,
        quantity: item.quantity,
      })) : [],
      totalAmount: parseFloat(order.totalAmount as any),
      createdAt: order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt as any),
      waiterName: order.createdByName || null,
    }))

    return {
      activeCount: formattedOrders.length,
      orders: formattedOrders,
    }
  } catch (error) {
    console.error('Error fetching live orders:', error)
    throw error
  }
}

/**
 * Get order details
 */
export const getOrderById = async (
  orderId: string,
  tenantContext: TenantContext
) => {
  try {
    const order = await orderRepo.findById(orderId)
    
    if (!order || order.organizationId !== tenantContext.organizationId) {
      return null
    }

    return order
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}
