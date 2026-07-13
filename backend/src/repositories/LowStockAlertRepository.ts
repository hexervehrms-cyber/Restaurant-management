/**
 * Low Stock Alert Repository
 * Handles all Firestore operations for LowStockAlert entities
 * Replaces all Prisma lowStockAlert operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "lowStockAlerts"
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
  LowStockAlertDocument,
  CreateLowStockAlertPayload,
  UpdateLowStockAlertPayload,
} from '../types/firestore/inventory'

export type {
  LowStockAlertDocument,
  CreateLowStockAlertPayload,
  UpdateLowStockAlertPayload,
}

/**
 * Low Stock Alert Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class LowStockAlertRepository
  extends BaseRepository<LowStockAlertDocument>
  implements IRepository<LowStockAlertDocument>
{
  constructor() {
    super(COLLECTIONS.lowStockAlerts)
  }

  /**
   * Find low stock alert by ID and organization (security check)
   * Prevents cross-organization access
   *
   * @param alertId - Low stock alert ID
   * @param organizationId - Organization ID
   * @returns Low stock alert document or null
   */
  async findByIdAndOrganization(
    alertId: string,
    organizationId: string
  ): Promise<LowStockAlertDocument | null> {
    try {
      const doc = await this.findById(alertId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Low stock alert ${alertId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding low stock alert ${alertId}:`, error)
      return null
    }
  }

  /**
   * Find low stock alerts for an inventory item
   * Used for item-specific alert tracking
   *
   * @param inventoryItemId - Inventory item ID
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of low stock alert documents
   */
  async findByInventoryItem(
    inventoryItemId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<LowStockAlertDocument[]> {
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
        `Error finding low stock alerts for inventory item ${inventoryItemId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find all active low stock alerts for a branch
   * Used in dashboard and sidebar counts
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of low stock alert documents
   */
  async findActiveByBranch(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<LowStockAlertDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'alertStatus', operator: '==' as const, value: 'active' },
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
        `Error finding active low stock alerts for branch ${branchId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find low stock alerts by status
   * Used for alert filtering
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param alertStatus - Alert status ('active' | 'acknowledged' | 'resolved')
   * @param options - Optional query options
   * @returns Array of low stock alert documents
   */
  async findByStatus(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    alertStatus: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<LowStockAlertDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'alertStatus', operator: '==' as const, value: alertStatus },
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
        `Error finding low stock alerts by status ${alertStatus}:`,
        error
      )
      return []
    }
  }

  /**
   * Find all low stock alerts for a branch (including all statuses)
   * Used in alert management
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param options - Optional query options
   * @returns Array of low stock alert documents
   */
  async findByBranch(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<LowStockAlertDocument[]> {
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
        `Error finding low stock alerts for branch ${branchId}:`,
        error
      )
      return []
    }
  }

  /**
   * Find unacknowledged low stock alerts
   * Used for notification and escalation
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param options - Optional query options
   * @returns Array of unacknowledged low stock alert documents
   */
  async findUnacknowledged(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<LowStockAlertDocument[]> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'alertStatus', operator: '==' as const, value: 'active' },
        { field: 'acknowledgedAt', operator: '==' as const, value: null },
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
        `Error finding unacknowledged low stock alerts for branch ${branchId}:`,
        error
      )
      return []
    }
  }

  /**
   * Count active low stock alerts for a branch
   * Used in dashboard and sidebar
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Count of active low stock alerts
   */
  async countActiveByBranch(
    branchId: string,
    restaurantId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const filters = [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'alertStatus', operator: '==' as const, value: 'active' },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.count({ filters })
    } catch (error) {
      console.error(
        `Error counting active low stock alerts for branch ${branchId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Acknowledge a low stock alert
   * Mark as acknowledged by user at specific time
   *
   * @param alertId - Alert ID
   * @param acknowledgedById - User ID acknowledging the alert
   * @param userId - User performing the update
   * @returns Update result
   */
  async acknowledge(
    alertId: string,
    acknowledgedById: string,
    userId: string
  ): Promise<UpdateResult<LowStockAlertDocument>> {
    return await this.update(
      alertId,
      {
        alertStatus: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedById,
      },
      userId
    )
  }

  /**
   * Resolve a low stock alert
   * Mark as resolved when stock is replenished
   *
   * @param alertId - Alert ID
   * @param userId - User performing the update
   * @returns Update result
   */
  async resolve(
    alertId: string,
    userId: string
  ): Promise<UpdateResult<LowStockAlertDocument>> {
    return await this.update(
      alertId,
      {
        alertStatus: 'resolved',
        acknowledgedAt: new Date(),
      },
      userId
    )
  }

  /**
   * Update alert status and current stock information
   *
   * @param alertId - Alert ID
   * @param alertStatus - New status
   * @param currentStock - Current stock level
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateStockInfo(
    alertId: string,
    alertStatus: string,
    currentStock: number,
    userId: string
  ): Promise<UpdateResult<LowStockAlertDocument>> {
    return await this.update(
      alertId,
      {
        alertStatus,
        currentStock,
      },
      userId
    )
  }

  /**
   * Soft delete low stock alert
   *
   * @param alertId - Alert ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(alertId: string, userId: string) {
    return await this.delete(alertId, userId)
  }

  /**
   * Restore soft-deleted low stock alert
   *
   * @param alertId - Alert ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(alertId: string, userId: string) {
    return await super.restore(alertId, userId)
  }
}
