/**
 * Menu Item Modifier Group Repository
 * Handles all Firestore operations for MenuItemModifierGroup junction documents
 * Replaces Prisma MenuItemModifierGroup model
 *
 * This collection represents the many-to-many relationship between:
 * - MenuItem (via menuItemId)
 * - ModifierGroup (via modifierGroupId)
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "menuItemModifierGroups"
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import {
  RestaurantScopedDocument,
  QueryOptions,
  UpdateResult,
} from '../types/firestore'

/**
 * Menu Item Modifier Group Document Schema (Firestore)
 * Represents a single relationship between a MenuItem and a ModifierGroup
 */
export interface MenuItemModifierGroupDocument extends RestaurantScopedDocument {
  menuItemId: string
  modifierGroupId: string
  displayOrder: number
}

/**
 * Menu Item Modifier Group Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class MenuItemModifierGroupRepository extends BaseRepository<MenuItemModifierGroupDocument> {
  constructor() {
    super(COLLECTIONS.menuItemModifierGroups)
  }

  /**
   * Find all modifier groups associated with a specific menu item
   * Used when loading menu item with its modifiers
   *
   * @param menuItemId - Menu item ID
   * @param organizationId - Organization ID (for security)
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of MenuItemModifierGroup documents
   */
  async findByMenuItem(
    menuItemId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<MenuItemModifierGroupDocument[]> {
    try {
      const filters = [
        { field: 'menuItemId', operator: '==' as const, value: menuItemId },
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
        `Error finding modifier groups for menu item ${menuItemId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find all menu items associated with a specific modifier group
   * Used when analyzing modifier group usage
   *
   * @param modifierGroupId - Modifier group ID
   * @param organizationId - Organization ID (for security)
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of MenuItemModifierGroup documents
   */
  async findByModifierGroup(
    modifierGroupId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<MenuItemModifierGroupDocument[]> {
    try {
      const filters = [
        { field: 'modifierGroupId', operator: '==' as const, value: modifierGroupId },
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
        `Error finding menu items for modifier group ${modifierGroupId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find all relationships for a restaurant
   * Used for bulk operations or analytics
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param options - Optional query options
   * @returns Array of MenuItemModifierGroup documents
   */
  async findByRestaurant(
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<MenuItemModifierGroupDocument[]> {
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
        `Error finding relationships for restaurant ${restaurantId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find all relationships for an organization
   * Used for bulk operations or analytics
   *
   * @param organizationId - Organization ID
   * @param options - Optional query options
   * @returns Array of MenuItemModifierGroup documents
   */
  async findByOrganization(
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<MenuItemModifierGroupDocument[]> {
    try {
      const filters = [
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
        `Error finding relationships for organization ${organizationId}:`,
        error
      )
      return []
    }
  }

  /**
   * Check if a relationship exists between a menu item and modifier group
   * Used for validation before creating duplicate relationships
   *
   * @param menuItemId - Menu item ID
   * @param modifierGroupId - Modifier group ID
   * @param organizationId - Organization ID
   * @returns true if relationship exists and not deleted
   */
  async existsRelationship(
    menuItemId: string,
    modifierGroupId: string,
    organizationId: string
  ): Promise<boolean> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'menuItemId', operator: '==' as const, value: menuItemId },
          { field: 'modifierGroupId', operator: '==' as const, value: modifierGroupId },
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
      })

      return docs.length > 0
    } catch (error) {
      console.error('Error checking relationship existence:', error)
      return false
    }
  }

  /**
   * Update display order for a relationship
   * Used when reordering modifier groups for a menu item
   *
   * @param id - Relationship document ID
   * @param displayOrder - New display order
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateDisplayOrder(
    id: string,
    displayOrder: number,
    userId: string
  ): Promise<UpdateResult<MenuItemModifierGroupDocument>> {
    return await this.update(
      id,
      { displayOrder: displayOrder as any },
      userId
    )
  }

  /**
   * Soft delete a relationship
   *
   * @param id - Relationship document ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(id: string, userId: string) {
    return await this.delete(id, userId)
  }

  /**
   * Restore a soft-deleted relationship
   *
   * @param id - Relationship document ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(id: string, userId: string) {
    return await super.restore(id, userId)
  }

  /**
   * Delete a specific relationship between a menu item and modifier group
   * This is a convenience method for deleting by the composite key
   *
   * @param menuItemId - Menu item ID
   * @param modifierGroupId - Modifier group ID
   * @param organizationId - Organization ID
   * @param userId - User performing the delete
   * @returns Number of documents deleted
   */
  async deleteRelationship(
    menuItemId: string,
    modifierGroupId: string,
    organizationId: string,
    userId: string
  ): Promise<number> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'menuItemId', operator: '==' as const, value: menuItemId },
          { field: 'modifierGroupId', operator: '==' as const, value: modifierGroupId },
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
      })

      let deleted = 0
      for (const doc of docs) {
        await this.delete(doc.id, userId)
        deleted++
      }

      return deleted
    } catch (error) {
      console.error('Error deleting relationship:', error)
      return 0
    }
  }
}
