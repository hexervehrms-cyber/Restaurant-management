/**
 * Notification Repository
 * Handles all Firestore operations for Notification documents
 * 
 * Features:
 * - CRUD operations with audit fields
 * - Soft delete and restore
 * - Tenant isolation (organization scoped)
 * - Advanced filtering and pagination
 * - Transaction and batch support
 * - User notification queries
 * 
 * Usage:
 *   const repo = new NotificationRepository()
 *   const notif = await repo.create(data, userId, orgId)
 *   const found = await repo.findById(id)
 *   const updated = await repo.update(id, updates, userId)
 */

import { BaseRepository, IRepository } from './'
import {
  NotificationDocument,
  CreateNotificationPayload,
  UpdateNotificationPayload,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationCounts,
} from '../types/firestore'
import { COLLECTIONS } from '../firestore/collections'
import { QueryOptions, CreateResult, UpdateResult } from '../types/firestore'

export class NotificationRepository extends BaseRepository<NotificationDocument>
  implements IRepository<NotificationDocument> {
  constructor() {
    super(COLLECTIONS.notifications)
  }

  /**
   * Find notifications for a user
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @param options - Query options for filtering and ordering
   * @returns Array of notifications
   */
  async findByUser(
    userId: string,
    organizationId: string,
    options?: QueryOptions
  ): Promise<NotificationDocument[]> {
    const filters = [
      { field: 'userId', operator: '==' as const, value: userId },
      { field: 'organizationId', operator: '==' as const, value: organizationId },
      ...(options?.filters || []),
    ]

    return this.findMany({
      ...options,
      filters,
      orders: [
        { field: 'createdAt', direction: 'desc' },
        ...(options?.orders || []),
      ],
    })
  }

  /**
   * Find unread notifications for a user
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @returns Array of unread notifications
   */
  async findUnreadByUser(
    userId: string,
    organizationId: string
  ): Promise<NotificationDocument[]> {
    return this.findMany({
      filters: [
        { field: 'userId', operator: '==' as const, value: userId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isRead', operator: '==' as const, value: false },
      ],
      orders: [{ field: 'createdAt', direction: 'desc' }],
    })
  }

  /**
   * Find read notifications for a user
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @returns Array of read notifications
   */
  async findReadByUser(
    userId: string,
    organizationId: string
  ): Promise<NotificationDocument[]> {
    return this.findMany({
      filters: [
        { field: 'userId', operator: '==' as const, value: userId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isRead', operator: '==' as const, value: true },
      ],
      orders: [{ field: 'createdAt', direction: 'desc' }],
    })
  }

  /**
   * Find notifications by type
   * @param notificationType - Type of notification
   * @param userId - User ID (optional - if null, finds all notifications of this type)
   * @param organizationId - Organization ID
   * @returns Array of notifications
   */
  async findByType(
    notificationType: NotificationType,
    organizationId: string,
    userId?: string
  ): Promise<NotificationDocument[]> {
    const filters = [
      { field: 'notificationType', operator: '==' as const, value: notificationType },
      { field: 'organizationId', operator: '==' as const, value: organizationId },
    ]

    if (userId) {
      filters.push({ field: 'userId', operator: '==' as const, value: userId })
    }

    return this.findMany({
      filters,
      orders: [{ field: 'createdAt', direction: 'desc' }],
    })
  }

  /**
   * Count unread notifications for a user
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @returns Count of unread notifications
   */
  async countUnreadByUser(
    userId: string,
    organizationId: string
  ): Promise<number> {
    return this.count({
      filters: [
        { field: 'userId', operator: '==' as const, value: userId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isRead', operator: '==' as const, value: false },
      ],
    })
  }

  /**
   * Count notifications for a user
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @returns Total count of notifications
   */
  async countByUser(
    userId: string,
    organizationId: string
  ): Promise<number> {
    return this.count({
      filters: [
        { field: 'userId', operator: '==' as const, value: userId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Get notification counts for a user
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @returns Notification counts (total and unread)
   */
  async getCountsForUser(
    userId: string,
    organizationId: string
  ): Promise<NotificationCounts> {
    const totalCount = await this.countByUser(userId, organizationId)
    const unreadCount = await this.countUnreadByUser(userId, organizationId)

    return {
      total: totalCount,
      unread: unreadCount,
      read: totalCount - unreadCount,
    }
  }

  /**
   * Mark notification as read
   * @param notificationId - Notification ID
   * @param userId - User marking as read
   * @returns Update result
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<UpdateResult<NotificationDocument>> {
    return this.update(
      notificationId,
      {
        isRead: true,
        readAt: new Date(),
      } as Partial<NotificationDocument>,
      userId
    )
  }

  /**
   * Mark notification as unread
   * @param notificationId - Notification ID
   * @param userId - User marking as unread
   * @returns Update result
   */
  async markAsUnread(
    notificationId: string,
    userId: string
  ): Promise<UpdateResult<NotificationDocument>> {
    return this.update(
      notificationId,
      {
        isRead: false,
        readAt: null,
      } as Partial<NotificationDocument>,
      userId
    )
  }

  /**
   * Mark all notifications as read for a user
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @param userIdMakingChange - User performing the operation
   * @returns Batch result
   */
  async markAllAsReadForUser(
    userId: string,
    organizationId: string,
    userIdMakingChange: string
  ) {
    const unreadNotifications = await this.findUnreadByUser(userId, organizationId)

    if (unreadNotifications.length === 0) {
      return { success: true, successCount: 0, failureCount: 0, errors: [] }
    }

    const batch = this.db.batch()
    const now = new Date()

    for (const notif of unreadNotifications) {
      const docRef = this.collection.doc(notif.id)
      batch.update(docRef, {
        isRead: true,
        readAt: now,
        updatedBy: userIdMakingChange,
        updatedAt: now,
      })
    }

    try {
      await batch.commit()
      return {
        success: true,
        successCount: unreadNotifications.length,
        failureCount: 0,
        errors: [],
      }
    } catch (error: any) {
      return {
        success: false,
        successCount: 0,
        failureCount: unreadNotifications.length,
        errors: [{ docId: 'batch', error: error.message }],
      }
    }
  }

  /**
   * Delete old notifications (older than specified date)
   * @param beforeDate - Delete notifications created before this date
   * @param organizationId - Organization ID
   * @param userIdMakingChange - User performing the operation
   * @returns Batch result
   */
  async deleteOldNotifications(
    beforeDate: Date,
    organizationId: string,
    userIdMakingChange: string
  ) {
    const oldNotifications = await this.findMany({
      filters: [
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'createdAt', operator: '<', value: beforeDate },
      ],
    })

    if (oldNotifications.length === 0) {
      return { success: true, successCount: 0, failureCount: 0, errors: [] }
    }

    const batch = this.db.batch()
    const now = new Date()

    for (const notif of oldNotifications) {
      const docRef = this.collection.doc(notif.id)
      batch.update(docRef, {
        isDeleted: true,
        deletedAt: now,
        deletedBy: userIdMakingChange,
      })
    }

    try {
      await batch.commit()
      return {
        success: true,
        successCount: oldNotifications.length,
        failureCount: 0,
        errors: [],
      }
    } catch (error: any) {
      return {
        success: false,
        successCount: 0,
        failureCount: oldNotifications.length,
        errors: [{ docId: 'batch', error: error.message }],
      }
    }
  }
}

export type {
  NotificationDocument,
  CreateNotificationPayload,
  UpdateNotificationPayload,
  NotificationCounts,
}
