/**
 * Menu Item Repository
 * Handles all Firestore operations for MenuItem entities
 * Replaces all Prisma menuItem operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "menuItems"
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import {
  RestaurantScopedDocument,
  QueryOptions,
  UpdateResult,
} from '../types/firestore'

/**
 * Menu Item Document Schema (Firestore)
 */
export interface MenuItemDocument extends RestaurantScopedDocument {
  categoryId: string
  name: string
  description?: string | null
  basePrice: number
  costPrice?: number | null
  displayOrder: number
  imageUrl?: string | null
  isVegetarian: boolean
  isVegan: boolean
  isSpicy: boolean
  spiceLevel: number
  preparationTimeMinutes: number
  allergens?: string | null
  nutritionalInfo?: Record<string, any> | null
  isAvailable: boolean
  status: string
  metadata?: Record<string, any>
}

/**
 * Menu Item Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class MenuItemRepository extends BaseRepository<MenuItemDocument> {
  constructor() {
    super(COLLECTIONS.menuItems)
  }

  /**
   * Find menu item by ID and organization
   * Secure lookup to prevent cross-organization access
   *
   * @param itemId - Menu item ID
   * @param organizationId - Organization ID (for security)
   * @returns Menu item document or null
   */
  async findByIdAndOrganization(
    itemId: string,
    organizationId: string
  ): Promise<MenuItemDocument | null> {
    try {
      const doc = await this.findById(itemId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Menu item ${itemId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding menu item ${itemId}:`, error)
      return null
    }
  }

  /**
   * Find all menu items for a restaurant
   * Used in menu management and listing
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID (for security)
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of menu item documents
   */
  async findByRestaurant(
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<MenuItemDocument[]> {
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
        `Error finding menu items for restaurant ${restaurantId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find menu items by category
   * Used for category-specific menu display
   *
   * @param restaurantId - Restaurant ID
   * @param categoryId - Category ID
   * @param organizationId - Organization ID
   * @param options - Optional query options
   * @returns Array of menu item documents
   */
  async findByCategory(
    restaurantId: string,
    categoryId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<MenuItemDocument[]> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'categoryId', operator: '==' as const, value: categoryId },
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
        `Error finding menu items for category ${categoryId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find available menu items for a restaurant
   * Used in POS and customer-facing menu
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param options - Optional query options
   * @returns Array of available menu item documents
   */
  async findAvailableByRestaurant(
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<MenuItemDocument[]> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isAvailable', operator: '==' as const, value: true },
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
        `Error finding available menu items for restaurant ${restaurantId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find menu items by IDs (for order lookups)
   * Used when retrieving pricing for specific menu items
   *
   * @param itemIds - Array of menu item IDs
   * @param organizationId - Organization ID
   * @returns Map of menu item documents by ID
   */
  async findByIds(
    itemIds: string[],
    organizationId: string
  ): Promise<Map<string, MenuItemDocument>> {
    try {
      if (itemIds.length === 0) return new Map()

      const items = await this.findMany({
        filters: [
          { field: 'id', operator: 'in', value: itemIds },
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
      })

      const map = new Map<string, MenuItemDocument>()
      items.forEach((item) => map.set(item.id, item))
      return map
    } catch (error) {
      console.error(`Error finding menu items by IDs:`, error)
      return new Map()
    }
  }

  /**
   * Search menu items by name or description
   * Used in menu search functionality
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param searchTerm - Search term
   * @param options - Optional query options
   * @returns Array of matching menu item documents
   */
  async search(
    restaurantId: string,
    organizationId: string,
    searchTerm: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<MenuItemDocument[]> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      const allItems = await this.findMany({ filters })
      
      // Client-side filtering for name and description search
      const searchLower = searchTerm.toLowerCase()
      return allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
      )
    } catch (error) {
      console.error(`Error searching menu items:`, error)
      return []
    }
  }

  /**
   * Count menu items for a restaurant
   * Used for analytics
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Count of menu items
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
        `Error counting menu items for restaurant ${restaurantId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Update menu item availability
   *
   * @param itemId - Menu item ID
   * @param isAvailable - Availability status
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateAvailability(
    itemId: string,
    isAvailable: boolean,
    userId: string
  ): Promise<UpdateResult<MenuItemDocument>> {
    return await this.update(itemId, { isAvailable: isAvailable as any }, userId)
  }

  /**
   * Update menu item status
   *
   * @param itemId - Menu item ID
   * @param status - New status
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateStatus(
    itemId: string,
    status: string,
    userId: string
  ): Promise<UpdateResult<MenuItemDocument>> {
    return await this.update(itemId, { status: status as any }, userId)
  }

  /**
   * Update menu item pricing
   *
   * @param itemId - Menu item ID
   * @param basePrice - New base price
   * @param userId - User performing the update
   * @returns Update result
   */
  async updatePrice(
    itemId: string,
    basePrice: number,
    userId: string
  ): Promise<UpdateResult<MenuItemDocument>> {
    return await this.update(itemId, { basePrice: basePrice as any }, userId)
  }

  /**
   * Soft delete menu item
   *
   * @param itemId - Menu item ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(itemId: string, userId: string) {
    return await this.delete(itemId, userId)
  }

  /**
   * Restore soft-deleted menu item
   *
   * @param itemId - Menu item ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(itemId: string, userId: string) {
    return await super.restore(itemId, userId)
  }
}
