/**
 * Kitchen Ticket Item Repository
 * Handles all Firestore operations for Kitchen Ticket Item documents
 * Nested under KitchenTicket documents
 * 
 * Features:
 * - CRUD operations with audit fields
 * - Soft delete and restore
 * - Tenant isolation
 * - Advanced filtering and pagination
 * - Transaction and batch support
 * 
 * Usage:
 *   const repo = new KitchenTicketItemRepository()
 *   const items = await repo.findByTicket(ticketId, orgId)
 */

import { BaseRepository, IRepository } from './'
import {
  KitchenTicketItemDocument,
  CreateKitchenTicketItemPayload,
  UpdateKitchenTicketItemPayload,
} from '../types/firestore'
import { COLLECTIONS } from '../firestore/collections'
import { QueryOptions, CreateResult, UpdateResult } from '../types/firestore'
import * as admin from 'firebase-admin'

export class KitchenTicketItemRepository extends BaseRepository<KitchenTicketItemDocument>
  implements IRepository<KitchenTicketItemDocument> {
  constructor() {
    super(COLLECTIONS.kitchenTicketItems)
  }

  /**
   * Find kitchen ticket items by ticket
   * @param kitchenTicketId - Kitchen ticket ID
   * @param organizationId - Organization ID
   * @param options - Query options for filtering and ordering
   * @returns Array of kitchen ticket items
   */
  async findByTicket(
    kitchenTicketId: string,
    organizationId: string,
    options?: QueryOptions
  ): Promise<KitchenTicketItemDocument[]> {
    const filters = [
      { field: 'kitchenTicketId', operator: '==' as const, value: kitchenTicketId },
      { field: 'organizationId', operator: '==' as const, value: organizationId },
      ...(options?.filters || []),
    ]

    return this.findMany({
      ...options,
      filters,
    })
  }

  /**
   * Find kitchen ticket items by order item
   * @param orderItemId - Order item ID
   * @param organizationId - Organization ID
   * @returns Array of kitchen ticket items
   */
  async findByOrderItem(
    orderItemId: string,
    organizationId: string
  ): Promise<KitchenTicketItemDocument[]> {
    return this.findMany({
      filters: [
        { field: 'orderItemId', operator: '==' as const, value: orderItemId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Count items in a kitchen ticket
   * @param kitchenTicketId - Kitchen ticket ID
   * @param organizationId - Organization ID
   * @returns Count of items
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
   * Find items by status
   * @param status - Item status
   * @param kitchenTicketId - Kitchen ticket ID
   * @param organizationId - Organization ID
   * @returns Array of items
   */
  async findByStatus(
    status: string,
    kitchenTicketId: string,
    organizationId: string
  ): Promise<KitchenTicketItemDocument[]> {
    return this.findMany({
      filters: [
        { field: 'status', operator: '==' as const, value: status },
        { field: 'kitchenTicketId', operator: '==' as const, value: kitchenTicketId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Update item status
   * @param itemId - Item ID
   * @param status - New status
   * @param userId - User performing update
   * @returns Update result
   */
  async updateStatus(
    itemId: string,
    status: string,
    userId: string
  ): Promise<UpdateResult<KitchenTicketItemDocument>> {
    return this.update(
      itemId,
      { status } as Partial<KitchenTicketItemDocument>,
      userId
    )
  }
}

export type {
  KitchenTicketItemDocument,
  CreateKitchenTicketItemPayload,
  UpdateKitchenTicketItemPayload,
}
