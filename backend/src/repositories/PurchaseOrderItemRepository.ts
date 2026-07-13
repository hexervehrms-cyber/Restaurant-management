/**
 * Purchase Order Item Repository
 * Handles all Firestore operations for PurchaseOrderItem entities
 * Replaces all Prisma purchaseOrderItem operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "purchaseOrderItems"
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
  PurchaseOrderItemDocument,
  CreatePurchaseOrderItemPayload,
  UpdatePurchaseOrderItemPayload,
} from '../types/firestore/inventory'

export type {
  PurchaseOrderItemDocument,
  CreatePurchaseOrderItemPayload,
  UpdatePurchaseOrderItemPayload,
}

/**
 * Purchase Order Item Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class PurchaseOrderItemRepository
  extends BaseRepository<PurchaseOrderItemDocument>
  implements IRepository<PurchaseOrderItemDocument>
{
  constructor() {
    super(COLLECTIONS.purchaseOrderItems)
  }

  /**
   * Find purchase order item by ID and organization (security check)
   * Prevents cross-organization access
   *
   * @param poItemId - Purchase order item ID
   * @param organizationId - Organization ID
   * @returns Purchase order item document or null
   */
  async findByIdAndOrganization(
    poItemId: string,
    organizationId: string
  ): Promise<PurchaseOrderItemDocument | null> {
    try {
      const doc = await this.findById(poItemId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Purchase order item ${poItemId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding purchase order item ${poItemId}:`, error)
      return null
    }
  }

  /**
   * Find all purchase order items for a purchase order
   * Used in PO line item management
   *
   * @param purchaseOrderId - Purchase order ID
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of purchase order item documents
   */
  async findByPurchaseOrder(
    purchaseOrderId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<PurchaseOrderItemDocument[]> {
    try {
      const filters = [
        { field: 'purchaseOrderId', operator: '==' as const, value: purchaseOrderId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'createdAt', direction: 'asc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding purchase order items for PO ${purchaseOrderId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find purchase order items for a specific inventory item
   * Used for supplier/item tracking
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param inventoryItemId - Inventory item ID
   * @param options - Optional query options
   * @returns Array of purchase order item documents
   */
  async findByInventoryItem(
    restaurantId: string,
    organizationId: string,
    inventoryItemId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<PurchaseOrderItemDocument[]> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'inventoryItemId', operator: '==' as const, value: inventoryItemId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'createdAt', direction: 'desc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding purchase order items for inventory item ${inventoryItemId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find purchase order items where quantityReceived < quantityOrdered
   * Used for receiving workflow to identify pending items
   *
   * @param purchaseOrderId - Purchase order ID
   * @param organizationId - Organization ID
   * @param options - Optional query options
   * @returns Array of partially received purchase order item documents
   */
  async findPendingReceived(
    purchaseOrderId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<PurchaseOrderItemDocument[]> {
    try {
      const items = await this.findByPurchaseOrder(
        purchaseOrderId,
        organizationId,
        options
      )

      // Filter items where quantityReceived < quantityOrdered
      return items.filter((item) => {
        const ordered = typeof item.quantityOrdered === 'number' ? item.quantityOrdered : 0
        const received = typeof item.quantityReceived === 'number' ? item.quantityReceived : 0
        return received < ordered
      })
    } catch (error) {
      console.error(
        `Error finding pending received items for PO ${purchaseOrderId}:`,
        error
      )
      return []
    }
  }

  /**
   * Count purchase order items for a purchase order
   *
   * @param purchaseOrderId - Purchase order ID
   * @param organizationId - Organization ID
   * @returns Count of purchase order items
   */
  async countByPurchaseOrder(
    purchaseOrderId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const filters = [
        { field: 'purchaseOrderId', operator: '==' as const, value: purchaseOrderId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.count({ filters })
    } catch (error) {
      console.error(
        `Error counting purchase order items for PO ${purchaseOrderId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Calculate total line amount for a purchase order item
   * lineTotal = quantityOrdered * unitCost
   *
   * @param poItemId - Purchase order item ID
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateLineTotal(
    poItemId: string,
    userId: string
  ): Promise<UpdateResult<PurchaseOrderItemDocument>> {
    try {
      const item = await this.findById(poItemId)
      if (!item) {
        return {
          success: false,
          error: 'Purchase order item not found',
        }
      }

      const quantityOrdered = typeof item.quantityOrdered === 'number' ? item.quantityOrdered : 0
      const unitCost = typeof item.unitCost === 'number' ? item.unitCost : 0
      const lineTotal = quantityOrdered * unitCost

      return await this.update(
        poItemId,
        { lineTotal },
        userId
      )
    } catch (error) {
      console.error(`Error updating line total for PO item ${poItemId}:`, error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Update quantity received for a purchase order item
   * Used in goods receiving workflow
   *
   * @param poItemId - Purchase order item ID
   * @param quantityReceived - Quantity received
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateQuantityReceived(
    poItemId: string,
    quantityReceived: number,
    userId: string
  ): Promise<UpdateResult<PurchaseOrderItemDocument>> {
    return await this.update(
      poItemId,
      { quantityReceived },
      userId
    )
  }

  /**
   * Soft delete purchase order item
   *
   * @param poItemId - Purchase order item ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(poItemId: string, userId: string) {
    return await this.delete(poItemId, userId)
  }

  /**
   * Restore soft-deleted purchase order item
   *
   * @param poItemId - Purchase order item ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(poItemId: string, userId: string) {
    return await super.restore(poItemId, userId)
  }

  /**
   * Helper to get error message
   */
  protected getErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    return 'Unknown error occurred'
  }
}
