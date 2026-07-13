/**
 * Reservations Module Firestore Document Types
 * Defines all Reservation-related Firestore documents
 * 
 * HIERARCHY:
 * - Reservation (root document)
 *   ├─ ReservationPayment (subcollection)
 *   └─ ReservationNoShowLog (subcollection)
 */

import { BranchScopedDocument, FirestoreTimestamp, FirestoreNumeric, DocumentId } from './index'

// ============= RESERVATION STATUS TYPES =============

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled'
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'bank_transfer' | 'cheque' | 'online_payment'

// ============= RESERVATION ROOT DOCUMENT =============

/**
 * Reservation Document
 * Main reservation entity, branch-scoped
 * 
 * Firestore Path: /reservations/{reservationId}
 * Collection: COLLECTIONS.reservations
 * Scope: BranchScopedDocument (organizationId + restaurantId + branchId)
 */
export interface ReservationDocument extends BranchScopedDocument {
  // Core Identifiers (inherited from BranchScopedDocument)
  // id: DocumentId
  // organizationId: string
  // restaurantId: string
  // branchId: string
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

  // Guest Information
  guestName: string
  guestPhone: string
  guestEmail: string | null
  numberOfGuests: number

  // Reservation Details
  reservationDate: FirestoreTimestamp
  reservationTime: FirestoreTimestamp
  durationMinutes: number

  // Table & Customer References
  tableId: DocumentId | null
  customerId: DocumentId | null

  // Reservation Status
  status: ReservationStatus

  // Payment Information
  advancePaymentAmount: FirestoreNumeric
  advancePaymentStatus: PaymentStatus | null

  // Cancellation & No-Show
  cancellationReason: string | null
  noShowReason: string | null

  // Additional Information
  notes: string | null
  source: string | null
  externalReferenceId: string | null

  // Additional Data
  metadata: Record<string, any>
}

/**
 * Create payload for Reservation
 */
export interface CreateReservationPayload
  extends Omit<ReservationDocument, keyof BranchScopedDocument> {}

/**
 * Update payload for Reservation
 */
export interface UpdateReservationPayload extends Partial<CreateReservationPayload> {}

// ============= RESERVATION PAYMENT SUBCOLLECTION =============

/**
 * Reservation Payment Document
 * Nested subcollection within Reservation document
 * Tracks payments related to reservation
 * 
 * Firestore Path: /reservations/{reservationId}/payments/{paymentId}
 * Collection: Dynamic, use SUBCOLLECTION_PATHS.reservationPayments(reservationId)
 * Scope: Organization-scoped (inherits from parent Reservation)
 */
export interface ReservationPaymentDocument extends Omit<BranchScopedDocument, 'branchId'> {
  // Parent Reference
  reservationId: DocumentId

  // Payment Information
  amount: FirestoreNumeric
  paymentMethod: PaymentMethod | null
  paymentStatus: PaymentStatus

  // Transaction Details
  transactionId: string | null
  referenceNumber: string | null

  // Additional Information
  notes: string | null

  // Timestamps (use base document fields)
  // createdAt: FirestoreTimestamp
  // updatedAt: FirestoreTimestamp
}

/**
 * Create payload for Reservation Payment
 */
export interface CreateReservationPaymentPayload
  extends Omit<ReservationPaymentDocument, keyof BranchScopedDocument | 'reservationId'> {}

/**
 * Update payload for Reservation Payment
 */
export interface UpdateReservationPaymentPayload extends Partial<CreateReservationPaymentPayload> {}

// ============= RESERVATION NO-SHOW LOG SUBCOLLECTION =============

/**
 * Reservation No-Show Log Document
 * Nested subcollection within Reservation document
 * Tracks no-show events and penalties
 * 
 * Firestore Path: /reservations/{reservationId}/noShowLogs/{logId}
 * Collection: Dynamic, use SUBCOLLECTION_PATHS.reservationNoShowLogs(reservationId)
 * Scope: Organization-scoped (inherits from parent Reservation)
 */
export interface ReservationNoShowLogDocument extends Omit<BranchScopedDocument, 'branchId'> {
  // Parent Reference
  reservationId: DocumentId

  // No-Show Information
  noShowCount: number | null
  totalPenalty: FirestoreNumeric | null

  // Audit
  createdBy: string | null
  notes: string | null

  // Timestamps (use base document fields)
  // createdAt: FirestoreTimestamp
}

/**
 * Create payload for Reservation No-Show Log
 */
export interface CreateReservationNoShowLogPayload
  extends Omit<ReservationNoShowLogDocument, keyof BranchScopedDocument | 'reservationId'> {}

/**
 * Update payload for Reservation No-Show Log
 */
export interface UpdateReservationNoShowLogPayload extends Partial<CreateReservationNoShowLogPayload> {}

// ============= COMPOSITE TYPES =============

/**
 * Reservation with nested data (denormalized for API responses)
 * Used for API responses when full reservation data is needed
 */
export interface ReservationWithDetails extends ReservationDocument {
  payments?: ReservationPaymentDocument[]
  noShowLogs?: ReservationNoShowLogDocument[]
}

/**
 * Reservation search result
 * Minimal data returned in search endpoints
 */
export interface ReservationSearchResult {
  id: DocumentId
  guestName: string
  guestPhone: string
  guestEmail: string | null
  status: ReservationStatus
}

/**
 * Reservation list view
 * Formatted for dashboard/list display
 */
export interface ReservationListItem {
  id: DocumentId
  guestName: string
  guestPhone: string
  guestEmail: string | null
  tableId: DocumentId | null
  tableNumber?: number
  date: string
  time: string
  guestCount: number
  status: ReservationStatus
  notes: string | null
  prepayment: number
  createdAt: FirestoreTimestamp
}
