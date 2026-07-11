/**
 * Orders Service
 * Handles order-related queries
 */

import { PrismaClient } from '@prisma/client'
import { TenantContext } from '@/api/middleware/tenant'

const prisma = new PrismaClient()

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

    const orders = await prisma.order.findMany({
      where: {
        organizationId: tenantContext.organizationId,
        branchId: branchId,
        status: {
          in: activeStatuses as any[],
        },
        deletedAt: null,
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
        createdBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    const formattedOrders: LiveOrder[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.table?.tableNumber ?? null,
      status: order.status,
      items: order.items.map((item) => ({
        name: item.itemName,
        quantity: item.quantity,
      })),
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      waiterName: order.createdBy?.firstName ?? null,
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
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        organizationId: tenantContext.organizationId,
        deletedAt: null,
      },
      include: {
        items: {
          include: {
            menuItem: true,
            modifiers: true,
          },
        },
        table: true,
        customer: true,
        createdBy: true,
      },
    })

    return order
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}
