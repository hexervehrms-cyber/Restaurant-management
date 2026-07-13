/**
 * Stock Adjustment Repository
 * Handles all Firestore operations for StockAdjustment entities
 * Replaces all Prisma stockAdjustment operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "stockAdjustments"
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
  StockAdjustmentDocument,
  CreateStockAdjustmentPayload,
  UpdateStockAdjustmentPayload,
} from '../types/firestore/inventory'

export type {
  StockAdjustmentDocument,
  CreateStockAdjustmentPayload,
  UpdateStockAdjustmentPayload,
}

/**
 * Stock Adjustment Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class StockAdjustmentRepository
  extends BaseRepository<StockAdjustmentDocument>
  implements IRepository<StockAdjustmentDocument>
{
  constructor() {
    super(COLLECTIONS.stockAdjustments)
  }

  /**
   * Find stock adjustment by ID and organization (security check)
   * Prevents cross-organization access
   *
   * @param adjustmentId - Stock adjustment ID
   * @param organizationId - Organization ID
   * @returns Stock adjustment document or null
   */
  async findByIdAndOrganization(
    adjustmentId: string,
    organizationId: string
  ): Promise<StockAdjustmentDocument | null> {
    try {
      const doc = await this.findById(adjustmentId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Stock adjustment ${adjustmentId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding stock adjustment ${adjustmentId}:`, error)
      return null
    }
  }

  /**
   * Find stock adjustments for an inventory item
   * Used for adjustment history
   *
   * @param inventoryItemId - Inventory item ID
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of stock adjustment documents
   */
  async findByInventoryItem(
    inventoryItemId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<StockAdjustmentDocument[]> {
    try {
      const filters = [
        { field: 'inventoryItemId', operator: '==' as const, value: inventoryItemId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
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
        `Error finding stock adjustments for inventory item ${inventoryItemId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find all stock adjustments for a branch
   * Used in adjustment management and reports
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of stock adjustment documents
   */
  async findByBranch(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<StockAdjustmentDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
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
        `Error finding stock adjustments for branch ${branchId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find stock adjustments by type (add/deduct/correction)
   * Used for adjustment categorization
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param adjustmentType - Adjustment type ('add' | 'deduct' | 'correction')
   * @param options - Optional query options
   * @returns Array of stock adjustment documents
   */
  async findByType(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    adjustmentType: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<StockAdjustmentDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'adjustmentType', operator: '==' as const, value: adjustmentType },
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
        `Error finding stock adjustments by type ${adjustmentType}:`,
        error
      )
      return []
    }
  }

  /**
   * Find stock adjustments by reason
   * Used for reason analysis
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param reason - Adjustment reason
   * @param options - Optional query options
   * @returns Array of stock adjustment documents
   */
  async findByReason(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    reason: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<StockAdjustmentDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'reason', operator: '==' as const, value: reason },
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
        `Error finding stock adjustments by reason ${reason}:`,
        error
      )
      return []
    }
  }

  /**
   * Find stock adjustments within date range
   * Used for reports and analysis
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param options - Optional query options
   * @returns Array of stock adjustment documents
   */
  async findByDateRange(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    startDate: Date,
    endDate: Date,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<StockAdjustmentDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'createdAt', operator: '>=' as const, value: startDate },
        { field: 'createdAt', operator: '<=' as const, value: endDate },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'createdAt', direction: 'desc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(`Error finding stock adjustments by date range:`, error)
      return []
    }
  }

  /**
   * Count stock adjustments for an inventory item
   *
   * @param inventoryItemId - Inventory item ID
   * @param organizationId - Organization ID
   * @returns Count of stock adjustments
   */
  async countByInventoryItem(
    inventoryItemId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const filters = [
        { field: 'inventoryItemId', operator: '==' as const, value: inventoryItemId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.count({ filters })
    } catch (error) {
      console.error(
        `Error counting stock adjustments for inventory item ${inventoryItemId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Calculate total adjustment amount for an item
   * Used for adjustment analysis
   *
   * @param inventoryItemId - Inventory item ID
   * @param organizationId - Organization ID
   * @returns Total adjusted quantity (positive for adds, negative for deducts)
   */
  async calculateTotalAdjustment(
    inventoryItemId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const adjustments = await this.findByInventoryItem(
        inventoryItemId,
        organizationId
      )

      return adjustments.reduce((total, adjustment) => {
        const qty = typeof adjustment.quantityAdjusted === 'number' ? adjustment.quantityAdjusted : 0
        if (adjustment.adjustmentType === 'add') {
          return total + qty
        } else if (adjustment.adjustmentType === 'deduct') {
          return total - qty
        }
        return total
      }, 0)
    } catch (error) {
      console.error(`Error calculating total adjustment:`, error)
      return 0
    }
  }

  /**
   * Update stock adjustment reason and notes
   * Adjustments cannot be modified after creation, but notes can be added
   *
   * @param adjustmentId - Stock adjustment ID
   * @param updates - Updates (reason, notes, etc.)
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateNotes(
    adjustmentId: string,
    updates: Partial<{
      reason: string
      notes: string
      referenceDocument: string
    }>,
    userId: string
  ): Promise<UpdateResult<StockAdjustmentDocument>> {
    return await this.update(adjustmentId, updates, userId)
  }

  /**
   * Soft delete stock adjustment
   * NOTE: Deleting adjustments affects stock reconciliation
   * Use with caution and proper audit trail
   *
   * @param adjustmentId - Stock adjustment ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(adjustmentId: string, userId: string) {
    return await this.delete(adjustmentId, userId)
  }

  /**
   * Restore soft-deleted stock adjustment
   *
   * @param adjustmentId - Stock adjustment ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(adjustmentId: string, userId: string) {
    return await super.restore(adjustmentId, userId)
  }
}
