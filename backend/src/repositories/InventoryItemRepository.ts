/**
 * Inventory Item Repository
 * Handles all Firestore operations for InventoryItem entities
 * Replaces all Prisma inventoryItem operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "inventoryItems"
 * Scope: Branch-scoped (organizationId + restaurantId + branchId)
 */

import { BaseRepository, IRepository } from '.'
import { COLLECTIONS } from '../config/collections'
import {
  BranchScopedDocument,
  QueryOptions,
  UpdateResult,
} from '../types/firestore'
import {
  InventoryItemDocument,
  CreateInventoryItemPayload,
  UpdateInventoryItemPayload,
} from '../types/firestore/inventory'

export type {
  InventoryItemDocument,
  CreateInventoryItemPayload,
  UpdateInventoryItemPayload,
}

/**
 * Inventory Item Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class InventoryItemRepository
  extends BaseRepository<InventoryItemDocument>
  implements IRepository<InventoryItemDocument>
{
  constructor() {
    super(COLLECTIONS.inventoryItems)
  }

  /**
   * Find inventory item by ID and organization (security check)
   * Prevents cross-organization access
   *
   * @param itemId - Inventory item ID
   * @param organizationId - Organization ID
   * @returns Inventory item document or null
   */
  async findByIdAndOrganization(
    itemId: string,
    organizationId: string
  ): Promise<InventoryItemDocument | null> {
    try {
      const doc = await this.findById(itemId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Inventory item ${itemId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding inventory item ${itemId}:`, error)
      return null
    }
  }

  /**
   * Find all inventory items for a branch
   * Used in inventory management and listing
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of inventory item documents
   */
  async findByBranch(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<InventoryItemDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'itemName', direction: 'asc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding inventory items for branch ${branchId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find inventory items by category
   * Used for category-specific inventory display
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param category - Category name
   * @param options - Optional query options
   * @returns Array of inventory item documents
   */
  async findByCategory(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    category: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<InventoryItemDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'category', operator: '==' as const, value: category },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'itemName', direction: 'asc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding inventory items by category ${category}:`,
        error
      )
      return []
    }
  }

  /**
   * Find inventory items by supplier
   * Used for supplier-specific inventory display
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param supplierId - Supplier ID
   * @param options - Optional query options
   * @returns Array of inventory item documents
   */
  async findBySupplier(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    supplierId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<InventoryItemDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'supplierId', operator: '==' as const, value: supplierId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'itemName', direction: 'asc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding inventory items by supplier ${supplierId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find active inventory items for a branch
   * Used in POS and order processing
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param options - Optional query options
   * @returns Array of active inventory item documents
   */
  async findActiveByBranch(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<InventoryItemDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'status', operator: '==' as const, value: 'active' },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'itemName', direction: 'asc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding active inventory items for branch ${branchId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find inventory items by IDs
   * Used when retrieving pricing for specific items
   *
   * @param itemIds - Array of inventory item IDs
   * @param organizationId - Organization ID
   * @returns Map of inventory item documents by ID
   */
  async findByIds(
    itemIds: string[],
    organizationId: string
  ): Promise<Map<string, InventoryItemDocument>> {
    try {
      if (itemIds.length === 0) return new Map()

      const items = await this.findMany({
        filters: [
          { field: 'id', operator: 'in', value: itemIds },
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
      })

      const map = new Map<string, InventoryItemDocument>()
      items.forEach((item) => map.set(item.id, item))
      return map
    } catch (error) {
      console.error(`Error finding inventory items by IDs:`, error)
      return new Map()
    }
  }

  /**
   * Find inventory items by item code (unique per branch)
   * Used for quick lookup during receiving
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param itemCode - Item code
   * @returns Inventory item document or null
   */
  async findByItemCode(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    itemCode: string
  ): Promise<InventoryItemDocument | null> {
    try {
      const items = await this.findMany({
        filters: [
          { field: 'branchId', operator: '==' as const, value: branchId },
          { field: 'restaurantId', operator: '==' as const, value: restaurantId },
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'itemCode', operator: '==' as const, value: itemCode },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
        limit: 1,
      })

      return items.length > 0 ? items[0] : null
    } catch (error) {
      console.error(`Error finding inventory item by code ${itemCode}:`, error)
      return null
    }
  }

  /**
   * Search inventory items by name or code
   * Used in inventory search functionality
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param searchTerm - Search term
   * @param options - Optional query options
   * @returns Array of matching inventory item documents
   */
  async search(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    searchTerm: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<InventoryItemDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      const allItems = await this.findMany({ filters })

      // Client-side filtering for name and code search
      const searchLower = searchTerm.toLowerCase()
      return allItems.filter(
        (item) =>
          item.itemName.toLowerCase().includes(searchLower) ||
          item.itemCode?.toLowerCase().includes(searchLower)
      )
    } catch (error) {
      console.error(`Error searching inventory items:`, error)
      return []
    }
  }

  /**
   * Count inventory items for a branch
   * Used for analytics
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Count of inventory items
   */
  async countByBranch(
    branchId: string,
    restaurantId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.count({ filters })
    } catch (error) {
      console.error(
        `Error counting inventory items for branch ${branchId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Update inventory item status
   *
   * @param itemId - Inventory item ID
   * @param status - New status ('active' | 'inactive')
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateStatus(
    itemId: string,
    status: string,
    userId: string
  ): Promise<UpdateResult<InventoryItemDocument>> {
    return await this.update(itemId, { status }, userId)
  }

  /**
   * Update inventory item quantity
   *
   * @param itemId - Inventory item ID
   * @param quantityInStock - New quantity
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateQuantity(
    itemId: string,
    quantityInStock: number,
    userId: string
  ): Promise<UpdateResult<InventoryItemDocument>> {
    return await this.update(
      itemId,
      { quantityInStock },
      userId
    )
  }

  /**
   * Update inventory item cost per unit
   *
   * @param itemId - Inventory item ID
   * @param costPerUnit - New cost per unit
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateCostPerUnit(
    itemId: string,
    costPerUnit: number,
    userId: string
  ): Promise<UpdateResult<InventoryItemDocument>> {
    return await this.update(
      itemId,
      { costPerUnit },
      userId
    )
  }

  /**
   * Update inventory item reorder level
   *
   * @param itemId - Inventory item ID
   * @param reorderLevel - New reorder level
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateReorderLevel(
    itemId: string,
    reorderLevel: number,
    userId: string
  ): Promise<UpdateResult<InventoryItemDocument>> {
    return await this.update(
      itemId,
      { reorderLevel },
      userId
    )
  }

  /**
   * Soft delete inventory item
   *
   * @param itemId - Inventory item ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(itemId: string, userId: string) {
    return await this.delete(itemId, userId)
  }

  /**
   * Restore soft-deleted inventory item
   *
   * @param itemId - Inventory item ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(itemId: string, userId: string) {
    return await super.restore(itemId, userId)
  }
}
