/**
 * Customer Module Firestore Document Types
 * Defines all Customer-related Firestore documents
 * 
 * HIERARCHY:
 * - Customer (root document)
 *   ├─ CustomerAddress (subcollection)
 *   ├─ CustomerNote (subcollection)
 *   └─ CustomerLoyaltyPoints (subcollection)
 */

import { RestaurantScopedDocument, FirestoreTimestamp, FirestoreNumeric, DocumentId } from './index'

// ============= CUSTOMER ROOT DOCUMENT =============

/**
 * Customer Document
 * Main customer entity, organization-scoped
 * 
 * Firestore Path: /customers/{customerId}
 * Collection: COLLECTIONS.customers
 * Scope: RestaurantScopedDocument (organizationId + restaurantId)
 */
export interface CustomerDocument extends RestaurantScopedDocument {
  // Core Identifiers (inherited from RestaurantScopedDocument)
  // id: DocumentId
  // organizationId: string
  // restaurantId: string
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

  // Contact Information
  phone: string | null
  email: string | null
  firstName: string | null
  lastName: string | null

  // Personal Information
  dateOfBirth: FirestoreTimestamp | null
  gender: string | null
  profilePictureUrl: string | null
  preferredLanguage: string | null

  // Account Information
  status: 'active' | 'inactive' | 'blocked'
  customerSource: string | null

  // Statistics
  totalOrders: number
  totalSpent: FirestoreNumeric
  lastVisitAt: FirestoreTimestamp | null

  // Additional Data
  metadata: Record<string, any>

  // Relationship Denormalization (optional, for performance)
  visitCount?: number
  averageOrderValue?: FirestoreNumeric
  preferences?: string[]
  notes?: string
}

/**
 * Create payload for Customer
 */
export interface CreateCustomerPayload
  extends Omit<CustomerDocument, keyof RestaurantScopedDocument> {}

/**
 * Update payload for Customer
 */
export interface UpdateCustomerPayload extends Partial<CreateCustomerPayload> {}

// ============= CUSTOMER ADDRESS SUBCOLLECTION =============

/**
 * Customer Address Document
 * Nested subcollection within Customer document
 * 
 * Firestore Path: /customers/{customerId}/addresses/{addressId}
 * Collection: Dynamic, use SUBCOLLECTION_PATHS.customerAddresses(customerId)
 * Scope: Organization-scoped (inherits from parent Customer)
 */
export interface CustomerAddressDocument extends Omit<RestaurantScopedDocument, 'restaurantId'> {
  // Parent Reference
  customerId: DocumentId

  // Address Information
  addressType: string | null // e.g., "home", "office", "delivery"
  addressLine1: string
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null

  // Geographic Coordinates
  latitude: FirestoreNumeric | null
  longitude: FirestoreNumeric | null

  // Flags
  isDefault: boolean
}

/**
 * Create payload for Customer Address
 */
export interface CreateCustomerAddressPayload
  extends Omit<CustomerAddressDocument, keyof RestaurantScopedDocument | 'customerId'> {}

/**
 * Update payload for Customer Address
 */
export interface UpdateCustomerAddressPayload extends Partial<CreateCustomerAddressPayload> {}

// ============= CUSTOMER NOTE SUBCOLLECTION =============

/**
 * Customer Note Document
 * Nested subcollection within Customer document
 * Used for internal notes about customers
 * 
 * Firestore Path: /customers/{customerId}/notes/{noteId}
 * Collection: Dynamic, use SUBCOLLECTION_PATHS.customerNotes(customerId)
 * Scope: Organization-scoped (inherits from parent Customer)
 */
export interface CustomerNoteDocument extends Omit<RestaurantScopedDocument, 'restaurantId'> {
  // Parent Reference
  customerId: DocumentId

  // Note Content
  note: string | null

  // Author (optional, can be null for anonymous notes)
  createdBy: string | null
}

/**
 * Create payload for Customer Note
 */
export interface CreateCustomerNotePayload
  extends Omit<CustomerNoteDocument, keyof RestaurantScopedDocument | 'customerId'> {}

/**
 * Update payload for Customer Note
 */
export interface UpdateCustomerNotePayload extends Partial<CreateCustomerNotePayload> {}

// ============= CUSTOMER LOYALTY POINTS SUBCOLLECTION =============

/**
 * Customer Loyalty Points Document
 * Nested subcollection within Customer document
 * Tracks loyalty program data for customer
 * 
 * Firestore Path: /customers/{customerId}/loyalty_points/{loyaltyPointsId}
 * Collection: Dynamic, use SUBCOLLECTION_PATHS.customerLoyaltyPoints(customerId)
 * Scope: Organization-scoped (inherits from parent Customer)
 * 
 * Note: This is typically 1:1 with Customer, but stored as subcollection for flexibility
 */
export interface CustomerLoyaltyPointsDocument
  extends Omit<RestaurantScopedDocument, 'restaurantId'> {
  // Parent Reference
  customerId: DocumentId

  // Points Tracking
  pointsBalance: number
  lifetimePoints: number

  // Activity Timestamps
  lastEarnedAt: FirestoreTimestamp | null
  lastRedeemedAt: FirestoreTimestamp | null
}

/**
 * Create payload for Customer Loyalty Points
 */
export interface CreateCustomerLoyaltyPointsPayload
  extends Omit<CustomerLoyaltyPointsDocument, keyof RestaurantScopedDocument | 'customerId'> {}

/**
 * Update payload for Customer Loyalty Points
 */
export interface UpdateCustomerLoyaltyPointsPayload
  extends Partial<CreateCustomerLoyaltyPointsPayload> {}

// ============= COMPOSITE TYPES =============

/**
 * Customer with nested data (denormalized for API responses)
 * Used for API responses when full customer data is needed
 */
export interface CustomerWithDetails extends CustomerDocument {
  addresses?: CustomerAddressDocument[]
  notes?: CustomerNoteDocument[]
  loyaltyPoints?: CustomerLoyaltyPointsDocument
}

/**
 * Customer search result
 * Minimal data returned in search endpoints
 */
export interface CustomerSearchResult {
  id: DocumentId
  phone: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
}

/**
 * CRM Customer view
 * Formatted for CRM dashboard display
 */
export interface CRMCustomerView {
  id: DocumentId
  name: string
  phone: string | null
  email: string | null
  totalSpent: number
  visits: number
  lastVisit: string | null
  tier: 'gold' | 'silver' | 'bronze'
  loyaltyPoints: number
  preferences: string[]
  notes: string | null
}
