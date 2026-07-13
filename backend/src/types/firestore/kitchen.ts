/**
 * Kitchen Module Firestore Document Types
 * Defines all Kitchen-related Firestore documents
 * 
 * HIERARCHY:
 * - KitchenSection (branch-scoped root document)
 * - KitchenTicket (branch-scoped root document)
 *   ├─ KitchenTicketItem (nested items)
 *   └─ KitchenStatusLog (status audit trail)
 */

import { BranchScopedDocument, FirestoreTimestamp, DocumentId } from './index'

// ============= KITCHEN STATUS TYPES =============

export type KitchenTicketStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type KitchenSectionType = 'main' | 'pastry' | 'beverages' | 'salads' | 'grill' | 'other'

// ============= KITCHEN SECTION DOCUMENT =============

/**
 * Kitchen Section Document
 * Represents a kitchen area/station where orders are prepared
 * Branch-scoped
 * 
 * Firestore Path: /kitchenSections/{sectionId}
 * Collection: COLLECTIONS.kitchenSections
 * Scope: BranchScopedDocument (organizationId + restaurantId + branchId)
 */
export interface KitchenSectionDocument extends BranchScopedDocument {
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

  // Section Information
  name: string
  description: string | null
  sectionType: KitchenSectionType | null
  displayOrder: number
  
  // Section Status
  isActive: boolean
  
  // Additional Data
  metadata: Record<string, any>

  // Unique Index: branchId + name
  // @@unique([branchId, name])
}

/**
 * Create payload for Kitchen Section
 */
export interface CreateKitchenSectionPayload
  extends Omit<KitchenSectionDocument, keyof BranchScopedDocument> {}

/**
 * Update payload for Kitchen Section
 */
export interface UpdateKitchenSectionPayload extends Partial<CreateKitchenSectionPayload> {}

// ============= KITCHEN TICKET DOCUMENT =============

/**
 * Kitchen Ticket Document
 * Represents a cooking task/order sent to the kitchen
 * Branch-scoped
 * 
 * Firestore Path: /kitchenTickets/{ticketId}
 * Collection: COLLECTIONS.kitchenTickets
 * Scope: BranchScopedDocument (organizationId + restaurantId + branchId)
 */
export interface KitchenTicketDocument extends BranchScopedDocument {
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

  // Order Reference
  orderId: DocumentId
  
  // Kitchen Section Reference
  kitchenSectionId: DocumentId

  // Ticket Information
  ticketNumber: string
  status: KitchenTicketStatus
  priority: number

  // Customer Information
  tableNumber: string | null
  customerName: string | null
  specialInstructions: string | null

  // Timing
  estimatedCompletionTime: FirestoreTimestamp | null
  startedAt: FirestoreTimestamp | null
  completedAt: FirestoreTimestamp | null
  cancelledAt: FirestoreTimestamp | null

  // Additional Data
  metadata: Record<string, any>

  // Unique Index: branchId + ticketNumber
  // @@unique([branchId, ticketNumber])
  // Indexes: orderId, status
}

/**
 * Create payload for Kitchen Ticket
 */
export interface CreateKitchenTicketPayload
  extends Omit<KitchenTicketDocument, keyof BranchScopedDocument> {}

/**
 * Update payload for Kitchen Ticket
 */
export interface UpdateKitchenTicketPayload extends Partial<CreateKitchenTicketPayload> {}

// ============= KITCHEN TICKET ITEM DOCUMENT =============

/**
 * Kitchen Ticket Item Document
 * Represents individual menu items within a kitchen ticket
 * Nested under KitchenTicket
 * 
 * Firestore Path: /kitchenTickets/{ticketId}/items/{itemId}
 * Collection: Dynamic, nested under kitchen ticket
 * Scope: Organization-scoped (inherits from parent KitchenTicket)
 */
export interface KitchenTicketItemDocument extends Omit<BranchScopedDocument, 'branchId'> {
  // Parent Reference
  kitchenTicketId: DocumentId
  orderItemId: DocumentId

  // Item Information
  itemName: string | null
  quantity: number
  specialInstructions: string | null
  status: string

  // Timestamps (use base document fields)
  // createdAt: FirestoreTimestamp
  // updatedAt: FirestoreTimestamp

  // Index: kitchenTicketId
}

/**
 * Create payload for Kitchen Ticket Item
 */
export interface CreateKitchenTicketItemPayload
  extends Omit<KitchenTicketItemDocument, keyof BranchScopedDocument | 'kitchenTicketId'> {}

/**
 * Update payload for Kitchen Ticket Item
 */
export interface UpdateKitchenTicketItemPayload extends Partial<CreateKitchenTicketItemPayload> {}

// ============= KITCHEN STATUS LOG DOCUMENT =============

/**
 * Kitchen Status Log Document
 * Audit trail for kitchen ticket status changes
 * Nested under KitchenTicket
 * 
 * Firestore Path: /kitchenTickets/{ticketId}/statusLogs/{logId}
 * Collection: Dynamic, nested under kitchen ticket
 * Scope: Organization-scoped (inherits from parent KitchenTicket)
 */
export interface KitchenStatusLogDocument extends Omit<BranchScopedDocument, 'branchId'> {
  // Parent Reference
  kitchenTicketId: DocumentId

  // Status Change Information
  previousStatus: KitchenTicketStatus | null
  newStatus: KitchenTicketStatus
  notes: string | null
  changedById: DocumentId | null

  // Timestamps (use base document fields)
  // createdAt: FirestoreTimestamp

  // Index: kitchenTicketId
}

/**
 * Create payload for Kitchen Status Log
 */
export interface CreateKitchenStatusLogPayload
  extends Omit<KitchenStatusLogDocument, keyof BranchScopedDocument | 'kitchenTicketId'> {}

/**
 * Update payload for Kitchen Status Log
 */
export interface UpdateKitchenStatusLogPayload extends Partial<CreateKitchenStatusLogPayload> {}

// ============= COMPOSITE TYPES =============

/**
 * Kitchen Ticket with nested data (denormalized for API responses)
 * Used for API responses when full ticket data is needed
 */
export interface KitchenTicketWithDetails extends KitchenTicketDocument {
  items?: KitchenTicketItemDocument[]
  statusLogs?: KitchenStatusLogDocument[]
}

/**
 * Kitchen Ticket search result
 * Minimal data returned in search endpoints
 */
export interface KitchenTicketSearchResult {
  id: DocumentId
  ticketNumber: string
  status: KitchenTicketStatus
  tableNumber: string | null
  customerName: string | null
  priority: number
  createdAt: FirestoreTimestamp
}

/**
 * Kitchen Dashboard view
 * Formatted for kitchen display system
 */
export interface KitchenDashboardItem {
  id: DocumentId
  ticketNumber: string
  tableNumber: string | null
  customerName: string | null
  itemCount: number
  status: KitchenTicketStatus
  priority: number
  elapsedTime: number // seconds
  estimatedTime: number | null // seconds
  specialInstructions: string | null
  items: KitchenTicketItemDocument[]
}

/**
 * Kitchen live status
 * Used for dashboard sidebar indicators
 */
export interface KitchenLiveStatus {
  isLive: boolean
  activeTicketCount: number
  pendingCount: number
  preparingCount: number
}
