/**
 * Menu Variant Repository
 * Handles all Firestore operations for MenuVariant entities
 * Replaces all Prisma menuItemVariant operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "menuVariants"
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import {
  BaseDocument,
  QueryOptions,
  UpdateResult,
} from '../types/firestore'

/**
 * Menu Variant Document Schema (Firestore)
 */
export interface MenuVariantDocument extends BaseDocument {
  menuItemId: string
  name: string
  sizeUnit?: string | null
  priceModifier: number
  isDefault: boolean
  displayOrder: number
}

/**
 * Menu Variant Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class MenuVariantRepository extends BaseRepository<MenuVariantDocument> {
  constructor() {
    super(COLLECTIONS.menuVariants)
  }

  /**
   * Find variant by ID and organization
   * Secure lookup to prevent cross-organization access
   *
   * @param variantId - Variant ID
   * @param organizationId - Organization ID (for security)
   * @returns Variant document or null
   */
  async findByIdAndOrganization(
    variantId: string,
    organizationId: string
  ): Promise<MenuVariantDocument | null> {
    try {
      const doc = await this.findById(variantId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Variant ${variantId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding variant ${variantId}:`, error)
      return null
    }
  }

  /**
   * Find all variants for a menu item
   * Used in menu item detail views
   *
   * @param menuItemId - Menu item ID
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of variant documents
   */
  async findByMenuItemId(
    menuItemId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<MenuVariantDocument[]> {
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
        `Error finding variants for menu item ${menuItemId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find default variant for a menu item
   * Used when no specific variant is selected
   *
   * @param menuItemId - Menu item ID
   * @param organizationId - Organization ID
   * @returns Default variant document or null
   */
  async findDefaultByMenuItemId(
    menuItemId: string,
    organizationId: string
  ): Promise<MenuVariantDocument | null> {
    try {
      const variants = await this.findByMenuItemId(menuItemId, organizationId)
      return variants.find((v) => v.isDefault) || variants[0] || null
    } catch (error) {
      console.error(
        `Error finding default variant for menu item ${menuItemId}:`,
        error
      )
      return null
    }
  }

  /**
   * Find variants by IDs (for order lookups)
   * Used when retrieving pricing for specific variants
   *
   * @param variantIds - Array of variant IDs
   * @param organizationId - Organization ID
   * @returns Map of variant documents by ID
   */
  async findByIds(
    variantIds: string[],
    organizationId: string
  ): Promise<Map<string, MenuVariantDocument>> {
    try {
      if (variantIds.length === 0) return new Map()

      const variants = await this.findMany({
        filters: [
          { field: 'id', operator: 'in', value: variantIds },
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
      })

      const map = new Map<string, MenuVariantDocument>()
      variants.forEach((variant) => map.set(variant.id, variant))
      return map
    } catch (error) {
      console.error(`Error finding variants by IDs:`, error)
      return new Map()
    }
  }

  /**
   * Count variants for a menu item
   * Used for analytics
   *
   * @param menuItemId - Menu item ID
   * @param organizationId - Organization ID
   * @returns Count of variants
   */
  async countByMenuItemId(
    menuItemId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const filters = [
        { field: 'menuItemId', operator: '==' as const, value: menuItemId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.count({ filters })
    } catch (error) {
      console.error(
        `Error counting variants for menu item ${menuItemId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Update variant price modifier
   *
   * @param variantId - Variant ID
   * @param priceModifier - New price modifier
   * @param userId - User performing the update
   * @returns Update result
   */
  async updatePriceModifier(
    variantId: string,
    priceModifier: number,
    userId: string
  ): Promise<UpdateResult<MenuVariantDocument>> {
    return await this.update(
      variantId,
      { priceModifier: priceModifier as any },
      userId
    )
  }

  /**
   * Set variant as default
   *
   * @param variantId - Variant ID
   * @param userId - User performing the update
   * @returns Update result
   */
  async setAsDefault(
    variantId: string,
    userId: string
  ): Promise<UpdateResult<MenuVariantDocument>> {
    return await this.update(variantId, { isDefault: true as any }, userId)
  }

  /**
   * Soft delete variant
   *
   * @param variantId - Variant ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(variantId: string, userId: string) {
    return await this.delete(variantId, userId)
  }

  /**
   * Restore soft-deleted variant
   *
   * @param variantId - Variant ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(variantId: string, userId: string) {
    return await super.restore(variantId, userId)
  }
}
