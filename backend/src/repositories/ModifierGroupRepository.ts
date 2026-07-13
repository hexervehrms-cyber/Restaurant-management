/**
 * Modifier Group Repository
 * Handles all Firestore operations for ModifierGroup entities
 * Replaces all Prisma modifierGroup operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "modifierGroups"
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import {
  RestaurantScopedDocument,
  QueryOptions,
  UpdateResult,
} from '../types/firestore'

/**
 * Modifier Group Document Schema (Firestore)
 */
export interface ModifierGroupDocument extends RestaurantScopedDocument {
  name: string
  description?: string | null
  isRequired: boolean
  minSelections: number
  maxSelections: number
  displayOrder: number
  status: string
}

/**
 * Modifier Group Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class ModifierGroupRepository extends BaseRepository<ModifierGroupDocument> {
  constructor() {
    super(COLLECTIONS.modifierGroups)
  }

  /**
   * Find modifier group by ID and organization
   * Secure lookup to prevent cross-organization access
   *
   * @param groupId - Modifier group ID
   * @param organizationId - Organization ID (for security)
   * @returns Modifier group document or null
   */
  async findByIdAndOrganization(
    groupId: string,
    organizationId: string
  ): Promise<ModifierGroupDocument | null> {
    try {
      const doc = await this.findById(groupId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Modifier group ${groupId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding modifier group ${groupId}:`, error)
      return null
    }
  }

  /**
   * Find all modifier groups for a restaurant
   * Used in menu management
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID (for security)
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of modifier group documents
   */
  async findByRestaurant(
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<ModifierGroupDocument[]> {
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
        `Error finding modifier groups for restaurant ${restaurantId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find active modifier groups for a restaurant
   * Used in POS and customer-facing menu
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Array of active modifier group documents
   */
  async findActiveByRestaurant(
    restaurantId: string,
    organizationId: string
  ): Promise<ModifierGroupDocument[]> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'status', operator: '==' as const, value: 'active' },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: [{ field: 'displayOrder', direction: 'asc' as const }],
      })
    } catch (error) {
      console.error(
        `Error finding active modifier groups for restaurant ${restaurantId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find modifier groups by IDs
   * Used for loading specific modifier groups
   *
   * @param groupIds - Array of group IDs
   * @param organizationId - Organization ID
   * @returns Map of modifier group documents by ID
   */
  async findByIds(
    groupIds: string[],
    organizationId: string
  ): Promise<Map<string, ModifierGroupDocument>> {
    try {
      if (groupIds.length === 0) return new Map()

      const groups = await this.findMany({
        filters: [
          { field: 'id', operator: 'in', value: groupIds },
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
      })

      const map = new Map<string, ModifierGroupDocument>()
      groups.forEach((group) => map.set(group.id, group))
      return map
    } catch (error) {
      console.error(`Error finding modifier groups by IDs:`, error)
      return new Map()
    }
  }

  /**
   * Count modifier groups for a restaurant
   * Used for analytics
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Count of modifier groups
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
        `Error counting modifier groups for restaurant ${restaurantId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Update modifier group status
   *
   * @param groupId - Modifier group ID
   * @param status - New status
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateStatus(
    groupId: string,
    status: string,
    userId: string
  ): Promise<UpdateResult<ModifierGroupDocument>> {
    return await this.update(groupId, { status: status as any }, userId)
  }

  /**
   * Update modifier group selection constraints
   *
   * @param groupId - Modifier group ID
   * @param minSelections - Minimum selections
   * @param maxSelections - Maximum selections
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateSelectionConstraints(
    groupId: string,
    minSelections: number,
    maxSelections: number,
    userId: string
  ): Promise<UpdateResult<ModifierGroupDocument>> {
    return await this.update(
      groupId,
      {
        minSelections: minSelections as any,
        maxSelections: maxSelections as any,
      },
      userId
    )
  }

  /**
   * Soft delete modifier group
   *
   * @param groupId - Modifier group ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(groupId: string, userId: string) {
    return await this.delete(groupId, userId)
  }

  /**
   * Restore soft-deleted modifier group
   *
   * @param groupId - Modifier group ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(groupId: string, userId: string) {
    return await super.restore(groupId, userId)
  }
}
