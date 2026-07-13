/**
 * Restaurant Table Module Firestore Document Types
 * Defines all RestaurantTable-related Firestore documents
 */

import { RestaurantScopedDocument, FirestoreTimestamp, FirestoreNumeric, DocumentId } from './index'

// ============= RESTAURANT TABLE DOCUMENT =============

/**
 * Restaurant Table Document
 * Represents physical tables in a restaurant
 * 
 * Firestore Path: /restaurant_tables/{tableId}
 * Collection: COLLECTIONS.restaurantTables
 * Scope: RestaurantScopedDocument (organizationId + restaurantId + branchId)
 */
export interface RestaurantTableDocument extends RestaurantScopedDocument {
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

  // Branch Reference
  branchId: string

  // Table Identification
  tableNumber: string // e.g., "T-01", "Table 1"
  capacity: number // Seating capacity

  // Location & Layout
  section?: string | null // e.g., "Main Dining", "Patio", "Bar"
  xPosition?: FirestoreNumeric | null // X coordinate for visual layout
  yPosition?: FirestoreNumeric | null // Y coordinate for visual layout
  rotationAngle?: number // Default: 0, in degrees
  shape?: string | null // e.g., "square", "round", "rectangular"
  color?: string | null // e.g., "#FF5733" for UI representation

  // Status
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'dirty' | 'closed'

  // Additional Information
  notes?: string | null
  metadata?: Record<string, any>
}

/**
 * Create payload for Restaurant Table
 */
export interface CreateRestaurantTablePayload
  extends Omit<RestaurantTableDocument, keyof RestaurantScopedDocument> {}

/**
 * Update payload for Restaurant Table
 */
export interface UpdateRestaurantTablePayload extends Partial<CreateRestaurantTablePayload> {}

// ============= COMPOSITE TYPES =============

/**
 * Table status summary
 * Used for dashboard display showing table occupancy
 */
export interface TableStatusSummary {
  tableId: DocumentId
  tableNumber: string
  status: RestaurantTableDocument['status']
  capacity: number
  section?: string | null
}

/**
 * Table layout data
 * Used for visual table management UI
 */
export interface TableLayoutData extends RestaurantTableDocument {
  // Denormalized fields for UI
  occupancyPercentage?: number
  occupancyStatus?: 'empty' | 'partial' | 'full'
}

/**
 * Table occupancy analytics
 * Used for restaurant analytics and reporting
 */
export interface TableOccupancyAnalytics {
  totalTables: number
  occupiedTables: number
  availableTables: number
  reservedTables: number
  maintenanceTables: number
  occupancyPercentage: number
  averageTableTurnover?: number
}

/**
 * Table status change log entry
 * For audit trail of table status changes
 */
export interface TableStatusChangeLog {
  tableId: DocumentId
  previousStatus: RestaurantTableDocument['status']
  newStatus: RestaurantTableDocument['status']
  changedAt: FirestoreTimestamp
  changedBy: DocumentId
  reason?: string | null
}

