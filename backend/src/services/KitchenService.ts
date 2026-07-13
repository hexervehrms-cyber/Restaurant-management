/**
 * Kitchen Service
 * High-level business logic for kitchen operations
 * 
 * Features:
 * - Kitchen ticket creation and management
 * - Status transitions and workflows
 * - Kitchen section management
 * - Kitchen dashboard data aggregation
 * - Multi-tenancy support
 * 
 * Usage:
 *   const service = new KitchenService()
 *   const ticket = await service.createKitchenTicket(data)
 *   const status = await service.getKitchenLiveStatus(branchId, orgId)
 */

import {
  KitchenTicketRepository,
  KitchenSectionRepository,
  KitchenTicketItemRepository,
  KitchenStatusLogRepository,
} from '../repositories'
import {
  KitchenTicketDocument,
  CreateKitchenTicketPayload,
  KitchenTicketStatus,
  KitchenSectionDocument,
  CreateKitchenSectionPayload,
  KitchenTicketItemDocument,
  CreateKitchenTicketItemPayload,
  KitchenLiveStatus,
  CreateResult,
  UpdateResult,
  DeleteResult,
} from '../types/firestore'
import * as admin from 'firebase-admin'

export class KitchenService {
  private ticketRepository: KitchenTicketRepository
  private sectionRepository: KitchenSectionRepository
  private itemRepository: KitchenTicketItemRepository
  private logRepository: KitchenStatusLogRepository

  constructor() {
    this.ticketRepository = new KitchenTicketRepository()
    this.sectionRepository = new KitchenSectionRepository()
    this.itemRepository = new KitchenTicketItemRepository()
    this.logRepository = new KitchenStatusLogRepository()
  }

  /**
   * Generate kitchen ticket number for the day
   * Format: KT-YYYYMMDD-XXXX (4 digit counter)
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Unique ticket number
   */
  private async generateTicketNumber(
    branchId: string,
    organizationId: string
  ): Promise<string> {
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
    const count = await this.ticketRepository.countTodayTickets(
      branchId,
      organizationId
    )
    return `KT-${dateStr}-${String(count + 1).padStart(4, '0')}`
  }

  /**
   * Create a kitchen ticket from an order
   * @param orderId - Order ID
   * @param orderItems - Order items with details
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID
   * @param tableNumber - Table number (optional)
   * @param customerName - Customer name (optional)
   * @param specialInstructions - Special instructions (optional)
   * @param userId - User creating the ticket
   * @returns Kitchen ticket with items
   */
  async createKitchenTicket(
    orderId: string,
    orderItems: Array<{
      id: string
      itemName: string
      quantity: number
      specialInstructions?: string | null
    }>,
    branchId: string,
    restaurantId: string,
    organizationId: string,
    tableNumber: string | null,
    customerName: string | null,
    specialInstructions: string | null,
    userId: string
  ): Promise<{ ticket: KitchenTicketDocument; items: KitchenTicketItemDocument[] }> {
    // Find default kitchen section
    const sections = await this.sectionRepository.findActiveSections(
      branchId,
      organizationId
    )

    if (sections.length === 0) {
      throw new Error('No active kitchen section found for this branch')
    }

    const kitchenSection = sections[0]

    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber(branchId, organizationId)

    // Create kitchen ticket
    const ticketPayload: CreateKitchenTicketPayload = {
      orderId,
      kitchenSectionId: kitchenSection.id,
      ticketNumber,
      status: 'pending',
      priority: 0,
      tableNumber,
      customerName,
      specialInstructions,
      estimatedCompletionTime: null,
      startedAt: null,
      completedAt: null,
      cancelledAt: null,
      metadata: {},
    }

    const ticketResult = await this.ticketRepository.create(
      ticketPayload,
      userId,
      organizationId
    )

    if (!ticketResult.success || !ticketResult.data) {
      throw new Error('Failed to create kitchen ticket')
    }

    const ticket = ticketResult.data

    // Create ticket items
    const items: KitchenTicketItemDocument[] = []
    for (const orderItem of orderItems) {
      const itemPayload: CreateKitchenTicketItemPayload = {
        kitchenTicketId: ticket.id,
        orderItemId: orderItem.id,
        itemName: orderItem.itemName,
        quantity: orderItem.quantity,
        specialInstructions: orderItem.specialInstructions || null,
        status: 'pending',
      }

      const itemResult = await this.itemRepository.create(
        itemPayload,
        userId,
        organizationId
      )

      if (itemResult.success && itemResult.data) {
        items.push(itemResult.data)
      }
    }

    // Log initial status
    await this.logRepository.logStatusChange(
      ticket.id,
      null,
      'pending',
      'Kitchen ticket created from order',
      userId,
      organizationId,
      userId
    )

    return { ticket, items }
  }

