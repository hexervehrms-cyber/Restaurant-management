/**
 * Order Module Firestore Document Types
 * Defines all Order-related Firestore documents
 * 
 * HIERARCHY:
 * - Order (root document)
 *   └─ OrderItem (nested within order)
 */

import { RestaurantScopedDocument, FirestoreTimestamp, FirestoreNumeric, DocumentId } from './index'

// ============= ORDER ROOT DOCUMENT =============

/**
 * Order Document
 * Main order entity, branch and organization-scoped
 * 
 * Firestore Path: /orders/{orderId}
 * Collection: COLLECTIONS.orders
 * Scope: RestaurantScopedDocument (organizationId + restaurantId + branchId)
 */
export interface OrderDocument extends RestaurantScopedDocument {
  // Core Identifiers (inherited from RestaurantScopedDocument)
  // id: DocumentId
  // organizationId: string
  // restaurantId: string
  // branchId: string (if needed)
  // isActive?: boolean
  
  // Audit Fields (inherited from BaseDocument)
  // createdAt: FirestoreTimestamp
  // updatedAt: FirestoreTimestamp
  // createdBy: string
  // updatedBy: string
  
  // Soft Delete Fields (inherited from BaseDocument)
  // deletedAt: FirestoreTimestamp | null
  // isDeleted: boolean
  // deletedBy: string | null

  // Order Identifiers
  orderNumber: string // e.g., "ORD-20240115-0001"
  
  // Foreign Keys
  branchId: string
  customerId?: DocumentId | null
  tableId?: DocumentId | null

  // QR/Session tracking
  qrOrderSessionToken?: string | null

  // Order Details
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'aggregator'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'

  // Financial Amounts (stored as decimal strings for precision)
  subtotal: string // Decimal as string
  discountAmount: string // Decimal as string
  discountPercentage: string // Decimal as string
  discountReason?: string | null
  taxAmount: string // Decimal as string
  serviceCharge: string // Decimal as string
  totalAmount: string // Decimal as string

  // Payment Information
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'

  // Delivery Information (for delivery orders)
  deliveryAddressId?: DocumentId | null
  deliveryTime?: FirestoreTimestamp | null
  deliveryInstructions?: string | null

  // Preparation & Serving Timeline
  preparedAt?: FirestoreTimestamp | null
  servedAt?: FirestoreTimestamp | null
  cancelledAt?: FirestoreTimestamp | null
  cancellationReason?: string | null

  // Additional Information
  notes?: string | null
  source?: string | null // e.g., "aggregator_name", "walk_in"
  metadata?: Record<string, any>

  // User Tracking
  createdById?: DocumentId | null
  confirmedById?: DocumentId | null
  servedById?: DocumentId | null
}

/**
 * Create payload for Order
 */
export interface CreateOrderPayload
  extends Omit<OrderDocument, keyof RestaurantScopedDocument> {}

/**
 * Update payload for Order
 */
export interface UpdateOrderPayload extends Partial<CreateOrderPayload> {}

// ============= ORDER ITEM DOCUMENT =============

/**
 * Order Item Document
 * Represents items within an order
 * 
 * Firestore Path: /orders/{orderId}/items/{itemId}
 * Collection: Dynamic, use SUBCOLLECTION_PATHS.orderItems(orderId)
 * Scope: Organization-scoped (inherits from parent Order)
 */
export interface OrderItemDocument extends Omit<RestaurantScopedDocument, 'restaurantId'> {
  // Parent Reference
  orderId: DocumentId

  // Menu Item Information
  menuItemId: DocumentId
  itemName: string
  basePrice: FirestoreNumeric
  quantity: number
  itemTotal: FirestoreNumeric

  // Variant Information
  variantId?: DocumentId | null

  // Special Instructions
  specialInstructions?: string | null
  preparationTimeMinutes?: number | null

  // Status Tracking
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
}

/**
 * Create payload for Order Item
 */
export interface CreateOrderItemPayload
  extends Omit<OrderItemDocument, keyof RestaurantScopedDocument | 'orderId'> {}

/**
 * Update payload for Order Item
 */
export interface UpdateOrderItemPayload extends Partial<CreateOrderItemPayload> {}

// ============= COMPOSITE TYPES =============

/**
 * Order with nested items (denormalized for API responses)
 * Used for API responses when full order data with items is needed
 */
export interface OrderWithDetails extends OrderDocument {
  items?: OrderItemDocument[]
}

/**
 * Order search result
 * Minimal data returned in search/list endpoints
 */
export interface OrderSearchResult {
  id: DocumentId
  orderNumber: string
  status: OrderDocument['status']
  totalAmount: string
  customerName?: string | null
  createdAt: FirestoreTimestamp
}

/**
 * Order analytics data
 * Used for dashboard and reporting
 */
export interface OrderAnalyticsData {
  orderCount: number
  totalRevenue: number
  averageTicket: number
  ordersToday: number
  liveOrdersCount: number
  ordersByStatus: Record<string, number>
}

