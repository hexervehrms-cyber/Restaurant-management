/**
 * Inventory Module Firestore Types
 * Defines all document interfaces for Inventory operations
 * 
 * Documents:
 * - InventoryItemDocument: Main inventory item tracking
 * - SupplierDocument: Supplier master data
 * - PurchaseOrderDocument: Purchase order header
 * - PurchaseOrderItemDocument: Purchase order line items
 * - StockMovementDocument: Audit trail of stock changes
 * - StockAdjustmentDocument: Manual inventory adjustments
 * - LowStockAlertDocument: Low stock alerts
 */

import {
  BranchScopedDocument,
  RestaurantScopedDocument,
  FirestoreNumeric,
  FirestoreTimestamp,
} from '.'

// ============================================================================
// INVENTORY ITEM DOCUMENT
// ============================================================================

/**
 * Inventory Item Document
 * Scope: Branch-scoped (organizationId + restaurantId + branchId)
 * Collection: inventoryItems
 * 
 * Represents a physical inventory item with stock tracking
 */
export interface InventoryItemDocument extends BranchScopedDocument {
  // Item Information
  itemName: string
  itemCode?: string | null
  category?: string | null
  unitOfMeasure?: string | null

  // Stock Information
  quantityInStock: FirestoreNumeric
  reorderLevel?: FirestoreNumeric | null
  costPerUnit?: FirestoreNumeric | null

  // Supplier Reference
  supplierId?: string | null

  // Status & Tracking
  status: string // 'active' | 'inactive'
  lastCountedAt?: FirestoreTimestamp | null
}

/**
 * Create Inventory Item Payload
 */
export interface CreateInventoryItemPayload
  extends Omit<InventoryItemDocument, keyof BranchScopedDocument> {}

/**
 * Update Inventory Item Payload
 */
export interface UpdateInventoryItemPayload extends Partial<CreateInventoryItemPayload> {}

// ============================================================================
// SUPPLIER DOCUMENT
// ============================================================================

/**
 * Supplier Document
 * Scope: Restaurant-scoped (organizationId + restaurantId)
 * Collection: suppliers
 * 
 * Represents a supplier of inventory items
 */
export interface SupplierDocument extends RestaurantScopedDocument {
  // Supplier Information
  supplierName: string
  contactPerson?: string | null
  phone?: string | null
  email?: string | null

  // Address
  address?: string | null
  city?: string | null
  state?: string | null

  // Business Terms
  paymentTerms?: string | null
  rating?: FirestoreNumeric | null

  // Status & Metadata
  status: string // 'active' | 'inactive'
  metadata?: Record<string, any>
}

/**
 * Create Supplier Payload
 */
export interface CreateSupplierPayload extends Omit<SupplierDocument, keyof RestaurantScopedDocument> {}

/**
 * Update Supplier Payload
 */
export interface UpdateSupplierPayload extends Partial<CreateSupplierPayload> {}

// ============================================================================
// PURCHASE ORDER DOCUMENT
// ============================================================================

/**
 * Purchase Order Document
 * Scope: Branch-scoped (organizationId + restaurantId + branchId)
 * Collection: purchaseOrders
 * 
 * Represents a purchase order for inventory items
 */
export interface PurchaseOrderDocument extends BranchScopedDocument {
  // Purchase Order Information
  supplierId: string
  poNumber: string
  poDate: FirestoreTimestamp
  expectedDeliveryDate?: FirestoreTimestamp | null
  actualDeliveryDate?: FirestoreTimestamp | null

  // Financial Information
  totalAmount?: FirestoreNumeric | null

  // Status & Notes
  status: string // 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled'
  notes?: string | null

  // Audit
  createdById?: string | null
}

/**
 * Create Purchase Order Payload
 */
export interface CreatePurchaseOrderPayload
  extends Omit<PurchaseOrderDocument, keyof BranchScopedDocument> {}

/**
 * Update Purchase Order Payload
 */
export interface UpdatePurchaseOrderPayload extends Partial<CreatePurchaseOrderPayload> {}

// ============================================================================
// PURCHASE ORDER ITEM DOCUMENT
// ============================================================================

