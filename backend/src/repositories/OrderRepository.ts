/**
 * Order Repository
 * Handles all order-related Firestore operations
 * Replaces Prisma Order model operations with Firestore
 */

import { BaseRepository, IRepository } from '.'
import { COLLECTIONS } from '../config/collections'
import { BaseDocument, QueryOptions, UpdateResult, CreateResult } from '../types/firestore'
import {
  OrderDocument,
  CreateOrderPayload,
  UpdateOrderPayload,
} from '../types/firestore/order'

export type { OrderDocument, CreateOrderPayload, UpdateOrderPayload }

/**
 * Order Repository
 * Extends BaseRepository with order-specific operations
 */
export class OrderRepository extends BaseRepository<OrderDocument> implements IRepository<OrderDocument> {
  constructor() {
    super(COLLECTIONS.orders)
  }

  /**
   * Find orders by branch
   * 
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @param options - Optional query options for ordering and pagination
   * @returns Array of order documents
   * 
   * @example
   *   const orders = await orderRepo.findByBranch(branchId, orgId)
   */
  async findByBranch(
    branchId: string,
    organizationId: string,
    options?: QueryOptions
  ): Promise<OrderDocument[]> {
    try {
      return await this.findMany({
        ...options,
        filters: [
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
          ...(options?.filters || []),
        ],
        orders: options?.orders || [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding orders by branch:', error)
      return []
    }
  }

  /**
   * Find orders by status
   * 
   * @param status - Order status
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of order documents
   * 
   * @example
   *   const pendingOrders = await orderRepo.findByStatus('pending', branchId, orgId)
   */
  async findByStatus(
    status: OrderDocument['status'],
    branchId: string,
    organizationId: string
  ): Promise<OrderDocument[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'status', operator: '==', value: status },
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'asc' }],
      })
    } catch (error) {
      console.error('Error finding orders by status:', error)
      return []
    }
  }

  /**
   * Find orders by customer
   * 
   * @param customerId - Customer ID
   * @param organizationId - Organization ID
   * @returns Array of order documents
   * 
   * @example
   *   const customerOrders = await orderRepo.findByCustomer(customerId, orgId)
   */
  async findByCustomer(customerId: string, organizationId: string): Promise<OrderDocument[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'customerId', operator: '==', value: customerId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding orders by customer:', error)
      return []
    }
  }

  /**
   * Find orders by table
   * 
   * @param tableId - Table ID
   * @param organizationId - Organization ID
   * @returns Array of order documents
   * 
   * @example
   *   const tableOrders = await orderRepo.findByTable(tableId, orgId)
   */
  async findByTable(tableId: string, organizationId: string): Promise<OrderDocument[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'tableId', operator: '==', value: tableId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding orders by table:', error)
      return []
    }
  }

  /**
   * Find orders by order number (unique per branch)
   * 
   * @param orderNumber - Order number
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Order document or null
   * 
   * @example
   *   const order = await orderRepo.findByOrderNumber('ORD-20240115-0001', branchId, orgId)
   */
  async findByOrderNumber(
    orderNumber: string,
    branchId: string,
    organizationId: string
  ): Promise<OrderDocument | null> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'orderNumber', operator: '==', value: orderNumber },
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        limit: 1,
      })

      return docs.length > 0 ? docs[0] : null
    } catch (error) {
      console.error('Error finding order by order number:', error)
      return null
    }
  }

  /**
   * Find orders by date range
   * 
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of order documents
   * 
   * @example
   *   const dailyOrders = await orderRepo.findByDateRange(
   *     new Date('2024-01-15'),
   *     new Date('2024-01-16'),
   *     branchId,
   *     orgId
   *   )
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    branchId: string,
    organizationId: string
  ): Promise<OrderDocument[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'createdAt', operator: '>=', value: startDate },
          { field: 'createdAt', operator: '<=', value: endDate },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding orders by date range:', error)
      return []
    }
  }

  /**
   * Count orders created today
   * Used for dashboard metrics
   * 
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Count of orders created today
   * 
   * @example
   *   const todayCount = await orderRepo.countToday(branchId, orgId)
   */
  async countToday(branchId: string, organizationId: string): Promise<number> {
    try {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

      return await this.count({
        filters: [
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'createdAt', operator: '>=', value: startOfDay },
          { field: 'createdAt', operator: '<', value: endOfDay },
        ],
      })
    } catch (error) {
      console.error('Error counting orders today:', error)
      return 0
    }
  }

  /**
   * Count orders within date range
   * Optional filtering by status exclusion
   * 
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @param excludeStatuses - Optional array of statuses to exclude
   * @returns Count of orders
   * 
   * @example
   *   const count = await orderRepo.countByDateRange(
   *     startDate,
   *     endDate,
   *     branchId,
   *     orgId,
   *     ['cancelled']
   *   )
   */
  async countByDateRange(
    startDate: Date,
    endDate: Date,
    branchId: string,
    organizationId: string,
    excludeStatuses?: OrderDocument['status'][]
  ): Promise<number> {
    try {
      const filters: QueryOptions['filters'] = [
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'createdAt', operator: '>=', value: startDate },
        { field: 'createdAt', operator: '<=', value: endDate },
      ]

      // Note: Firestore doesn't support "not in" for arrays, so we get all and filter
      if (excludeStatuses && excludeStatuses.length > 0) {
        const orders = await this.findMany({ filters })
        return orders.filter((order) => !excludeStatuses.includes(order.status)).length
      }

      return await this.count({ filters })
    } catch (error) {
      console.error('Error counting orders by date range:', error)
      return 0
    }
  }

  /**
   * Sum revenue for date range
   * Used for dashboard revenue metrics
   * Pattern: Sum decimal strings stored as totalAmount
   * 
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Total revenue amount
   * 
   * @example
   *   const revenue = await orderRepo.sumRevenue(
   *     startDate,
   *     endDate,
   *     branchId,
   *     orgId
   *   )
   */
  async sumRevenue(
    startDate: Date,
    endDate: Date,
    branchId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const filters: QueryOptions['filters'] = [
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'createdAt', operator: '>=', value: startDate },
        { field: 'createdAt', operator: '<=', value: endDate },
      ]

      const orders = await this.findMany({ filters })

      return orders.reduce((sum, order) => {
        const amount = parseFloat(order.totalAmount) || 0
        return sum + amount
      }, 0)
    } catch (error) {
      console.error('Error calculating revenue sum:', error)
      return 0
    }
  }

  /**
   * Calculate average ticket value for date range
   * 
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Average ticket value
   * 
   * @example
   *   const avgTicket = await orderRepo.averageTicket(
   *     startDate,
   *     endDate,
   *     branchId,
   *     orgId
   *   )
   */
  async averageTicket(
    startDate: Date,
    endDate: Date,
    branchId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const filters: QueryOptions['filters'] = [
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'createdAt', operator: '>=', value: startDate },
        { field: 'createdAt', operator: '<=', value: endDate },
      ]

      const orders = await this.findMany({ filters })
      if (orders.length === 0) return 0

      const totalRevenue = orders.reduce((sum, order) => {
        const amount = parseFloat(order.totalAmount) || 0
        return sum + amount
      }, 0)

      return totalRevenue / orders.length
    } catch (error) {
      console.error('Error calculating average ticket:', error)
      return 0
    }
  }

  /**
   * Get live orders (orders in progress)
   * Returns orders with status: pending, confirmed, preparing, ready
   * 
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of active order documents
   * 
   * @example
   *   const liveOrders = await orderRepo.getLiveOrders(branchId, orgId)
   */
  async getLiveOrders(branchId: string, organizationId: string): Promise<OrderDocument[]> {
    try {
      const liveStatuses: OrderDocument['status'][] = ['pending', 'confirmed', 'preparing', 'ready']
      const allOrders = await this.findByBranch(branchId, organizationId)

      return allOrders.filter((order) => liveStatuses.includes(order.status))
    } catch (error) {
      console.error('Error getting live orders:', error)
      return []
    }
  }

  /**
   * Get orders for chart visualization
   * Returns completed/served orders for date range with optional status exclusion
   * 
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @param excludeStatuses - Optional array of statuses to exclude
   * @returns Array of order documents
   * 
   * @example
   *   const chartOrders = await orderRepo.getOrdersForChart(
   *     startDate,
   *     endDate,
   *     branchId,
   *     orgId,
   *     ['cancelled']
   *   )
   */
  async getOrdersForChart(
    startDate: Date,
    endDate: Date,
    branchId: string,
    organizationId: string,
    excludeStatuses?: OrderDocument['status'][]
  ): Promise<OrderDocument[]> {
    try {
      const filters: QueryOptions['filters'] = [
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'createdAt', operator: '>=', value: startDate },
        { field: 'createdAt', operator: '<=', value: endDate },
      ]

      let orders = await this.findMany({
        filters,
        orders: [{ field: 'createdAt', direction: 'asc' }],
      })

      if (excludeStatuses && excludeStatuses.length > 0) {
        orders = orders.filter((order) => !excludeStatuses.includes(order.status))
      }

      return orders
    } catch (error) {
      console.error('Error getting orders for chart:', error)
      return []
    }
  }

  /**
   * Update order status
   * Convenience method for status changes
   * 
   * @param orderId - Order ID
   * @param status - New status
   * @param userId - User performing update
   * @returns Updated order or error
   * 
   * @example
   *   const result = await orderRepo.updateStatus(orderId, 'preparing', userId)
   */
  async updateStatus(
    orderId: string,
    status: OrderDocument['status'],
    userId: string
  ): Promise<UpdateResult<OrderDocument>> {
    try {
      return await this.update(orderId, { status } as Partial<OrderDocument>, userId)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Cancel order
   * Convenience method for order cancellation
   * 
   * @param orderId - Order ID
   * @param reason - Cancellation reason
   * @param userId - User performing cancellation
   * @returns Updated order or error
   * 
   * @example
   *   const result = await orderRepo.cancel(orderId, 'Customer requested', userId)
   */
  async cancel(
    orderId: string,
    reason: string,
    userId: string
  ): Promise<UpdateResult<OrderDocument>> {
    try {
      return await this.update(
        orderId,
        {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason,
        } as Partial<OrderDocument>,
        userId
      )
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Helper to convert numeric amounts to decimal strings
   */
  protected toDecimalString(value: string | number): string {
    return typeof value === 'string' ? value : value.toFixed(2)
  }
}

