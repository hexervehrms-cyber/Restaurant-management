/**
 * Firestore Collection Constants
 * Centralized collection names - SINGLE SOURCE OF TRUTH
 * 
 * Usage:
 *   db.collection(COLLECTIONS.orders)
 *   db.collection(COLLECTIONS.customers)
 * 
 * RULE: Never hardcode collection names in code
 */

export const COLLECTIONS = {
  // Root Collections
  organizations: 'organizations',
  users: 'users',
  adminSettings: 'adminSettings',

  // Organization-Level Collections
  restaurants: 'restaurants',
  branches: 'branches',
  roles: 'roles',
  staffProfiles: 'staffProfiles',
  customers: 'customers',
  menuCategories: 'menuCategories',
  menuItems: 'menuItems',
  menuVariants: 'menuVariants',
  menuItemModifierGroups: 'menuItemModifierGroups',
  modifierGroups: 'modifierGroups',
  modifiers: 'modifiers',
  suppliers: 'suppliers',
  restaurantSettings: 'restaurantSettings',
  notifications: 'notifications',
  auditLogs: 'auditLogs',

  // Transaction Collections
  orders: 'orders',
  orderItems: 'orderItems',
  bills: 'bills',
  billItems: 'billItems',
  payments: 'payments',
  refunds: 'refunds',
  kitchenSections: 'kitchenSections',
  kitchenTickets: 'kitchenTickets',
  kitchenTicketItems: 'kitchenTicketItems',
  kitchenStatusLogs: 'kitchenStatusLogs',
  restaurantTables: 'restaurantTables',
  reservations: 'reservations',
  inventoryItems: 'inventoryItems',
  inventoryMovements: 'inventoryMovements',
  purchaseOrders: 'purchaseOrders',
  purchaseOrderItems: 'purchaseOrderItems',
  stockAdjustments: 'stockAdjustments',
  lowStockAlerts: 'lowStockAlerts',
  cashRegisters: 'cashRegisters',
  cashSessions: 'cashSessions',
  dailySummaries: 'dailySummaries',

  // Aggregator Collections
  aggregatorOrders: 'aggregatorOrders',
  aggregatorOrderItems: 'aggregatorOrderItems',

  // Subcollections (paths only, use SUBCOLLECTION_PATHS)
  addresses: 'addresses',
  notes: 'notes',
  loyalty_points: 'loyalty_points',
} as const

/**
 * Subcollection Paths
 * Usage: SUBCOLLECTION_PATHS.customerAddresses(customerId)
 */
export const SUBCOLLECTION_PATHS = {
  customerAddresses: (customerId: string) => `${COLLECTIONS.customers}/${customerId}/addresses`,
  customerNotes: (customerId: string) => `${COLLECTIONS.customers}/${customerId}/notes`,
  customerLoyaltyPoints: (customerId: string) => `${COLLECTIONS.customers}/${customerId}/loyalty_points`,
  reservationPayments: (reservationId: string) => `${COLLECTIONS.reservations}/${reservationId}/payments`,
  reservationNoShowLogs: (reservationId: string) => `${COLLECTIONS.reservations}/${reservationId}/noShowLogs`,
} as const

/**
 * Type for collection names
 * Usage: const col: CollectionName = COLLECTIONS.orders
 */
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]

/**
 * All collection names as array (for validation, iteration, etc.)
 */
export const ALL_COLLECTIONS = Object.values(COLLECTIONS) as const
export type AllCollections = typeof ALL_COLLECTIONS[number]
