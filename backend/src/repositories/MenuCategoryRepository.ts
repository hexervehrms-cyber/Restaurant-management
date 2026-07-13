/**
 * Menu Category Repository
 * Handles all Firestore operations for MenuCategory entities
 * Replaces all Prisma menuCategory operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "menuCategories"
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import {
  RestaurantScopedDocument,
  QueryOptions,
  UpdateResult,
} from '../types/firestore'

/**
 * Menu Category Document Schema (Firestore)
 */
export interface MenuCategoryDocument extends RestaurantScopedDocument {
  name: string
  description?: string | null
  displayOrder: number
  iconUrl?: string | null
  color?: string | null
  isActive: boolean
  status: string
  metadata?: Record<string, any>
}

/**
 * Menu Category Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class MenuCategoryRepository extends BaseRepository<MenuCategoryDocument> {
  constructor() {
    super(COLLECTIONS.menuCategories)
  }

  /**
   * Find category by ID and organization
   * Secure lookup to prevent cross-organization access
   *
   * @param categoryId - Category ID
   * @param organizationId - Organization ID (for security)
   * @returns Category document or null
   */
  async findByIdAndOrganization(
    categoryId: string,
    organizationId: string
  ): Promise<MenuCategoryDocument | null> {
    try {
      const doc = await this.findById(categoryId)

      if (!doc) return null

      // Validate organization and restaurant access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Category ${categoryId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding category ${categoryId}:`, error)
      return null
    }
  }

  /**
   * Find all categories for a restaurant
   * Used in menu listing endpoints
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID (for security)
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of category documents
   */
  async findByRestaurant(
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<MenuCategoryDocument[]> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'displayOrder', direction: 'asc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding categories for restaurant ${restaurantId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find active categories for a restaurant
   * Used in POS menu display
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Array of active category documents
   */
  async findActiveByRestaurant(
    restaurantId: string,
    organizationId: string
  ): Promise<MenuCategoryDocument[]> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isActive', operator: '==' as const, value: true },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: [{ field: 'displayOrder', direction: 'asc' as const }],
      })
    } catch (error) {
      console.error(
        `Error finding active categories for restaurant ${restaurantId}:`,
        error
      )
      return []
    }
  }

  /**
   * Count categories for a restaurant
   * Used for analytics
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Count of categories
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
        `Error counting categories for restaurant ${restaurantId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Update category status
   *
   * @param categoryId - Category ID
   * @param status - New status
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateStatus(
    categoryId: string,
    status: string,
    userId: string
  ): Promise<UpdateResult<MenuCategoryDocument>> {
    return await this.update(categoryId, { status: status as any }, userId)
  }

  /**
   * Update category active status
   *
   * @param categoryId - Category ID
   * @param isActive - Active status
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateActiveStatus(
    categoryId: string,
    isActive: boolean,
    userId: string
  ): Promise<UpdateResult<MenuCategoryDocument>> {
    return await this.update(categoryId, { isActive: isActive as any }, userId)
  }

  /**
   * Soft delete category
   *
   * @param categoryId - Category ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(categoryId: string, userId: string) {
    return await this.delete(categoryId, userId)
  }

  /**
   * Restore soft-deleted category
   *
   * @param categoryId - Category ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(categoryId: string, userId: string) {
    return await super.restore(categoryId, userId)
  }
}
