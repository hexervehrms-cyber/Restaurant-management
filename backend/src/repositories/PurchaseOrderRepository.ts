/**
 * Purchase Order Repository
 * Handles all Firestore operations for PurchaseOrder entities
 * Replaces all Prisma purchaseOrder operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "purchaseOrders"
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
  PurchaseOrderDocument,
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
} from '../types/firestore/inventory'

export type {
  PurchaseOrderDocument,
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
}

/**
 * Purchase Order Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class PurchaseOrderRepository
  extends BaseRepository<PurchaseOrderDocument>
  implements IRepository<PurchaseOrderDocument>
{
  constructor() {
    super(COLLECTIONS.purchaseOrders)
  }

  /**
   * Find purchase order by ID and organization (security check)
   * Prevents cross-organization access
   *
   * @param poId - Purchase order ID
   * @param organizationId - Organization ID
   * @returns Purchase order document or null
   */
  async findByIdAndOrganization(
    poId: string,
    organizationId: string
  ): Promise<PurchaseOrderDocument | null> {
    try {
      const doc = await this.findById(poId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Purchase order ${poId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding purchase order ${poId}:`, error)
      return null
    }
  }

  /**
   * Find all purchase orders for a branch
   * Used in PO management and listing
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of purchase order documents
   */
  async findByBranch(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<PurchaseOrderDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'poDate', direction: 'desc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding purchase orders for branch ${branchId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find purchase orders by supplier
   * Used for supplier-specific PO display
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param supplierId - Supplier ID
   * @param options - Optional query options
   * @returns Array of purchase order documents
   */
  async findBySupplier(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    supplierId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<PurchaseOrderDocument[]> {
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
        orders: options?.orders || [{ field: 'poDate', direction: 'desc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding purchase orders by supplier ${supplierId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find purchase orders by status
   * Used for workflow status filtering
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param status - PO status ('pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled')
   * @param options - Optional query options
   * @returns Array of purchase order documents
   */
  async findByStatus(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    status: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<PurchaseOrderDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'status', operator: '==' as const, value: status },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'poDate', direction: 'desc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(
        `Error finding purchase orders by status ${status}:`,
        error
      )
      return []
    }
  }

  /**
   * Find purchase order by PO number (unique per branch)
   * Used for quick lookup during receiving
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param poNumber - PO number
   * @returns Purchase order document or null
   */
  async findByPoNumber(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    poNumber: string
  ): Promise<PurchaseOrderDocument | null> {
    try {
      const pos = await this.findMany({
        filters: [
          { field: 'branchId', operator: '==' as const, value: branchId },
          { field: 'restaurantId', operator: '==' as const, value: restaurantId },
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'poNumber', operator: '==' as const, value: poNumber },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
        limit: 1,
      })

      return pos.length > 0 ? pos[0] : null
    } catch (error) {
      console.error(`Error finding purchase order by PO number ${poNumber}:`, error)
      return null
    }
  }

  /**
   * Find purchase orders by date range
   * Used for report generation
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param options - Optional query options
   * @returns Array of purchase order documents
   */
  async findByDateRange(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    startDate: Date,
    endDate: Date,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<PurchaseOrderDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'poDate', operator: '>=' as const, value: startDate },
        { field: 'poDate', operator: '<=' as const, value: endDate },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders || [{ field: 'poDate', direction: 'desc' as const }],
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(`Error finding purchase orders by date range:`, error)
      return []
    }
  }

  /**
   * Count purchase orders for a branch
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Count of purchase orders
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
        `Error counting purchase orders for branch ${branchId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Update purchase order status
   *
   * @param poId - Purchase order ID
   * @param status - New status
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateStatus(
    poId: string,
    status: string,
    userId: string
  ): Promise<UpdateResult<PurchaseOrderDocument>> {
    return await this.update(poId, { status }, userId)
  }

  /**
   * Update purchase order with delivery date and status
   *
   * @param poId - Purchase order ID
   * @param actualDeliveryDate - Actual delivery date
   * @param status - New status
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateDeliveryInfo(
    poId: string,
    actualDeliveryDate: Date,
    status: string,
    userId: string
  ): Promise<UpdateResult<PurchaseOrderDocument>> {
    return await this.update(
      poId,
      { actualDeliveryDate, status },
      userId
    )
  }

  /**
   * Update purchase order total amount
   *
   * @param poId - Purchase order ID
   * @param totalAmount - New total amount
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateTotalAmount(
    poId: string,
    totalAmount: number,
    userId: string
  ): Promise<UpdateResult<PurchaseOrderDocument>> {
    return await this.update(
      poId,
      { totalAmount },
      userId
    )
  }

  /**
   * Soft delete purchase order
   *
   * @param poId - Purchase order ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(poId: string, userId: string) {
    return await this.delete(poId, userId)
  }

  /**
   * Restore soft-deleted purchase order
   *
   * @param poId - Purchase order ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(poId: string, userId: string) {
    return await super.restore(poId, userId)
  }
}
