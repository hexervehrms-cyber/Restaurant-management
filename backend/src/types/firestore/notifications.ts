/**
 * Notifications Module Firestore Document Types
 * Defines all Notification-related Firestore documents
 * 
 * HIERARCHY:
 * - Notification (organization-scoped root document)
 */

import { BaseDocument, FirestoreTimestamp, DocumentId } from './index'

// ============= NOTIFICATION STATUS TYPES =============

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled'
export type NotificationType = 'order' | 'reservation' | 'payment' | 'kitchen' | 'system' | 'announcement' | 'reminder' | 'alert' | 'other'
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'whatsapp'

// ============= NOTIFICATION DOCUMENT =============

/**
 * Notification Document
 * Represents a notification for a user
 * Organization-scoped
 * 
 * Firestore Path: /notifications/{notificationId}
 * Collection: COLLECTIONS.notifications
 * Scope: BaseDocument (organizationId)
 */
export interface NotificationDocument extends BaseDocument {
  // Core Identifiers (inherited from BaseDocument)
  // id: DocumentId
  // organizationId: string
  
  // Audit Fields (inherited from BaseDocument)
  // createdAt: FirestoreTimestamp
  // updatedAt: FirestoreTimestamp
  // createdBy: string
  // updatedBy: string
  
  // Soft Delete Fields (inherited from BaseDocument)
  // deletedAt: FirestoreTimestamp | null
  // isDeleted: boolean
  // deletedBy: string | null

  // User Reference
  userId: DocumentId | null

  // Notification Content
  notificationType: NotificationType
  title: string | null
  message: string | null
  data: Record<string, any>

  // Notification Status
  isRead: boolean
  readAt: FirestoreTimestamp | null
  
  // Channel Information (for future multi-channel support)
  channels?: NotificationChannel[]
  status?: NotificationStatus

  // Index: userId, isRead
}

/**
 * Create payload for Notification
 */
export interface CreateNotificationPayload
  extends Omit<NotificationDocument, keyof BaseDocument> {}

/**
 * Update payload for Notification
 */
export interface UpdateNotificationPayload extends Partial<CreateNotificationPayload> {}

// ============= COMPOSITE TYPES =============

/**
 * Notification with formatted time
 * Used for API responses
 */
export interface NotificationWithFormatting extends NotificationDocument {
  timeAgo: string
  formattedTime: string
}

/**
 * Notification search result
 * Minimal data for list endpoints
 */
export interface NotificationListItem {
  id: DocumentId
  type: NotificationType
  title: string | null
  message: string | null
  isRead: boolean
  createdAt: FirestoreTimestamp
  timeAgo: string
}

/**
 * Notifications count summary
 * For dashboard indicators
 */
export interface NotificationCounts {
  total: number
  unread: number
  read: number
}
