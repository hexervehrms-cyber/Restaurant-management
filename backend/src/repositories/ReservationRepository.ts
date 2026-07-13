/**
 * Reservation Repository
 * Handles all Firestore operations for Reservation documents
 * 
 * Features:
 * - CRUD operations with audit fields
 * - Soft delete and restore
 * - Tenant isolation (organization, restaurant, branch scoped)
 * - Advanced filtering and pagination
 * - Transaction and batch support
 * 
 * Usage:
 *   const repo = new ReservationRepository()
 *   const reservation = await repo.create(data, userId, orgId)
 *   const found = await repo.findById(id)
 *   const updated = await repo.update(id, updates, userId)
 */

import { BaseRepository, IRepository } from './'
import {
  ReservationDocument,
  CreateReservationPayload,
  UpdateReservationPayload,
  ReservationListItem,
  ReservationStatus,
} from '../types/firestore'
import { COLLECTIONS } from '../firestore/collections'
import { QueryOptions, CreateResult, UpdateResult } from '../types/firestore'

export class ReservationRepository extends BaseRepository<ReservationDocument> implements IRepository<ReservationDocument> {
  constructor() {
    super(COLLECTIONS.reservations)
  }

  /**
   * Find reservations by branch
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @param options - Query options for filtering and ordering
   * @returns Array of reservations
   */
  async findByBranch(
    branchId: string,
    organizationId: string,
    options?: QueryOptions
  ): Promise<ReservationDocument[]> {
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
   * Find reservations by customer
   * @param customerId - Customer ID
   * @param organizationId - Organization ID
   * @returns Array of reservations
   */
  async findByCustomer(
    customerId: string,
    organizationId: string
  ): Promise<ReservationDocument[]> {
    return this.findMany({
      filters: [
        { field: 'customerId', operator: '==' as const, value: customerId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
      orders: [{ field: 'reservationDate', direction: 'desc' }],
    })
  }

  /**
   * Find reservations by status
   * @param status - Reservation status
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of reservations
   */
  async findByStatus(
    status: ReservationStatus,
    branchId: string,
    organizationId: string
  ): Promise<ReservationDocument[]> {
    return this.findMany({
      filters: [
        { field: 'status', operator: '==' as const, value: status },
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Find reservations by date range
   * @param startDate - Start date
   * @param endDate - End date
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of reservations
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    branchId: string,
    organizationId: string
  ): Promise<ReservationDocument[]> {
    return this.findMany({
      filters: [
        { field: 'reservationDate', operator: '>=', value: startDate },
        { field: 'reservationDate', operator: '<=', value: endDate },
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
      orders: [{ field: 'reservationDate', direction: 'asc' }],
    })
  }

  /**
   * Find reservation by table for a specific date
   * @param tableId - Table ID
   * @param reservationDate - Reservation date
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Reservation or null
   */
  async findByTableAndDate(
    tableId: string,
    reservationDate: Date,
    branchId: string,
    organizationId: string
  ): Promise<ReservationDocument | null> {
    const results = await this.findMany({
      filters: [
        { field: 'tableId', operator: '==' as const, value: tableId },
        { field: 'reservationDate', operator: '==' as const, value: reservationDate },
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'status', operator: '!=', value: 'cancelled' },
      ],
    })

    return results.length > 0 ? results[0] : null
  }

  /**
   * Count reservations by status
   * @param status - Reservation status
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Count of reservations
   */
  async countByStatus(
    status: ReservationStatus,
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
   * Count all active reservations for today
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Count of active reservations
   */
  async countTodayActive(
    branchId: string,
    organizationId: string
  ): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.count({
      filters: [
        { field: 'reservationDate', operator: '>=', value: today },
        { field: 'reservationDate', operator: '<', value: tomorrow },
        { field: 'status', operator: '!=', value: 'cancelled' },
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Update reservation status
   * @param reservationId - Reservation ID
   * @param status - New status
   * @param userId - User performing update
   * @returns Update result
   */
  async updateStatus(
    reservationId: string,
    status: ReservationStatus,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.update(reservationId, { status } as Partial<ReservationDocument>, userId)
  }

  /**
   * Update reservation payment status
   * @param reservationId - Reservation ID
   * @param paymentStatus - New payment status
   * @param userId - User performing update
   * @returns Update result
   */
  async updatePaymentStatus(
    reservationId: string,
    paymentStatus: string,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.update(
      reservationId,
      { advancePaymentStatus: paymentStatus } as Partial<ReservationDocument>,
      userId
    )
  }

  /**
   * Mark reservation as checked in
   * @param reservationId - Reservation ID
   * @param userId - User performing update
   * @returns Update result
   */
  async checkIn(
    reservationId: string,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.updateStatus(reservationId, 'checked_in', userId)
  }

  /**
   * Mark reservation as completed
   * @param reservationId - Reservation ID
   * @param userId - User performing update
   * @returns Update result
   */
  async complete(
    reservationId: string,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.updateStatus(reservationId, 'completed', userId)
  }

  /**
   * Cancel reservation
   * @param reservationId - Reservation ID
   * @param cancellationReason - Reason for cancellation
   * @param userId - User performing update
   * @returns Update result
   */
  async cancel(
    reservationId: string,
    cancellationReason: string,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.update(
      reservationId,
      { status: 'cancelled', cancellationReason } as Partial<ReservationDocument>,
      userId
    )
  }

  /**
   * Mark reservation as no-show
   * @param reservationId - Reservation ID
   * @param noShowReason - Reason for no-show
   * @param userId - User performing update
   * @returns Update result
   */
  async markNoShow(
    reservationId: string,
    noShowReason: string,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.update(
      reservationId,
      { status: 'no_show', noShowReason } as Partial<ReservationDocument>,
      userId
    )
  }
}

export type { ReservationDocument, CreateReservationPayload, UpdateReservationPayload }
