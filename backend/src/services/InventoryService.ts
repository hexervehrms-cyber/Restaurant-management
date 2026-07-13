/**
 * Inventory Service
 * Business logic for inventory operations
 * Uses repositories for Firestore data access
 *
 * RESPONSIBILITIES:
 * - Inventory item management (CRUD)
 * - Stock tracking and movements
 * - Low stock alert management
 * - Reorder level management
 */

import {
  InventoryItemRepository,
  InventoryItemDocument,
  CreateInventoryItemPayload,
  UpdateInventoryItemPayload,
} from '../repositories/InventoryItemRepository'
import {
  SupplierRepository,
  SupplierDocument,
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from '../repositories/SupplierRepository'
import {
  StockMovementRepository,
  StockMovementDocument,
  CreateStockMovementPayload,
} from '../repositories/StockMovementRepository'
import {
  StockAdjustmentRepository,
  StockAdjustmentDocument,
  CreateStockAdjustmentPayload,
} from '../repositories/StockAdjustmentRepository'
import {
  LowStockAlertRepository,
  LowStockAlertDocument,
  CreateLowStockAlertPayload,
} from '../repositories/LowStockAlertRepository'
import {
  PurchaseOrderRepository,
  PurchaseOrderDocument,
  CreatePurchaseOrderPayload,
} from '../repositories/PurchaseOrderRepository'
import {
  PurchaseOrderItemRepository,
  PurchaseOrderItemDocument,
  CreatePurchaseOrderItemPayload,
} from '../repositories/PurchaseOrderItemRepository'
import { CreateResult, UpdateResult, DeleteResult } from '../types/firestore'

/**
 * Inventory Service
 * Orchestrates inventory operations using repositories
 */
export class InventoryService {
  private inventoryItemRepository: InventoryItemRepository
  private supplierRepository: SupplierRepository
  private stockMovementRepository: StockMovementRepository
  private stockAdjustmentRepository: StockAdjustmentRepository
  private lowStockAlertRepository: LowStockAlertRepository
  private purchaseOrderRepository: PurchaseOrderRepository
  private purchaseOrderItemRepository: PurchaseOrderItemRepository

  constructor() {
    this.inventoryItemRepository = new InventoryItemRepository()
    this.supplierRepository = new SupplierRepository()
    this.stockMovementRepository = new StockMovementRepository()
    this.stockAdjustmentRepository = new StockAdjustmentRepository()
    this.lowStockAlertRepository = new LowStockAlertRepository()
    this.purchaseOrderRepository = new PurchaseOrderRepository()
    this.purchaseOrderItemRepository = new PurchaseOrderItemRepository()
  }

  // ============================================================================
  // INVENTORY ITEM OPERATIONS
  // ============================================================================

  /**
   * Create a new inventory item
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param data - Inventory item data
   * @param userId - User creating the item
   * @returns Created inventory item or error
   */
  async createInventoryItem(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    data: Omit<CreateInventoryItemPayload, 'branchId' | 'restaurantId' | 'organizationId'>,
    userId: string
  ): Promise<CreateResult<InventoryItemDocument>> {
    try {
      const payload: CreateInventoryItemPayload = {
        ...data,
        branchId,
        restaurantId,
        organizationId,
      }

      return await this.inventoryItemRepository.create(payload, userId, organizationId)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Get all inventory items for a branch
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Array of inventory items
   */
  async getInventoryItemsByBranch(
    branchId: string,
    restaurantId: string,
    organizationId: string
  ): Promise<InventoryItemDocument[]> {
    return this.inventoryItemRepository.findByBranch(
      branchId,
      restaurantId,
      organizationId
    )
  }

  /**
   * Get inventory item by ID with security check
   *
   * @param itemId - Item ID
   * @param organizationId - Organization ID
   * @returns Inventory item or null
   */
  async getInventoryItem(
    itemId: string,
    organizationId: string
  ): Promise<InventoryItemDocument | null> {
    return this.inventoryItemRepository.findByIdAndOrganization(itemId, organizationId)
  }

  /**
   * Update inventory item
   *
   * @param itemId - Item ID
   * @param updates - Updates to apply
   * @param userId - User performing update
   * @returns Updated item or error
   */
  async updateInventoryItem(
    itemId: string,
    updates: UpdateInventoryItemPayload,
    userId: string
  ): Promise<UpdateResult<InventoryItemDocument>> {
    return this.inventoryItemRepository.update(itemId, updates, userId)
  }

  /**
   * Delete inventory item (soft delete)
   *
   * @param itemId - Item ID
   * @param userId - User performing delete
   * @returns Delete result
   */
  async deleteInventoryItem(itemId: string, userId: string): Promise<DeleteResult> {
    return this.inventoryItemRepository.delete(itemId, userId)
  }

  /**
   * Search inventory items
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param searchTerm - Search term
   * @returns Array of matching items
   */
  async searchInventoryItems(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    searchTerm: string
  ): Promise<InventoryItemDocument[]> {
    return this.inventoryItemRepository.search(
      branchId,
      restaurantId,
      organizationId,
      searchTerm
    )
  }

  // ============================================================================
  // LOW STOCK ALERT OPERATIONS
  // ============================================================================

  /**
   * Get active low stock alerts for a branch
   * Used in dashboard and sidebar metrics
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Array of active low stock alerts
   */
  async getActiveLowStockAlerts(
    branchId: string,
    restaurantId: string,
    organizationId: string
  ): Promise<LowStockAlertDocument[]> {
    return this.lowStockAlertRepository.findActiveByBranch(
      branchId,
      restaurantId,
      organizationId
    )
  }

  /**
   * Count active low stock alerts for a branch
   * Used in dashboard sidebar badge
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Count of active alerts
   */
  async countActiveLowStockAlerts(
    branchId: string,
    restaurantId: string,
    organizationId: string
  ): Promise<number> {
    return this.lowStockAlertRepository.countActiveByBranch(
      branchId,
      restaurantId,
      organizationId
    )
  }

  /**
   * Create a low stock alert
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param data - Alert data
   * @param userId - User creating alert
   * @returns Created alert or error
   */
  async createLowStockAlert(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    data: Omit<CreateLowStockAlertPayload, 'branchId' | 'restaurantId' | 'organizationId'>,
    userId: string
  ): Promise<CreateResult<LowStockAlertDocument>> {
    try {
      const payload: CreateLowStockAlertPayload = {
        ...data,
        branchId,
        restaurantId,
        organizationId,
      }

      return await this.lowStockAlertRepository.create(payload, userId, organizationId)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Acknowledge a low stock alert
   *
   * @param alertId - Alert ID
   * @param acknowledgedById - User acknowledging
   * @param userId - User performing update
   * @returns Result
   */
  async acknowledgeLowStockAlert(
    alertId: string,
    acknowledgedById: string,
    userId: string
  ): Promise<UpdateResult<LowStockAlertDocument>> {
    return this.lowStockAlertRepository.acknowledge(alertId, acknowledgedById, userId)
  }

  /**
   * Resolve a low stock alert
   *
   * @param alertId - Alert ID
   * @param userId - User performing update
   * @returns Result
   */
  async resolveLowStockAlert(
    alertId: string,
    userId: string
  ): Promise<UpdateResult<LowStockAlertDocument>> {
    return this.lowStockAlertRepository.resolve(alertId, userId)
  }

  // ============================================================================
  // SUPPLIER OPERATIONS
  // ============================================================================

  /**
   * Get all suppliers for a restaurant
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Array of suppliers
   */
  async getSuppliersByRestaurant(
    restaurantId: string,
    organizationId: string
  ): Promise<SupplierDocument[]> {
    return this.supplierRepository.findByRestaurant(restaurantId, organizationId)
  }

  /**
   * Get supplier by ID
   *
   * @param supplierId - Supplier ID
   * @param organizationId - Organization ID
   * @returns Supplier or null
   */
  async getSupplier(
    supplierId: string,
    organizationId: string
  ): Promise<SupplierDocument | null> {
    return this.supplierRepository.findByIdAndOrganization(supplierId, organizationId)
  }

  /**
   * Create a new supplier
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param data - Supplier data
   * @param userId - User creating supplier
   * @returns Created supplier or error
   */
  async createSupplier(
    restaurantId: string,
    organizationId: string,
    data: Omit<CreateSupplierPayload, 'restaurantId' | 'organizationId'>,
    userId: string
  ): Promise<CreateResult<SupplierDocument>> {
    try {
      const payload: CreateSupplierPayload = {
        ...data,
        restaurantId,
        organizationId,
      }

      return await this.supplierRepository.create(payload, userId, organizationId)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Update supplier
   *
   * @param supplierId - Supplier ID
   * @param updates - Updates to apply
   * @param userId - User performing update
   * @returns Updated supplier or error
   */
  async updateSupplier(
    supplierId: string,
    updates: UpdateSupplierPayload,
    userId: string
  ): Promise<UpdateResult<SupplierDocument>> {
    return this.supplierRepository.update(supplierId, updates, userId)
  }

  /**
   * Delete supplier (soft delete)
   *
   * @param supplierId - Supplier ID
   * @param userId - User performing delete
   * @returns Delete result
   */
  async deleteSupplier(supplierId: string, userId: string): Promise<DeleteResult> {
    return this.supplierRepository.delete(supplierId, userId)
  }

  // ============================================================================
  // STOCK MOVEMENT OPERATIONS
  // ============================================================================

  /**
   * Record a stock movement
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param data - Movement data
   * @param userId - User recording movement
   * @returns Created movement or error
   */
  async recordStockMovement(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    data: Omit<CreateStockMovementPayload, 'branchId' | 'restaurantId' | 'organizationId'>,
    userId: string
  ): Promise<CreateResult<StockMovementDocument>> {
    try {
      const payload: CreateStockMovementPayload = {
        ...data,
        branchId,
        restaurantId,
        organizationId,
      }

      return await this.stockMovementRepository.create(payload, userId, organizationId)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Get stock movements for an item
   *
   * @param inventoryItemId - Item ID
   * @param organizationId - Organization ID
   * @returns Array of stock movements
   */
  async getStockMovementsForItem(
    inventoryItemId: string,
    organizationId: string
  ): Promise<StockMovementDocument[]> {
    return this.stockMovementRepository.findByInventoryItem(inventoryItemId, organizationId)
  }

  // ============================================================================
  // STOCK ADJUSTMENT OPERATIONS
  // ============================================================================

  /**
   * Record a stock adjustment
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param data - Adjustment data
   * @param userId - User recording adjustment
   * @returns Created adjustment or error
   */
  async recordStockAdjustment(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    data: Omit<CreateStockAdjustmentPayload, 'branchId' | 'restaurantId' | 'organizationId'>,
    userId: string
  ): Promise<CreateResult<StockAdjustmentDocument>> {
    try {
      const payload: CreateStockAdjustmentPayload = {
        ...data,
        branchId,
        restaurantId,
        organizationId,
      }

      return await this.stockAdjustmentRepository.create(payload, userId, organizationId)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Get stock adjustments for an item
   *
   * @param inventoryItemId - Item ID
   * @param organizationId - Organization ID
   * @returns Array of stock adjustments
   */
  async getStockAdjustmentsForItem(
    inventoryItemId: string,
    organizationId: string
  ): Promise<StockAdjustmentDocument[]> {
    return this.stockAdjustmentRepository.findByInventoryItem(inventoryItemId, organizationId)
  }

  // ============================================================================
  // PURCHASE ORDER OPERATIONS
  // ============================================================================

  /**
   * Get all purchase orders for a branch
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @returns Array of purchase orders
   */
  async getPurchaseOrdersByBranch(
    branchId: string,
    restaurantId: string,
    organizationId: string
  ): Promise<PurchaseOrderDocument[]> {
    return this.purchaseOrderRepository.findByBranch(branchId, restaurantId, organizationId)
  }

  /**
   * Get purchase order by ID
   *
   * @param poId - PO ID
   * @param organizationId - Organization ID
   * @returns Purchase order or null
   */
  async getPurchaseOrder(
    poId: string,
    organizationId: string
  ): Promise<PurchaseOrderDocument | null> {
    return this.purchaseOrderRepository.findByIdAndOrganization(poId, organizationId)
  }

  /**
   * Create a new purchase order
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param data - PO data
   * @param userId - User creating PO
   * @returns Created PO or error
   */
  async createPurchaseOrder(
    branchId: string,
    restaurantId: string,
    organizationId: string,
    data: Omit<CreatePurchaseOrderPayload, 'branchId' | 'restaurantId' | 'organizationId'>,
    userId: string
  ): Promise<CreateResult<PurchaseOrderDocument>> {
    try {
      const payload: CreatePurchaseOrderPayload = {
        ...data,
        branchId,
        restaurantId,
        organizationId,
        createdById: userId,
      }

      return await this.purchaseOrderRepository.create(payload, userId, organizationId)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get error message from error object
   */
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    return 'Unknown error occurred'
  }
}