/**
 * Purchase Order Item Document
 * Scope: Organization-scoped (organizationId only)
 * Collection: purchaseOrderItems
 * 
 * Represents a line item in a purchase order
 */
export interface PurchaseOrderItemDocument extends RestaurantScopedDocument {
  // Reference Information
  purchaseOrderId: string
  inventoryItemId: string
  itemName?: string | null

  // Quantity & Pricing
  quantityOrdered?: FirestoreNumeric | null
  quantityReceived: FirestoreNumeric
  unitCost?: FirestoreNumeric | null
  lineTotal?: FirestoreNumeric | null
}

/**
 * Create Purchase Order Item Payload
 */
export interface CreatePurchaseOrderItemPayload
  extends Omit<PurchaseOrderItemDocument, keyof RestaurantScopedDocument> {}

/**
 * Update Purchase Order Item Payload
 */
export interface UpdatePurchaseOrderItemPayload
  extends Partial<CreatePurchaseOrderItemPayload> {}

// ============================================================================
// STOCK MOVEMENT DOCUMENT
// ============================================================================

/**
 * Stock Movement Document
 * Scope: Branch-scoped (organizationId + restaurantId + branchId)
 * Collection: inventoryMovements
 * 
 * Represents a stock movement (in/out) with audit trail
 */
export interface StockMovementDocument extends BranchScopedDocument {
  // Reference Information
  inventoryItemId: string
  movementType?: string | null // 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: FirestoreNumeric

  // Reference to source document
  referenceId?: string | null // PO ID, Order ID, etc.
  referenceType?: string | null // 'purchaseOrder' | 'order' | 'adjustment' | 'transfer'

  // Notes
  notes?: string | null

  // Audit
  createdById?: string | null
}

/**
 * Create Stock Movement Payload
 */
export interface CreateStockMovementPayload
  extends Omit<StockMovementDocument, keyof BranchScopedDocument> {}

/**
 * Update Stock Movement Payload
 */
export interface UpdateStockMovementPayload extends Partial<CreateStockMovementPayload> {}

// ============================================================================
// STOCK ADJUSTMENT DOCUMENT
// ============================================================================

/**
 * Stock Adjustment Document
 * Scope: Branch-scoped (organizationId + restaurantId + branchId)
 * Collection: stockAdjustments
 * 
 * Represents a manual inventory adjustment
 */
export interface StockAdjustmentDocument extends BranchScopedDocument {
  // Reference Information
  inventoryItemId: string
  adjustmentType?: string | null // 'add' | 'deduct' | 'correction'
  quantityAdjusted?: FirestoreNumeric | null

  // Reason & Documentation
  reason?: string | null
  referenceDocument?: string | null // Receipt number, damage report, etc.
  notes?: string | null

  // Audit
  adjustedById?: string | null
}

/**
 * Create Stock Adjustment Payload
 */
export interface CreateStockAdjustmentPayload
  extends Omit<StockAdjustmentDocument, keyof BranchScopedDocument> {}

/**
 * Update Stock Adjustment Payload
 */
export interface UpdateStockAdjustmentPayload extends Partial<CreateStockAdjustmentPayload> {}

// ============================================================================
// LOW STOCK ALERT DOCUMENT
// ============================================================================

/**
 * Low Stock Alert Document
 * Scope: Branch-scoped (organizationId + restaurantId + branchId)
 * Collection: lowStockAlerts
 * 
 * Represents a low stock alert for an inventory item
 */
export interface LowStockAlertDocument extends BranchScopedDocument {
  // Reference Information
  inventoryItemId: string
  currentStock?: FirestoreNumeric | null
  reorderLevel?: FirestoreNumeric | null

  // Status & Acknowledgment
  alertStatus: string // 'active' | 'acknowledged' | 'resolved'
  acknowledgedAt?: FirestoreTimestamp | null

  // Audit
  acknowledgedById?: string | null
}

/**
 * Create Low Stock Alert Payload
 */
export interface CreateLowStockAlertPayload
  extends Omit<LowStockAlertDocument, keyof BranchScopedDocument> {}

/**
 * Update Low Stock Alert Payload
 */
export interface UpdateLowStockAlertPayload extends Partial<CreateLowStockAlertPayload> {}