  /**
   * Update kitchen ticket status with audit trail
   * @param ticketId - Ticket ID
   * @param newStatus - New status
   * @param organizationId - Organization ID
   * @param userId - User making change
   * @returns Updated ticket
   */
  async updateTicketStatus(
    ticketId: string,
    newStatus: KitchenTicketStatus,
    organizationId: string,
    userId: string
  ): Promise<UpdateResult<KitchenTicketDocument>> {
    // Get current ticket to track previous status
    const ticket = await this.ticketRepository.findById(ticketId)
    if (!ticket) {
      return { success: false, error: 'Kitchen ticket not found' }
    }

    // Handle status-specific timing
    let updates: Partial<KitchenTicketDocument> = { status: newStatus }

    if (newStatus === 'preparing' && !ticket.startedAt) {
      updates.startedAt = admin.firestore.Timestamp.now()
    } else if (newStatus === 'ready' && !ticket.completedAt) {
      updates.completedAt = admin.firestore.Timestamp.now()
    } else if (newStatus === 'completed' && !ticket.completedAt) {
      updates.completedAt = admin.firestore.Timestamp.now()
    } else if (newStatus === 'cancelled' && !ticket.cancelledAt) {
      updates.cancelledAt = admin.firestore.Timestamp.now()
    }

    // Update ticket
    const result = await this.ticketRepository.update(ticketId, updates, userId)

    // Log status change
    if (result.success && result.data) {
      await this.logRepository.logStatusChange(
        ticketId,
        ticket.status,
        newStatus,
        `Status changed from ${ticket.status} to ${newStatus}`,
        userId,
        organizationId,
        userId
      )
    }

    return result
  }

  /**
   * Mark ticket as started
   * @param ticketId - Ticket ID
   * @param organizationId - Organization ID
   * @param userId - User making change
   * @returns Updated ticket
   */
  async startTicket(
    ticketId: string,
    organizationId: string,
    userId: string
  ): Promise<UpdateResult<KitchenTicketDocument>> {
    return this.updateTicketStatus(ticketId, 'preparing', organizationId, userId)
  }

  /**
   * Mark ticket as ready
   * @param ticketId - Ticket ID
   * @param organizationId - Organization ID
   * @param userId - User making change
   * @returns Updated ticket
   */
  async markReady(
    ticketId: string,
    organizationId: string,
    userId: string
  ): Promise<UpdateResult<KitchenTicketDocument>> {
    return this.updateTicketStatus(ticketId, 'ready', organizationId, userId)
  }

  /**
   * Mark ticket as completed
   * @param ticketId - Ticket ID
   * @param organizationId - Organization ID
   * @param userId - User making change
   * @returns Updated ticket
   */
  async completeTicket(
    ticketId: string,
    organizationId: string,
    userId: string
  ): Promise<UpdateResult<KitchenTicketDocument>> {
    return this.updateTicketStatus(ticketId, 'completed', organizationId, userId)
  }

  /**
   * Cancel kitchen ticket
   * @param ticketId - Ticket ID
   * @param organizationId - Organization ID
   * @param userId - User making change
   * @returns Updated ticket
   */
  async cancelTicket(
    ticketId: string,
    organizationId: string,
    userId: string
  ): Promise<UpdateResult<KitchenTicketDocument>> {
    return this.updateTicketStatus(ticketId, 'cancelled', organizationId, userId)
  }

  /**
   * Get kitchen live status
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Kitchen live status
   */
  async getKitchenLiveStatus(
    branchId: string,
    organizationId: string
  ): Promise<KitchenLiveStatus> {
    const pendingCount = await this.ticketRepository.countByStatus(
      'pending',
      branchId,
      organizationId
    )
    const preparingCount = await this.ticketRepository.countByStatus(
      'preparing',
      branchId,
      organizationId
    )
    const activeCount = pendingCount + preparingCount

    return {
      isLive: activeCount > 0,
      activeTicketCount: activeCount,
      pendingCount,
      preparingCount,
    }
  }

  /**
   * Get active kitchen tickets for dashboard
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of active tickets
   */
  async getActiveTickets(
    branchId: string,
    organizationId: string
  ): Promise<KitchenTicketDocument[]> {
    return this.ticketRepository.findActiveTickets(branchId, organizationId)
  }

  /**
   * Get kitchen section
   * @param sectionId - Section ID
   * @returns Kitchen section
   */
  async getKitchenSection(sectionId: string): Promise<KitchenSectionDocument | null> {
    return this.sectionRepository.findById(sectionId)
  }

  /**
   * Get all active kitchen sections for branch
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of kitchen sections
   */
  async getActiveSections(
    branchId: string,
    organizationId: string
  ): Promise<KitchenSectionDocument[]> {
    return this.sectionRepository.findActiveSections(branchId, organizationId)
  }

  /**
   * Create kitchen section
   * @param payload - Create payload
   * @param organizationId - Organization ID
   * @param userId - User creating section
   * @returns Created kitchen section
   */
  async createKitchenSection(
    payload: CreateKitchenSectionPayload,
    organizationId: string,
    userId: string
  ): Promise<CreateResult<KitchenSectionDocument>> {
    return this.sectionRepository.create(payload, userId, organizationId)
  }

  /**
   * Get ticket items
   * @param ticketId - Ticket ID
   * @param organizationId - Organization ID
   * @returns Array of ticket items
   */
  async getTicketItems(
    ticketId: string,
    organizationId: string
  ): Promise<KitchenTicketItemDocument[]> {
    return this.itemRepository.findByTicket(ticketId, organizationId)
  }

  /**
   * Get status history for ticket
   * @param ticketId - Ticket ID
   * @param organizationId - Organization ID
   * @returns Array of status logs
   */
  async getStatusHistory(
    ticketId: string,
    organizationId: string
  ) {
    return this.logRepository.getStatusHistory(ticketId, organizationId)
  }
}
