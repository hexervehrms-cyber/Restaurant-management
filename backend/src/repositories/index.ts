/**
 * Repository Layer Exports
 * Core Firestore repository framework
 * 
 * FRAMEWORK COMPONENTS:
 * - IRepository: Generic interface for all repositories
 * - BaseRepository: Generic base class with common CRUD operations
 * - RepositoryFactory: Singleton factory for repository management and DI
 * 
 * USAGE:
 *   // In a module's repository
 *   import { BaseRepository, IRepository } from '@/repositories'
 *   import { COLLECTIONS } from '@/config/collections'
 *   
 *   export class UserRepository extends BaseRepository<User> implements IRepository<User> {
 *     constructor() {
 *       super(COLLECTIONS.users)
 *     }
 *   }
 *   
 *   // Register and use
 *   RepositoryFactory.register('users', UserRepository, COLLECTIONS.users)
 *   const userRepo = RepositoryFactory.resolve<UserRepository>('users')
 * 
 * NO BUSINESS LOGIC IN THIS LAYER
 * All repositories should inherit from BaseRepository
 * All repositories should implement IRepository
 * Only CRUD operations and generic Firestore methods
 */

export { IRepository } from './IRepository'
export { BaseRepository } from './BaseRepository'
export { RepositoryFactory } from './RepositoryFactory'

/**
 * Authentication Repositories
 * Handle user, role, and organization data
 */
export { UserRepository, type User, type CreateUserPayload, type UpdateUserPayload } from './UserRepository'
export { RoleRepository, type Role, type Permission, type CreateRolePayload, type UpdateRolePayload } from './RoleRepository'
export {
  OrganizationRepository,
  type Organization,
  type CreateOrganizationPayload,
  type UpdateOrganizationPayload,
} from './OrganizationRepository'

/**
 * Restaurant Module Repositories
 * Handle restaurant configuration and settings
 */
export {
  RestaurantRepository,
  type RestaurantDocument,
} from './RestaurantRepository'
export {
  RestaurantSettingsRepository,
  type RestaurantSettingsDocument,
} from './RestaurantSettingsRepository'

/**
 * Branch Module Repositories
 * Handle branch data and configuration
 */
export {
  BranchRepository,
  type BranchDocument,
} from './BranchRepository'

/**
 * Customer Module Repositories
 * Handle customer data, addresses, notes, and loyalty points
 */
export {
  CustomerRepository,
  type CustomerDocument,
  type CreateCustomerPayload,
  type UpdateCustomerPayload,
} from './CustomerRepository'
export {
  CustomerAddressRepository,
  type CustomerAddressDocument,
  type CreateCustomerAddressPayload,
  type UpdateCustomerAddressPayload,
} from './CustomerAddressRepository'
export {
  CustomerNoteRepository,
  type CustomerNoteDocument,
  type CreateCustomerNotePayload,
  type UpdateCustomerNotePayload,
} from './CustomerNoteRepository'
export {
  CustomerLoyaltyPointsRepository,
  type CustomerLoyaltyPointsDocument,
  type CreateCustomerLoyaltyPointsPayload,
  type UpdateCustomerLoyaltyPointsPayload,
} from './CustomerLoyaltyPointsRepository'

/**
 * Menu Module Repositories
 * Handle menu categories, items, variants, modifiers, and modifier groups
 */
export {
  MenuCategoryRepository,
  type MenuCategoryDocument,
} from './MenuCategoryRepository'
export {
  MenuItemRepository,
  type MenuItemDocument,
} from './MenuItemRepository'
export {
  MenuVariantRepository,
  type MenuVariantDocument,
} from './MenuVariantRepository'
export {
  MenuItemModifierGroupRepository,
  type MenuItemModifierGroupDocument,
} from './MenuItemModifierGroupRepository'
export {
  ModifierGroupRepository,
  type ModifierGroupDocument,
} from './ModifierGroupRepository'
export {
  ModifierRepository,
  type ModifierDocument,
} from './ModifierRepository'

/**
 * Billing & Payments Module Repositories
 * Handle bills, bill items, payments, and refunds
 */
