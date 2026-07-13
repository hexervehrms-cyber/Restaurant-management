/**
 * Stock Movement Repository
 * Handles all Firestore operations for StockMovement entities
 * Replaces all Prisma stockMovement operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "inventoryMovements"
 * Scope: Branch-scoped (organizationId + restaurantId + branchId)
 */

import { BaseRepository, IRepository } from '.'
import { COLLECTIONS } from '../config/collections'
import {
  BranchScopedDocument,
  QueryOptions,
} from '../types/firestore'
import {
  StockMovementDocument,
  CreateStockMovementPayload,
  UpdateStockMovementPayload,
} from '../types/firestore/inventory'

export type {
  StockMovementDocument,
  CreateStockMovementPayload,
  UpdateStockMovementPayload,
}

/**
 * Stock Movement Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 * Stock movements are immutable audit records (read-only after creation)
 */
export class StockMovementRepository
  extends BaseRepository<StockMovementDocument>
  implements IRepository<StockMovementDocument>
{
  constructor() {
    super(COLLECTIONS.inventoryMovements)
  }

  /**
   * Find stock movement by ID and organization (security check)
   * Prevents cross-organization access
   *
   * @param movementId - Stock movement ID
   * @param organizationId - Organization ID
   * @returns Stock movement document or null
   */
  async findByIdAndOrganization(
    movementId: string,
    organizationId: string
  ): Promise<StockMovementDocument | null> {
    try {
      const doc = await this.findById(movementId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Stock movement ${movementId} does not belong to organization ${organizationId}`
        )
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding stock movement ${movementId}:`, error)
      return null
    }
  }

  /**
   * Find stock movements for an inventory item
   * Used for audit trail and stock history
   *
   * @param inventoryItemId - Inventory item ID
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of stock movement documents
   */
  async findByInventoryItem(
    inventoryItemId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<StockMovementDocument[]> {
    try {
      const filters = [
        { field: 'inventoryItemId', operator: '==' as const, value: inventoryItemId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'createdAt', direction: 'desc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding stock movements for inventory item ${inventoryItemId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find all stock movements for a branch
   * Used in inventory dashboard and reports
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of stock movement documents
   */
  async findByBranch(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<StockMovementDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'createdAt', direction: 'desc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding stock movements for branch ${branchId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find stock movements by type (in/out/adjustment/transfer)
   * Used for movement categorization
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param movementType - Movement type ('in' | 'out' | 'adjustment' | 'transfer')
   * @param options - Optional query options
   * @returns Array of stock movement documents
   */
  async findByType(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    movementType: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<StockMovementDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'movementType', operator: '==' as const, value: movementType },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'createdAt', direction: 'desc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding stock movements by type ${movementType}:`,
        error
      )
      return []
    }
  }

  /**
   * Find stock movements by reference (e.g., PO ID, Order ID)
   * Used for traceability
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param referenceId - Reference ID
   * @param options - Optional query options
   * @returns Array of stock movement documents
   */
  async findByReference(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    referenceId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<StockMovementDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'referenceId', operator: '==' as const, value: referenceId },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'createdAt', direction: 'desc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding stock movements by reference ${referenceId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find stock movements within date range
   * Used for reports and analysis
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param options - Optional query options
   * @returns Array of stock movement documents
   */
  async findByDateRange(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    startDate: Date,
    endDate: Date,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<StockMovementDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'createdAt', operator: '>=' as const, value: startDate },
        { field: 'createdAt', operator: '<=' as const, value: endDate },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'createdAt', direction: 'desc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(`Error finding stock movements by date range:`, error)
      return []
    }
  }

  /**
   * Count stock movements for an inventory item
   *
   * @param inventoryItemId - Inventory item ID
   * @param organizationId - Organization ID
   * @returns Count of stock movements
   */
  async countByInventoryItem(
    inventoryItemId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const filters = [
        { field: 'inventoryItemId', operator: '==' as const, value: inventoryItemId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ]

      return await this.count({ filters })
    } catch (error) {
      console.error(
        `Error counting stock movements for inventory item ${inventoryItemId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Calculate net movement (total in - total out) for an item in date range
   * Used for stock analysis
   *
   * @param inventoryItemId - Inventory item ID
   * @param organizationId - Organization ID
   * @param startDate - Start date (optional)
   * @param endDate - End date (optional)
   * @returns Net movement quantity
   */
  async calculateNetMovement(
    inventoryItemId: string,
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    try {
      const movements = await this.findByInventoryItem(
        inventoryItemId,
        organizationId
      )

      // Filter by date range if provided
      const filtered = movements.filter((movement) => {
        if (startDate && movement.createdAt && movement.createdAt < startDate) return false
        if (endDate && movement.createdAt && movement.createdAt > endDate) return false
        return true
      })

      // Sum up movements based on type
      return filtered.reduce((total, movement) => {
        const qty = typeof movement.quantity === 'number' ? movement.quantity : 0
        if (movement.movementType === 'in') {
          return total + qty
        } else if (movement.movementType === 'out') {
          return total - qty
        }
        return total
      }, 0)
    } catch (error) {
      console.error(`Error calculating net movement:`, error)
      return 0
    }
  }

  /**
   * WARNING: Stock movements are immutable audit records
   * This method should NOT be used in normal workflows
   * Only provided for emergency corrections with proper audit trail
   *
   * @param movementId - Stock movement ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(movementId: string, userId: string) {
    console.warn(
      `WARNING: Soft deleting stock movement ${movementId}. Stock movements should be immutable.`
    )
    return await this.delete(movementId, userId)
  }
}
