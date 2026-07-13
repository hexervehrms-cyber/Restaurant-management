/**
 * Kitchen Status Log Repository
 * Handles all Firestore operations for Kitchen Status Log documents
 * Nested under KitchenTicket documents
 * 
 * Features:
 * - CRUD operations with audit fields
 * - Soft delete and restore
 * - Tenant isolation
 * - Advanced filtering and pagination
 * - Transaction and batch support
 * - Audit trail operations
 * 
 * Usage:
 *   const repo = new KitchenStatusLogRepository()
 *   const logs = await repo.findByTicket(ticketId, orgId)
 */

import { BaseRepository, IRepository } from './'
import {
  KitchenStatusLogDocument,
  CreateKitchenStatusLogPayload,
  UpdateKitchenStatusLogPayload,
  KitchenTicketStatus,
} from '../types/firestore'
import { COLLECTIONS } from '../firestore/collections'
import { QueryOptions, CreateResult, UpdateResult } from '../types/firestore'

export class KitchenStatusLogRepository extends BaseRepository<KitchenStatusLogDocument>
  implements IRepository<KitchenStatusLogDocument> {
  constructor() {
    super(COLLECTIONS.kitchenStatusLogs || 'kitchenStatusLogs')
  }

  /**
   * Find kitchen status logs by ticket
   * @param kitchenTicketId - Kitchen ticket ID
   * @param organizationId - Organization ID
   * @param options - Query options for filtering and ordering
   * @returns Array of kitchen status logs
   */
  async findByTicket(
    kitchenTicketId: string,
    organizationId: string,
    options?: QueryOptions
  ): Promise<KitchenStatusLogDocument[]> {
    const filters = [
      { field: 'kitchenTicketId', operator: '==' as const, value: kitchenTicketId },
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
   * Find status logs with specific new status
   * @param kitchenTicketId - Kitchen ticket ID
   * @param newStatus - New status
   * @param organizationId - Organization ID
   * @returns Array of status logs
   */
  async findByNewStatus(
    kitchenTicketId: string,
    newStatus: KitchenTicketStatus,
    organizationId: string
  ): Promise<KitchenStatusLogDocument[]> {
    return this.findMany({
      filters: [
        { field: 'kitchenTicketId', operator: '==' as const, value: kitchenTicketId },
        { field: 'newStatus', operator: '==' as const, value: newStatus },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Count status logs for a ticket
   * @param kitchenTicketId - Kitchen ticket ID
   * @param organizationId - Organization ID
   * @returns Count of status logs
   */
  async countByTicket(
    kitchenTicketId: string,
    organizationId: string
  ): Promise<number> {
    return this.count({
      filters: [
        { field: 'kitchenTicketId', operator: '==' as const, value: kitchenTicketId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Log status change (create operation)
   * @param kitchenTicketId - Kitchen ticket ID
   * @param previousStatus - Previous status
   * @param newStatus - New status
   * @param notes - Change notes
   * @param changedById - User ID who made change
   * @param organizationId - Organization ID
   * @param userId - User performing log creation
   * @returns Create result
   */
  async logStatusChange(
    kitchenTicketId: string,
    previousStatus: KitchenTicketStatus | null,
    newStatus: KitchenTicketStatus,
    notes: string | null,
    changedById: string | null,
    organizationId: string,
    userId: string
  ): Promise<CreateResult<KitchenStatusLogDocument>> {
    const payload: CreateKitchenStatusLogPayload = {
      kitchenTicketId,
      previousStatus,
      newStatus,
      notes,
      changedById: changedById || null,
    }

    // Note: organizationId will be added by create method
    // This uses a direct create to add organizationId properly
    return this.create(
      {
        ...payload,
        organizationId,
      } as any,
      userId,
      organizationId
    )
  }

  /**
   * Get status transition history
   * @param kitchenTicketId - Kitchen ticket ID
   * @param organizationId - Organization ID
   * @returns Array of status logs ordered by creation time
   */
  async getStatusHistory(
    kitchenTicketId: string,
    organizationId: string
  ): Promise<KitchenStatusLogDocument[]> {
    return this.findByTicket(kitchenTicketId, organizationId, {
      orders: [{ field: 'createdAt', direction: 'asc' }],
    })
  }
}

export type {
  KitchenStatusLogDocument,
  CreateKitchenStatusLogPayload,
  UpdateKitchenStatusLogPayload,
}