export {
  BillRepository,
  type Bill,
  type CreateBillPayload,
  type UpdateBillPayload,
} from './BillRepository'
export {
  BillItemRepository,
  type BillItem,
  type CreateBillItemPayload,
  type UpdateBillItemPayload,
} from './BillItemRepository'
export {
  PaymentRepository,
  type Payment,
  type CreatePaymentPayload,
  type UpdatePaymentPayload,
} from './PaymentRepository'
export {
  RefundRepository,
  type Refund,
  type CreateRefundPayload,
  type UpdateRefundPayload,
} from './RefundRepository'

/**
 * Inventory Module Repositories
 * Handle inventory items, suppliers, purchase orders, stock movements, adjustments, and alerts
 */
export {
  InventoryItemRepository,
  type InventoryItemDocument,
  type CreateInventoryItemPayload,
  type UpdateInventoryItemPayload,
} from './InventoryItemRepository'
export {
  SupplierRepository,
  type SupplierDocument,
  type CreateSupplierPayload,
  type UpdateSupplierPayload,
} from './SupplierRepository'
export {
  PurchaseOrderRepository,
  type PurchaseOrderDocument,
  type CreatePurchaseOrderPayload,
  type UpdatePurchaseOrderPayload,
} from './PurchaseOrderRepository'
export {
  PurchaseOrderItemRepository,
  type PurchaseOrderItemDocument,
  type CreatePurchaseOrderItemPayload,
  type UpdatePurchaseOrderItemPayload,
} from './PurchaseOrderItemRepository'
export {
  StockMovementRepository,
  type StockMovementDocument,
  type CreateStockMovementPayload,
  type UpdateStockMovementPayload,
} from './StockMovementRepository'
export {
  StockAdjustmentRepository,
  type StockAdjustmentDocument,
  type CreateStockAdjustmentPayload,
  type UpdateStockAdjustmentPayload,
} from './StockAdjustmentRepository'
export {
  LowStockAlertRepository,
  type LowStockAlertDocument,
  type CreateLowStockAlertPayload,
  type UpdateLowStockAlertPayload,
} from './LowStockAlertRepository'

/**
 * Re-export commonly used types
 */
export type {
  DocumentId,
  BaseDocument,
  CreateResult,
  UpdateResult,
  DeleteResult,
  BatchResult,
  QueryOptions,
  QueryFilter,
  QueryOrder,
  PaginationResult,
  PaginationOptions,
  CursorPaginationResult,
  FirestoreTimestamp,
} from '../types/firestore'

/**
 * Reservations Module Repositories
 * Handle reservation data, payments, and no-show logs
 */
export {
  ReservationRepository,
  type ReservationDocument,
  type CreateReservationPayload,
  type UpdateReservationPayload,
} from './ReservationRepository'
export {
  ReservationPaymentRepository,
  type ReservationPaymentDocument,
  type CreateReservationPaymentPayload,
  type UpdateReservationPaymentPayload,
} from './ReservationPaymentRepository'
export {
  ReservationNoShowLogRepository,
  type ReservationNoShowLogDocument,
  type CreateReservationNoShowLogPayload,
  type UpdateReservationNoShowLogPayload,
} from './ReservationNoShowLogRepository'

/**
 * Inventory Module Service
 * High-level business logic for inventory operations
 */
export { InventoryService } from '../services/InventoryService'

/**
 * Re-export Firestore utilities
 */
export {
  FirestoreConverter,
  toFirestoreNumeric,
  fromFirestoreNumeric,
  createDocumentConverter,
  safeParseDocument,
  batchConvert,
  querySnapshotToArray,
  prepareDocumentForCreate,
  prepareDocumentForUpdate,
  prepareDocumentForDelete,
  prepareDocumentForRestore,
} from '../config/converters'

/**
 * Re-export error handling
 */
export {
  FirestoreError,
  FirestoreErrorCode,
  mapFirebaseError,
  safeFirestoreOperation,
  isFirestoreError,
  isNotFound,
  isPermissionDenied,
  isAlreadyExists,
  isRetryable,
  retryFirestoreOperation,
} from '../firestore/errors'

/**
 * Re-export collection constants
 */
export { COLLECTIONS, SUBCOLLECTION_PATHS, ALL_COLLECTIONS } from '../firestore/collections'
