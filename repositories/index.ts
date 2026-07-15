/**
 * Repositories Barrel Export
 * Makes repositories accessible from app routes via @/repositories alias
 * 
 * Re-exports from backend/src/repositories
 */

export { BaseRepository } from '../backend/src/repositories/BaseRepository'
export { OrganizationRepository, type Organization, type CreateOrganizationPayload, type UpdateOrganizationPayload } from '../backend/src/repositories/OrganizationRepository'
export { UserRepository, type User, type CreateUserPayload, type UpdateUserPayload } from '../backend/src/repositories/UserRepository'
export { RoleRepository, type Role, type Permission, type CreateRolePayload, type UpdateRolePayload } from '../backend/src/repositories/RoleRepository'
export type { IRepository } from '../backend/src/repositories/IRepository'
export { RepositoryFactory } from '../backend/src/repositories/RepositoryFactory'

/**
 * Customer Module Repositories
 */
export { CustomerRepository, type CustomerDocument, type CreateCustomerPayload, type UpdateCustomerPayload } from '../backend/src/repositories/CustomerRepository'
export { CustomerAddressRepository, type CustomerAddressDocument, type CreateCustomerAddressPayload, type UpdateCustomerAddressPayload } from '../backend/src/repositories/CustomerAddressRepository'
export { CustomerNoteRepository, type CustomerNoteDocument, type CreateCustomerNotePayload, type UpdateCustomerNotePayload } from '../backend/src/repositories/CustomerNoteRepository'
export { CustomerLoyaltyPointsRepository, type CustomerLoyaltyPointsDocument, type CreateCustomerLoyaltyPointsPayload, type UpdateCustomerLoyaltyPointsPayload } from '../backend/src/repositories/CustomerLoyaltyPointsRepository'

/**
 * Billing & Payments Module Repositories
 */
export { BillRepository, type Bill, type CreateBillPayload, type UpdateBillPayload } from '../backend/src/repositories/BillRepository'
export { BillItemRepository, type BillItem, type CreateBillItemPayload, type UpdateBillItemPayload } from '../backend/src/repositories/BillItemRepository'
export { PaymentRepository, type Payment, type CreatePaymentPayload, type UpdatePaymentPayload } from '../backend/src/repositories/PaymentRepository'
export { RefundRepository, type Refund, type CreateRefundPayload, type UpdateRefundPayload } from '../backend/src/repositories/RefundRepository'

/**
 * Billing & Payments Services
 */
export { BillingService } from '../backend/src/services/BillingService'

/**
 * Inventory Module Repositories & Services
 */
export { InventoryItemRepository, type InventoryItemDocument, type CreateInventoryItemPayload, type UpdateInventoryItemPayload } from '../backend/src/repositories/InventoryItemRepository'
export { LowStockAlertRepository, type LowStockAlertDocument, type CreateLowStockAlertPayload, type UpdateLowStockAlertPayload } from '../backend/src/repositories/LowStockAlertRepository'
export { StockMovementRepository, type StockMovementDocument, type CreateStockMovementPayload, type UpdateStockMovementPayload } from '../backend/src/repositories/StockMovementRepository'
export { StockAdjustmentRepository, type StockAdjustmentDocument, type CreateStockAdjustmentPayload, type UpdateStockAdjustmentPayload } from '../backend/src/repositories/StockAdjustmentRepository'
export { InventoryService } from '../backend/src/services/InventoryService'

/**
 * Orders & Restaurant Table Repositories
 */
export { OrderRepository, type OrderDocument, type CreateOrderPayload, type UpdateOrderPayload } from '../backend/src/repositories/OrderRepository'
export { RestaurantTableRepository, type RestaurantTableDocument, type CreateRestaurantTablePayload, type UpdateRestaurantTablePayload } from '../backend/src/repositories/RestaurantTableRepository'

/**
 * Kitchen Module Services
 */
export { KitchenService } from '../backend/src/services/KitchenService'

/**
 * Reservation Module Services
 */
export { ReservationService } from '../backend/src/services/ReservationService'

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
  FirestoreError,
  FirestoreTimestamp,
} from '../backend/src/types/firestore'
