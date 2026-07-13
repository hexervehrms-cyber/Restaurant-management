/**
 * Customer Repository
 * Handles all Customer CRUD operations
 * 
 * Scope: RestaurantScopedDocument (organizationId + restaurantId)
 * Collection: COLLECTIONS.customers
 * 
 * Business Methods:
 * - findByPhone: Unique customer lookup per organization
 * - findByEmail: Email-based lookup
 * - findByOrganization: List all customers in organization
 * - findByRestaurant: List customers in restaurant
 * - countByDate: Count new customers by date range
 * - search: Full-text search by name, phone, email
 */

import { BaseRepository, IRepository } from '.'
import { COLLECTIONS } from '../config/collections'
import { QueryOptions, CreateResult, UpdateResult } from '../types/firestore'
import {
  CustomerDocument,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from '../types/firestore/customer'

export type { CustomerDocument, CreateCustomerPayload, UpdateCustomerPayload }

/**
 * Customer Repository
 * Extends BaseRepository with customer-specific queries
 */
export class CustomerRepository extends BaseRepository<CustomerDocument> implements IRepository<CustomerDocument> {
  constructor() {
    super(COLLECTIONS.customers)
  }

  /**
   * Find customer by phone (unique per organization)
   * 
   * @param organizationId - Organization ID
   * @param phone - Phone number
   * @returns Customer document or null
   * 
   * @example
   *   const customer = await customerRepo.findByPhone(orgId, '+91-98765-43210')
   */
  async findByPhone(organizationId: string, phone: string): Promise<CustomerDocument | null> {
    try {
      const customers = await this.findMany({
        filters: [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'phone', operator: '==', value: phone },
          { field: 'isDeleted', operator: '==', value: false },
        ],
        limit: 1,
      })

      return customers.length > 0 ? customers[0] : null
    } catch (error) {
      console.error(`Error finding customer by phone:`, error)
      return null
    }
  }

  /**
   * Find customer by email (unique per organization)
   * 
   * @param organizationId - Organization ID
   * @param email - Email address
   * @returns Customer document or null
   * 
   * @example
   *   const customer = await customerRepo.findByEmail(orgId, 'amit@example.com')
   */
  async findByEmail(organizationId: string, email: string): Promise<CustomerDocument | null> {
    try {
      const customers = await this.findMany({
        filters: [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'email', operator: '==', value: email },
          { field: 'isDeleted', operator: '==', value: false },
        ],
        limit: 1,
      })

      return customers.length > 0 ? customers[0] : null
    } catch (error) {
      console.error(`Error finding customer by email:`, error)
      return null
    }
  }

  /**
   * Find customers by organization
   * 
   * @param organizationId - Organization ID
   * @param options - Query options (filters, ordering, pagination)
   * @returns Array of customer documents
   * 
   * @example
   *   const customers = await customerRepo.findByOrganization(orgId, {
   *     orders: [{ field: 'createdAt', direction: 'desc' }],
   *     limit: 100
   *   })
   */
  async findByOrganization(
    organizationId: string,
    options?: QueryOptions
  ): Promise<CustomerDocument[]> {
    try {
      return await this.findMany({
        ...options,
        filters: [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'isDeleted', operator: '==', value: false },
          ...(options?.filters || []),
        ],
      })
    } catch (error) {
      console.error(`Error finding customers by organization:`, error)
      return []
    }
  }

  /**
   * Find customers by restaurant
   * 
   * @param organizationId - Organization ID
   * @param restaurantId - Restaurant ID
   * @param options - Query options
   * @returns Array of customer documents
   * 
   * @example
   *   const customers = await customerRepo.findByRestaurant(orgId, restaurantId)
   */
  async findByRestaurant(
    organizationId: string,
    restaurantId: string,
    options?: QueryOptions
  ): Promise<CustomerDocument[]> {
    try {
      return await this.findMany({
        ...options,
        filters: [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'restaurantId', operator: '==', value: restaurantId },
          { field: 'isDeleted', operator: '==', value: false },
          ...(options?.filters || []),
        ],
      })
    } catch (error) {
      console.error(`Error finding customers by restaurant:`, error)
      return []
    }
  }

  /**
   * Find customers by status
   * 
   * @param organizationId - Organization ID
   * @param status - Customer status ('active', 'inactive', 'blocked')
   * @param options - Query options
   * @returns Array of customer documents
   * 
   * @example
   *   const activeCustomers = await customerRepo.findByStatus(orgId, 'active')
   */
  async findByStatus(
    organizationId: string,
    status: 'active' | 'inactive' | 'blocked',
    options?: QueryOptions
  ): Promise<CustomerDocument[]> {
    try {
      return await this.findMany({
        ...options,
        filters: [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'status', operator: '==', value: status },
          { field: 'isDeleted', operator: '==', value: false },
          ...(options?.filters || []),
        ],
      })
    } catch (error) {
      console.error(`Error finding customers by status:`, error)
      return []
    }
  }

  /**
   * Search customers by name, phone, or email
   * 
   * @param organizationId - Organization ID
   * @param query - Search query
   * @param options - Query options
   * @returns Array of matching customer documents
   * 
   * @example
   *   const results = await customerRepo.search(orgId, 'amit', { limit: 10 })
   * 
   * PERFORMANCE NOTE:
   * Firestore doesn't support full-text search natively.
   * This implementation uses multiple queries combined in-memory.
   * For production, consider:
   * - Algolia or Elasticsearch for search
   * - Firestore collection group queries
   * - Client-side filtering
   */
  async search(
    organizationId: string,
    query: string,
    options?: QueryOptions
  ): Promise<CustomerDocument[]> {
    try {
      // Normalize query for case-insensitive search
      const normalizedQuery = query.toLowerCase()

      // Get all customers for organization
      const allCustomers = await this.findByOrganization(organizationId, options)

      // Filter by search criteria (in-memory since Firestore lacks full-text search)
      const results = allCustomers.filter((customer) => {
        const searchableFields = [
          customer.firstName?.toLowerCase(),
          customer.lastName?.toLowerCase(),
          customer.email?.toLowerCase(),
          customer.phone,
          `${customer.firstName} ${customer.lastName}`.toLowerCase(),
        ]

        return searchableFields.some((field) => field?.includes(normalizedQuery))
      })

      return results
    } catch (error) {
      console.error(`Error searching customers:`, error)
      return []
    }
  }

  /**
   * Count customers created within date range
   * Used for dashboard metrics
   * 
   * @param organizationId - Organization ID
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @returns Count of new customers
   * 
   * @example
   *   const count = await customerRepo.countByDateRange(
   *     orgId,
   *     new Date('2024-01-01'),
   *     new Date('2024-01-31')
   *   )
   */
  async countByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      return await this.count({
        filters: [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'createdAt', operator: '>=', value: startDate },
          { field: 'createdAt', operator: '<=', value: endDate },
          { field: 'isDeleted', operator: '==', value: false },
        ],
      })
    } catch (error) {
      console.error(`Error counting customers by date:`, error)
      return 0
    }
  }

  /**
   * Get total spent amount for organization
   * 
   * @param organizationId - Organization ID
   * @returns Total amount spent by all active customers
   * 
   * @example
   *   const total = await customerRepo.getTotalSpent(orgId)
   * 
   * PERFORMANCE NOTE:
   * This fetches all customers and sums in memory.
   * For large datasets, consider:
   * - Aggregation pipeline in backend
   * - Firestore Datastore aggregations
   * - Separate aggregation collection
   */
  async getTotalSpent(organizationId: string): Promise<number> {
    try {
      const customers = await this.findByOrganization(organizationId)
      return customers.reduce((sum, customer) => {
        const spent = typeof customer.totalSpent === 'number' ? customer.totalSpent : 0
        return sum + spent
      }, 0)
    } catch (error) {
      console.error(`Error getting total spent:`, error)
      return 0
    }
  }

  /**
   * Update customer status
   * 
   * @param customerId - Customer ID
   * @param status - New status
   * @param userId - User performing update
   * @returns Updated customer or error
   * 
   * @example
   *   const result = await customerRepo.updateStatus(customerId, 'blocked', userId)
   */
  async updateStatus(
    customerId: string,
    status: 'active' | 'inactive' | 'blocked',
    userId: string
  ): Promise<UpdateResult<CustomerDocument>> {
    return this.update(customerId, { status } as Partial<CustomerDocument>, userId)
  }

  /**
   * Increment order count and update total spent
   * Called when an order is created for this customer
   * 
   * @param customerId - Customer ID
   * @param orderAmount - Amount spent in this order
   * @param userId - User performing update
   * @returns Updated customer or error
   * 
   * @example
   *   const result = await customerRepo.recordOrder(customerId, 250.50, userId)
   */
  async recordOrder(
    customerId: string,
    orderAmount: number,
    userId: string
  ): Promise<UpdateResult<CustomerDocument>> {
    try {
      const customer = await this.findById(customerId)
      if (!customer) {
        return {
          success: false,
          error: 'Customer not found',
        }
      }

      const currentSpent =
        typeof customer.totalSpent === 'number' ? customer.totalSpent : 0
      const newSpent = currentSpent + orderAmount
      const newOrderCount = (customer.totalOrders || 0) + 1

      return this.update(
        customerId,
        {
          totalOrders: newOrderCount,
          totalSpent: newSpent,
          lastVisitAt: new Date(),
        } as Partial<CustomerDocument>,
        userId
      )
    } catch (error) {
      console.error(`Error recording order:`, error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Count all customers in organization
   * 
   * @param organizationId - Organization ID
   * @returns Total active customer count
   * 
   * @example
   *   const count = await customerRepo.countByOrganization(orgId)
   */
  async countByOrganization(organizationId: string): Promise<number> {
    try {
      return await this.count({
        filters: [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'isDeleted', operator: '==', value: false },
        ],
      })
    } catch (error) {
      console.error(`Error counting customers by organization:`, error)
      return 0
    }
  }
}
