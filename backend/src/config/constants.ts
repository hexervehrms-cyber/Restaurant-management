/**
 * Firestore Constants
 * Centralized constants for status, defaults, field names, etc.
 */

// ============= AUDIT FIELD NAMES =============
export const AUDIT_FIELDS = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy',
  deletedAt: 'deletedAt',
  deletedBy: 'deletedBy',
  isDeleted: 'isDeleted',
} as const

// ============= SOFT DELETE FIELDS =============
export const SOFT_DELETE_FIELDS = {
  isDeleted: 'isDeleted',
  deletedAt: 'deletedAt',
  deletedBy: 'deletedBy',
} as const

// ============= BASE DOCUMENT FIELDS =============
export const BASE_DOCUMENT_FIELDS = {
  id: 'id',
  organizationId: 'organizationId',
  restaurantId: 'restaurantId',
  branchId: 'branchId',
  isActive: 'isActive',
  ...AUDIT_FIELDS,
  ...SOFT_DELETE_FIELDS,
} as const

// ============= STATUS ENUMS =============

export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  RESTAURANT_OWNER = 'restaurant_owner',
  BRANCH_MANAGER = 'branch_manager',
  CHEF = 'chef',
  WAITER = 'waiter',
  CASHIER = 'cashier',
  CUSTOMER = 'customer',
  AGGREGATOR = 'aggregator_integration',
}

export enum RestaurantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum BranchStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
  AGGREGATOR = 'aggregator',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled',
}

export enum BillStatus {
  OPEN = 'open',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum KitchenTicketStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export enum InventoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum SyncStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  FAILED = 'failed',
}

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_READY = 'order_ready',
  PAYMENT_RECEIVED = 'payment_received',
  RESERVATION_CONFIRMED = 'reservation_confirmed',
  RESERVATION_REMINDER = 'reservation_reminder',
  LOW_INVENTORY = 'low_inventory',
  SYSTEM_ALERT = 'system_alert',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  RESTORE = 'restore',
  BULK_UPDATE = 'bulk_update',
  BULK_DELETE = 'bulk_delete',
  SYNC = 'sync',
  PAYMENT = 'payment',
  REFUND = 'refund',
}

// ============= PAGINATION DEFAULTS =============
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_OFFSET: 0,
} as const

// ============= BATCH OPERATIONS =============
export const BATCH_OPERATIONS = {
  MAX_BATCH_SIZE: 500, // Firestore batch write limit
  DEFAULT_BATCH_SIZE: 100,
} as const

// ============= SOFT DELETE RETENTION =============
export const RETENTION_POLICY = {
  ARCHIVE_AFTER_DAYS: 90,
  HARD_DELETE_AFTER_DAYS: 365,
} as const

// ============= SUBSCRIPTION TIERS =============
export enum SubscriptionTier {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

// ============= PAYMENT METHODS =============
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  ONLINE_PAYMENT = 'online_payment',
}

// ============= UNIT OF MEASURE =============
export enum UnitOfMeasure {
  PIECE = 'piece',
  KG = 'kg',
  LITER = 'liter',
  GRAM = 'gram',
  ML = 'ml',
  DOZEN = 'dozen',
  CARTON = 'carton',
}

// ============= AGGREGATOR TYPES =============
export enum AggregatorType {
  ZOMATO = 'zomato',
  SWIGGY = 'swiggy',
  UBER_EATS = 'uber_eats',
  ONDC = 'ondc',
}

// ============= MODIFIERS DEFAULTS =============
export const MODIFIER_DEFAULTS = {
  MIN_SELECTIONS: 0,
  MAX_SELECTIONS: 10,
} as const

// ============= RATING SCALE =============
export const RATING = {
  MIN: 1,
  MAX: 5,
} as const

// ============= SPICE LEVEL =============
export const SPICE_LEVEL = {
  MIN: 0,
  MAX: 5,
} as const

// ============= CURRENCIES =============
export const CURRENCIES = {
  INR: 'INR',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
} as const

// ============= QUERY LIMITS =============
export const QUERY_LIMITS = {
  MIN_RESULTS: 1,
  DEFAULT_RESULTS: 20,
  MAX_RESULTS: 1000,
} as const

// ============= ERROR MESSAGES =============
export const ERROR_MESSAGES = {
  NOT_FOUND: 'Document not found',
  ALREADY_EXISTS: 'Document already exists',
  INVALID_REFERENCE: 'Invalid reference to related document',
  PERMISSION_DENIED: 'Permission denied',
  INVALID_ARGUMENT: 'Invalid argument',
  INTERNAL_ERROR: 'Internal server error',
  FIREBASE_ERROR: 'Firebase operation failed',
  VALIDATION_ERROR: 'Validation error',
} as const

// ============= SUCCESS MESSAGES =============
export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  RESTORED: 'Restored successfully',
} as const
