/**
 * Supplier Repository
 * Handles all Firestore operations for Supplier entities
 * Replaces all Prisma supplier operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "suppliers"
 * Scope: Restaurant-scoped (organizationId + restaurantId)
 */

import { BaseRepository, IRepository } from '.'
import { COLLECTIONS } from '../config/collections'
import {
  RestaurantScopedDocument,
  QueryOptions,
  UpdateResult,
} from '../types/firestore'
import {
  SupplierDocument,
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from '../types/firestore/inventory'

export type {
  SupplierDocument,
  CreateSupplierPayload,
  UpdateSupplierPayload,
}

/**
 * Supplier Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class SupplierRepository
  extends BaseRepository<SupplierDocument>
  implements IRepository<SupplierDocument>
{
  constructor() {
    super(COLLECTIONS.suppliers)
  }

  /**
   * Find supplier by ID and organization (security check)
   * Prevents cross-organization access
   *
   * @param supplierId - Supplier ID
   * @param organizationId - Organization ID
   * @returns Supplier document or null
   */
  async findByIdAndOrganization(
    supplierId: string,
    organizationId: string
  ): Promise<SupplierDocument | null> {
    try {
      const doc = await this.findById(supplierId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Supplier ${supplierId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding supplier ${supplierId}:`, error)
      return null
    }
  }

  /**
   * Find all suppliers for a restaurant
   * Used in supplier management and listing
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of supplier documents
   */
  async findByRestaurant(
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<SupplierDocument[]> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'supplierName', direction: 'asc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding suppliers for restaurant ${restaurantId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find active suppliers for a restaurant
   * Used in POS and purchasing workflows
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param options - Optional query options
   * @returns Array of active supplier documents
   */
  async findActiveByRestaurant(
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<SupplierDocument[]> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'status', operator: '==' as const, value: 'active' },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'supplierName', direction: 'asc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding active suppliers for restaurant ${restaurantId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find supplier by email (unique per organization)
   *
   * @param organizationId - Organization ID
   * @param email - Email address
   * @returns Supplier document or null
   */
  async findByEmail(
    organizationId: string,
    email: string
  ): Promise<SupplierDocument | null> {
    try {
      const suppliers = await this.findMany({
        filters: [
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'email', operator: '==' as const, value: email },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
        limit: 1,
      })

      return suppliers.length > 0 ? suppliers[0] : null
    } catch (error) {
      console.error(`Error finding supplier by email:`, error)
      return null
    }
  }

  /**
   * Find supplier by phone (unique per organization)
   *
   * @param organizationId - Organization ID
   * @param phone - Phone number
   * @returns Supplier document or null
   */
  async findByPhone(
    organizationId: string,
    phone: string
  ): Promise<SupplierDocument | null> {
    try {
      const suppliers = await this.findMany({
        filters: [
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'phone', operator: '==' as const, value: phone },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
        limit: 1,
      })

      return suppliers.length > 0 ? suppliers[0] : null
    } catch (error) {
      console.error(`Error finding supplier by phone:`, error)
      return null
    }
  }

  /**
   * Find suppliers by status
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param status - Supplier status ('active' | 'inactive')
   * @param options - Optional query options
   * @returns Array of supplier documents
   */
  async findByStatus(
    restaurantId: string,
    organizationId: string,
    status: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<SupplierDocument[]> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'status', operator: '==' as const, value: status },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'supplierName', direction: 'asc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding suppliers by status ${status}:`,
        error
      )
      return []
    }
  }

  /**
   * Search suppliers by name, email, or phone
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param searchTerm - Search term
   * @param options - Optional query options
   * @returns Array of matching supplier documents
   */
  async search(
    restaurantId: string,
    organizationId: string,
    searchTerm: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<SupplierDocument[]> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      const allSuppliers = await this.findMany({ filters })

      // Client-side filtering for name, email, and phone search
      const searchLower = searchTerm.toLowerCase()
      return allSuppliers.filter(
        (supplier) =>
          supplier.supplierName.toLowerCase().includes(searchLower) ||
          supplier.email?.toLowerCase().includes(searchLower) ||
          supplier.phone?.includes(searchTerm)
      )
    } catch (error) {
      console.error(`Error searching suppliers:`, error)
      return []
    }
  }

  /**
   * Count suppliers for a restaurant
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Count of suppliers
   */
  async countByRestaurant(
    restaurantId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.count({ filters })
    } catch (error) {
      console.error(
        `Error counting suppliers for restaurant ${restaurantId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Update supplier status
   *
   * @param supplierId - Supplier ID
   * @param status - New status ('active' | 'inactive')
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateStatus(
    supplierId: string,
    status: string,
    userId: string
  ): Promise<UpdateResult<SupplierDocument>> {
    return await this.update(supplierId, { status }, userId)
  }

  /**
   * Update supplier rating
   *
   * @param supplierId - Supplier ID
   * @param rating - New rating (0-5)
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateRating(
    supplierId: string,
    rating: number,
    userId: string
  ): Promise<UpdateResult<SupplierDocument>> {
    return await this.update(supplierId, { rating }, userId)
  }

  /**
   * Update supplier contact information
   *
   * @param supplierId - Supplier ID
   * @param updates - Contact information updates
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateContact(
    supplierId: string,
    updates: Partial<{
      contactPerson: string
      email: string
      phone: string
    }>,
    userId: string
  ): Promise<UpdateResult<SupplierDocument>> {
    return await this.update(supplierId, updates, userId)
  }

  /**
   * Soft delete supplier
   *
   * @param supplierId - Supplier ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(supplierId: string, userId: string) {
    return await this.delete(supplierId, userId)
  }

  /**
   * Restore soft-deleted supplier
   *
   * @param supplierId - Supplier ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(supplierId: string, userId: string) {
    return await super.restore(supplierId, userId)
  }
}
