/**
 * Kitchen Ticket Repository
 * Handles all Firestore operations for Kitchen Ticket documents
 * 
 * Features:
 * - CRUD operations with audit fields
 * - Soft delete and restore
 * - Tenant isolation (branch scoped)
 * - Advanced filtering and pagination
 * - Transaction and batch support
 * - Ticket numbering and counting
 * 
 * Usage:
 *   const repo = new KitchenTicketRepository()
 *   const ticket = await repo.create(data, userId, orgId)
 *   const found = await repo.findById(id)
 *   const updated = await repo.update(id, updates, userId)
 */

import { BaseRepository, IRepository } from './'
import {
  KitchenTicketDocument,
  CreateKitchenTicketPayload,
  UpdateKitchenTicketPayload,
  KitchenTicketStatus,
  KitchenTicketWithDetails,
} from '../types/firestore'
import { COLLECTIONS } from '../firestore/collections'
import { QueryOptions, CreateResult, UpdateResult } from '../types/firestore'
import * as admin from 'firebase-admin'

export class KitchenTicketRepository extends BaseRepository<KitchenTicketDocument>
  implements IRepository<KitchenTicketDocument> {
  constructor() {
    super(COLLECTIONS.kitchenTickets)
  }

  /**
   * Find kitchen tickets by branch
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @param options - Query options for filtering and ordering
   * @returns Array of kitchen tickets
   */
  async findByBranch(
    branchId: string,
    organizationId: string,
    options?: QueryOptions
  ): Promise<KitchenTicketDocument[]> {
    const filters = [
      { field: 'branchId', operator: '==' as const, value: branchId },
      { field: 'organizationId', operator: '==' as const, value: organizationId },
      ...(options?.filters || []),
    ]

    return this.findMany({
      ...options,
      filters,
    })
  }

  /**
   * Find kitchen tickets by status
   * @param status - Ticket status
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of kitchen tickets
   */
  async findByStatus(
    status: KitchenTicketStatus,
    branchId: string,
    organizationId: string
  ): Promise<KitchenTicketDocument[]> {
    return this.findMany({
      filters: [
        { field: 'status', operator: '==' as const, value: status },
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Find kitchen tickets by order
   * @param orderId - Order ID
   * @param organizationId - Organization ID
   * @returns Array of kitchen tickets
   */
  async findByOrder(
    orderId: string,
    organizationId: string
  ): Promise<KitchenTicketDocument[]> {
    return this.findMany({
      filters: [
        { field: 'orderId', operator: '==' as const, value: orderId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Find kitchen tickets by kitchen section
   * @param kitchenSectionId - Kitchen section ID
   * @param organizationId - Organization ID
   * @returns Array of kitchen tickets
   */
  async findBySection(
    kitchenSectionId: string,
    organizationId: string
  ): Promise<KitchenTicketDocument[]> {
    return this.findMany({
      filters: [
        { field: 'kitchenSectionId', operator: '==' as const, value: kitchenSectionId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Find active kitchen tickets (pending or preparing)
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of active kitchen tickets
   */
  async findActiveTickets(
    branchId: string,
    organizationId: string
  ): Promise<KitchenTicketDocument[]> {
    return this.findMany({
      filters: [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'status', operator: 'in', value: ['pending', 'preparing'] },
      ],
    })
  }

  /**
   * Count kitchen tickets by status
   * @param status - Ticket status
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Count of kitchen tickets
   */
  async countByStatus(
    status: KitchenTicketStatus,
    branchId: string,
    organizationId: string
  ): Promise<number> {
    return this.count({
      filters: [
        { field: 'status', operator: '==' as const, value: status },
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Count active kitchen tickets in branch
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Count of active tickets
   */
  async countActiveTickets(
    branchId: string,
    organizationId: string
  ): Promise<number> {
    return this.count({
      filters: [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'status', operator: 'in', value: ['pending', 'preparing'] },
      ],
    })
  }

  /**
   * Count tickets created today
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Count of tickets created today
   */
  async countTodayTickets(
    branchId: string,
    organizationId: string
  ): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.count({
      filters: [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'createdAt', operator: '>=', value: today },
        { field: 'createdAt', operator: '<', value: tomorrow },
      ],
    })
  }

  /**
   * Find kitchen ticket by ticket number
   * @param ticketNumber - Ticket number
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Kitchen ticket or null
   */
  async findByTicketNumber(
    ticketNumber: string,
    branchId: string,
    organizationId: string
  ): Promise<KitchenTicketDocument | null> {
    const results = await this.findMany({
      filters: [
        { field: 'ticketNumber', operator: '==' as const, value: ticketNumber },
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })

    return results.length > 0 ? results[0] : null
  }

  /**
   * Update kitchen ticket status
   * @param ticketId - Ticket ID
   * @param status - New status
   * @param userId - User performing update
   * @returns Update result
   */
  async updateStatus(
    ticketId: string,
    status: KitchenTicketStatus,
    userId: string
  ): Promise<UpdateResult<KitchenTicketDocument>> {
    return this.update(
      ticketId,
      { status } as Partial<KitchenTicketDocument>,
      userId
    )
  }

  /**
   * Mark ticket as started
   * @param ticketId - Ticket ID
   * @param userId - User performing update
   * @returns Update result
   */
  async markStarted(
    ticketId: string,
    userId: string
  ): Promise<UpdateResult<KitchenTicketDocument>> {
    return this.update(
      ticketId,
      {
        status: 'preparing',
        startedAt: admin.firestore.Timestamp.now(),
      } as Partial<KitchenTicketDocument>,
      userId
    )
  }

  /**
   * Mark ticket as ready
   * @param ticketId - Ticket ID
   * @param userId - User performing update
   * @returns Update result
   */
  async markReady(
    ticketId: string,
    userId: string
  ): Promise<UpdateResult<KitchenTicketDocument>> {
    return this.update(
      ticketId,
      {
        status: 'ready',
        completedAt: admin.firestore.Timestamp.now(),
      } as Partial<KitchenTicketDocument>,
      userId
    )
  }

  /**
   * Mark ticket as completed
   * @param ticketId - Ticket ID
   * @param userId - User performing update
   * @returns Update result
   */
  async markCompleted(
    ticketId: string,
    userId: string
  ): Promise<UpdateResult<KitchenTicketDocument>> {
    return this.update(
      ticketId,
      {
        status: 'completed',
        completedAt: admin.firestore.Timestamp.now(),
      } as Partial<KitchenTicketDocument>,
      userId
    )
  }

  /**
   * Cancel kitchen ticket
   * @param ticketId - Ticket ID
   * @param userId - User performing update
   * @returns Update result
   */
  async cancel(
    ticketId: string,
    userId: string
  ): Promise<UpdateResult<KitchenTicketDocument>> {
    return this.update(
      ticketId,
      {
        status: 'cancelled',
        cancelledAt: admin.firestore.Timestamp.now(),
      } as Partial<KitchenTicketDocument>,
      userId
    )
  }

  /**
   * Update ticket priority
   * @param ticketId - Ticket ID
   * @param priority - New priority
   * @param userId - User performing update
   * @returns Update result
   */
  async updatePriority(
    ticketId: string,
    priority: number,
    userId: string
  ): Promise<UpdateResult<KitchenTicketDocument>> {
    return this.update(
      ticketId,
      { priority } as Partial<KitchenTicketDocument>,
      userId
    )
  }
}

export type {
  KitchenTicketDocument,
  CreateKitchenTicketPayload,
  UpdateKitchenTicketPayload,
  KitchenTicketWithDetails,
}
