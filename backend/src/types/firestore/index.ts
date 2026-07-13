/**
 * Firestore Type Definitions
 * Reusable types for Firestore operations
 */

import * as admin from 'firebase-admin'

// ============= BASE TYPES =============

/**
 * Firestore Document ID (string)
 */
export type DocumentId = string & { readonly __brand: 'DocumentId' }

/**
 * Create branded DocumentId
 */
export function createDocumentId(id: string): DocumentId {
  return id as DocumentId
}

/**
 * Firestore Timestamp
 */
export type FirestoreTimestamp = admin.firestore.Timestamp | Date | null

/**
 * Firestore Numeric (for precise decimal operations)
 */
export type FirestoreNumeric = admin.firestore.Numeric | number | string

/**
 * Document reference type
 */
export type DocumentReference = admin.firestore.DocumentReference

/**
 * Collection reference type
 */
export type CollectionReference = admin.firestore.CollectionReference

/**
 * Query type
 */
export type Query = admin.firestore.Query

/**
 * Document snapshot
 */
export type DocumentSnapshot = admin.firestore.DocumentSnapshot

/**
 * Query snapshot
 */
export type QuerySnapshot = admin.firestore.QuerySnapshot

/**
 * Batch write type
 */
export type WriteBatch = admin.firestore.WriteBatch

/**
 * Transaction type
 */
export type Transaction = admin.firestore.Transaction

/**
 * Field value (for timestamps, deletes, etc.)
 */
export type FieldValue = admin.firestore.FieldValue

// ============= BASE DOCUMENT TYPES =============

/**
 * Base audit fields
 */
export interface AuditFields {
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
  createdBy: string
  updatedBy: string
}

/**
 * Soft delete fields
 */
export interface SoftDeleteFields {
  deletedAt: FirestoreTimestamp
  isDeleted: boolean
  deletedBy: string | null
}

/**
 * Base Firestore document
 * All documents must include these fields
 */
export interface BaseDocument extends AuditFields, SoftDeleteFields {
  id: DocumentId
  organizationId: string
  isActive?: boolean
}

/**
 * Restaurant-scoped document (includes restaurantId)
 */
export interface RestaurantScopedDocument extends BaseDocument {
  restaurantId: string
}

/**
 * Branch-scoped document (includes branchId and restaurantId)
 */
export interface BranchScopedDocument extends RestaurantScopedDocument {
  branchId: string
}

// ============= QUERY TYPES =============

/**
 * Pagination options
 */
export interface PaginationOptions {
  pageSize?: number
  pageNumber?: number
  offset?: number
}

/**
 * Pagination result (offset-based, deprecated)
 */
export interface PaginationResult<T> {
  data: T[]
  total: number
  pageSize: number
  pageNumber: number
  hasMore: boolean
}

/**
 * Cursor pagination result (recommended)
 */
export interface CursorPaginationResult<T> {
  data: T[]
  lastSnapshot?: admin.firestore.DocumentSnapshot
  hasMore: boolean
}

/**
 * Query filter
 */
export interface QueryFilter {
  field: string
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'array-contains-any'
  value: any
}

/**
 * Query order
 */
export interface QueryOrder {
  field: string
  direction: 'asc' | 'desc'
}

/**
 * Query options
 */
export interface QueryOptions {
  filters?: QueryFilter[]
  orders?: QueryOrder[]
  limit?: number
  offset?: number
}

// ============= OPERATION RESULT TYPES =============

/**
 * Create operation result
 */
export interface CreateResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Update operation result
 */
export interface UpdateResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Delete operation result
 */
export interface DeleteResult {
  success: boolean
  deletedId?: string
  error?: string
}

/**
 * Batch operation result
 */
export interface BatchResult {
  success: boolean
  successCount: number
  failureCount: number
  errors: { docId: string; error: string }[]
}

// ============= TRANSACTION TYPES =============

/**
 * Transaction operation
 */
export type TransactionOperation = (transaction: Transaction) => Promise<any>

/**
 * Transaction result
 */
export interface TransactionResult<T> {
  success: boolean
  data?: T
  error?: string
}

// ============= ERROR TYPES =============

/**
 * Firestore error
 */
export interface FirestoreError extends Error {
  code?: string
  details?: any
}

/**
 * Operation error
 */
export interface OperationError {
  code: string
  message: string
  details?: any
}

// ============= BULK OPERATION TYPES =============

/**
 * Bulk create options
 */
