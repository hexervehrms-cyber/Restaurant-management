/**
 * Modifier Repository
 * Handles all Firestore operations for Modifier entities
 * Replaces all Prisma modifier operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "modifiers"
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import {
  BaseDocument,
  QueryOptions,
  UpdateResult,
} from '../types/firestore'

/**
 * Modifier Document Schema (Firestore)
 */
export interface ModifierDocument extends BaseDocument {
  modifierGroupId: string
  name: string
  priceModifier: number
  displayOrder: number
  isAvailable: boolean
}

/**
 * Modifier Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class ModifierRepository extends BaseRepository<ModifierDocument> {
  constructor() {
    super(COLLECTIONS.modifiers)
  }

  /**
   * Find modifier by ID and organization
   * Secure lookup to prevent cross-organization access
   *
   * @param modifierId - Modifier ID
   * @param organizationId - Organization ID (for security)
   * @returns Modifier document or null
   */
  async findByIdAndOrganization(
    modifierId: string,
    organizationId: string
  ): Promise<ModifierDocument | null> {
    try {
      const doc = await this.findById(modifierId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Modifier ${modifierId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding modifier ${modifierId}:`, error)
      return null
    }
  }

  /**
   * Find all modifiers for a modifier group
   * Used in menu item detail views and POS
   *
   * @param groupId - Modifier group ID
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of modifier documents
   */
  async findByGroupId(
    groupId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<ModifierDocument[]> {
    try {
      const filters = [
        { field: 'modifierGroupId', operator: '==' as const, value: groupId },
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
      console.error(`Error finding modifiers for group ${groupId}:`, error)
      return []
    }
  }

  /**
   * Find available modifiers for a modifier group
   * Used in POS and customer-facing menu
   *
   * @param groupId - Modifier group ID
   * @param organizationId - Organization ID
   * @returns Array of available modifier documents
   */
  async findAvailableByGroupId(
    groupId: string,
    organizationId: string
  ): Promise<ModifierDocument[]> {
    try {
      const filters = [
        { field: 'modifierGroupId', operator: '==' as const, value: groupId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isAvailable', operator: '==' as const, value: true },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: [{ field: 'displayOrder', direction: 'asc' as const }],
      })
    } catch (error) {
      console.error(
        `Error finding available modifiers for group ${groupId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find modifiers by IDs (for order lookups)
   * Used when retrieving pricing for specific modifiers
   *
   * @param modifierIds - Array of modifier IDs
   * @param organizationId - Organization ID
   * @returns Map of modifier documents by ID
   */
  async findByIds(
    modifierIds: string[],
    organizationId: string
  ): Promise<Map<string, ModifierDocument>> {
    try {
      if (modifierIds.length === 0) return new Map()

      const modifiers = await this.findMany({
        filters: [
          { field: 'id', operator: 'in', value: modifierIds },
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
      })

      const map = new Map<string, ModifierDocument>()
      modifiers.forEach((modifier) => map.set(modifier.id, modifier))
      return map
    } catch (error) {
      console.error(`Error finding modifiers by IDs:`, error)
      return new Map()
    }
  }

  /**
   * Count modifiers for a modifier group
   * Used for analytics
   *
   * @param groupId - Modifier group ID
   * @param organizationId - Organization ID
   * @returns Count of modifiers
   */
  async countByGroupId(
    groupId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const filters = [
        { field: 'modifierGroupId', operator: '==' as const, value: groupId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.count({ filters })
    } catch (error) {
      console.error(`Error counting modifiers for group ${groupId}:`, error)
      return 0
    }
  }

  /**
   * Update modifier price
   *
   * @param modifierId - Modifier ID
   * @param priceModifier - New price modifier
   * @param userId - User performing the update
   * @returns Update result
   */
  async updatePrice(
    modifierId: string,
    priceModifier: number,
    userId: string
  ): Promise<UpdateResult<ModifierDocument>> {
    return await this.update(
      modifierId,
      { priceModifier: priceModifier as any },
      userId
    )
  }

  /**
   * Update modifier availability
   *
   * @param modifierId - Modifier ID
   * @param isAvailable - Availability status
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateAvailability(
    modifierId: string,
    isAvailable: boolean,
    userId: string
  ): Promise<UpdateResult<ModifierDocument>> {
    return await this.update(
      modifierId,
      { isAvailable: isAvailable as any },
      userId
    )
  }

  /**
   * Soft delete modifier
   *
   * @param modifierId - Modifier ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(modifierId: string, userId: string) {
    return await this.delete(modifierId, userId)
  }

  /**
   * Restore soft-deleted modifier
   *
   * @param modifierId - Modifier ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(modifierId: string, userId: string) {
    return await super.restore(modifierId, userId)
  }
}