export interface BulkCreateOptions {
  batchSize?: number
  continueOnError?: boolean
}

/**
 * Bulk update options
 */
export interface BulkUpdateOptions {
  batchSize?: number
  continueOnError?: boolean
}

/**
 * Bulk delete options
 */
export interface BulkDeleteOptions {
  batchSize?: number
  continueOnError?: boolean
  softDelete?: boolean
}

// ============= UTILITY TYPES =============

/**
 * Generic document with metadata
 */
export interface DocumentWithMetadata<T> {
  id: DocumentId
  data: T
  createTime: FirestoreTimestamp
  updateTime: FirestoreTimestamp
  readTime?: FirestoreTimestamp
}

/**
 * Document change
 */
export interface DocumentChange<T> {
  type: 'added' | 'modified' | 'removed'
  doc: DocumentWithMetadata<T>
}

/**
 * Query listener options
 */
export interface QueryListenerOptions {
  includeMetadataChanges?: boolean
  onError?: (error: Error) => void
}

/**
 * Listener unsubscribe function
 */
export type UnsubscribeFunction = () => void

// ============= CUSTOMER MODULE TYPES =============

/**
 * Re-export Customer module document types
 */
export type {
  CustomerDocument,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  CustomerAddressDocument,
  CreateCustomerAddressPayload,
  UpdateCustomerAddressPayload,
  CustomerNoteDocument,
  CreateCustomerNotePayload,
  UpdateCustomerNotePayload,
  CustomerLoyaltyPointsDocument,
  CreateCustomerLoyaltyPointsPayload,
  UpdateCustomerLoyaltyPointsPayload,
  CustomerWithDetails,
  CustomerSearchResult,
  CRMCustomerView,
} from './customer'

// ============= INVENTORY MODULE TYPES =============

/**
 * Re-export Inventory module document types
 */
export type {
  InventoryItemDocument,
  CreateInventoryItemPayload,
  UpdateInventoryItemPayload,
  SupplierDocument,
  CreateSupplierPayload,
  UpdateSupplierPayload,
  PurchaseOrderDocument,
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
  PurchaseOrderItemDocument,
  CreatePurchaseOrderItemPayload,
  UpdatePurchaseOrderItemPayload,
  StockMovementDocument,
  CreateStockMovementPayload,
  UpdateStockMovementPayload,
  StockAdjustmentDocument,
  CreateStockAdjustmentPayload,
  UpdateStockAdjustmentPayload,
  LowStockAlertDocument,
  CreateLowStockAlertPayload,
  UpdateLowStockAlertPayload,
} from './inventory'

// ============= RESERVATIONS MODULE TYPES =============

/**
 * Re-export Reservations module document types
 */
export type {
  ReservationDocument,
  CreateReservationPayload,
  UpdateReservationPayload,
  ReservationPaymentDocument,
  CreateReservationPaymentPayload,
  UpdateReservationPaymentPayload,
  ReservationNoShowLogDocument,
  CreateReservationNoShowLogPayload,
  UpdateReservationNoShowLogPayload,
  ReservationWithDetails,
  ReservationSearchResult,
  ReservationListItem,
  ReservationStatus,
  PaymentStatus,
  PaymentMethod,
} from './reservations'

// ============= KITCHEN MODULE TYPES =============

/**
 * Re-export Kitchen module document types
 */
export type {
  KitchenSectionDocument,
  CreateKitchenSectionPayload,
  UpdateKitchenSectionPayload,
  KitchenTicketDocument,
  CreateKitchenTicketPayload,
  UpdateKitchenTicketPayload,
  KitchenTicketItemDocument,
  CreateKitchenTicketItemPayload,
  UpdateKitchenTicketItemPayload,
  KitchenStatusLogDocument,
  CreateKitchenStatusLogPayload,
  UpdateKitchenStatusLogPayload,
  KitchenTicketWithDetails,
  KitchenTicketSearchResult,
  KitchenDashboardItem,
  KitchenLiveStatus,
  KitchenTicketStatus,
  KitchenSectionType,
} from './kitchen'

// ============= NOTIFICATIONS MODULE TYPES =============

/**
 * Re-export Notifications module document types
 */
export type {
  NotificationDocument,
  CreateNotificationPayload,
  UpdateNotificationPayload,
  NotificationWithFormatting,
  NotificationListItem,
  NotificationCounts,
  NotificationType,
  NotificationStatus,
  NotificationChannel,
} from './notifications'
