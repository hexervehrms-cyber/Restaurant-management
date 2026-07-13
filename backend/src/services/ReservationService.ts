/**
 * Reservation Service
 * High-level business logic for reservation operations
 * 
 * Responsibilities:
 * - Reservation CRUD operations
 * - Availability checking
 * - Payment processing
 * - No-show tracking
 * - Status management
 * 
 * Does NOT handle:
 * - Direct HTTP/API logic
 * - Response formatting
 * - Authentication/Authorization
 */

import {
  ReservationRepository,
  ReservationPaymentRepository,
  ReservationNoShowLogRepository,
} from '../repositories'
import {
  ReservationDocument,
  CreateReservationPayload,
  UpdateReservationPayload,
  ReservationPaymentDocument,
  CreateReservationPaymentPayload,
  ReservationStatus,
  PaymentStatus,
} from '../types/firestore'
import { CreateResult, UpdateResult } from '../types/firestore'

export class ReservationService {
  private reservationRepo: ReservationRepository
  private paymentRepo: ReservationPaymentRepository
  private noShowLogRepo: ReservationNoShowLogRepository

  constructor(
    reservationRepo = new ReservationRepository(),
    paymentRepo = new ReservationPaymentRepository(),
    noShowLogRepo = new ReservationNoShowLogRepository()
  ) {
    this.reservationRepo = reservationRepo
    this.paymentRepo = paymentRepo
    this.noShowLogRepo = noShowLogRepo
  }

  /**
   * Create a new reservation
   * @param data - Reservation data
   * @param userId - User creating reservation
   * @param organizationId - Organization ID
   * @returns Created reservation
   */
  async createReservation(
    data: CreateReservationPayload,
    userId: string,
    organizationId: string
  ): Promise<CreateResult<ReservationDocument>> {
    return this.reservationRepo.create(data, userId, organizationId)
  }

  /**
   * Get reservation by ID
   * @param reservationId - Reservation ID
   * @returns Reservation or null
   */
  async getReservation(reservationId: string): Promise<ReservationDocument | null> {
    return this.reservationRepo.findById(reservationId)
  }

  /**
   * Get reservations for a branch
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @param status - Optional status filter
   * @returns Array of reservations
   */
  async getReservationsByBranch(
    branchId: string,
    organizationId: string,
    status?: ReservationStatus
  ): Promise<ReservationDocument[]> {
    if (status) {
      return this.reservationRepo.findByStatus(status, branchId, organizationId)
    }
    return this.reservationRepo.findByBranch(branchId, organizationId)
  }

  /**
   * Get reservations for a customer
   * @param customerId - Customer ID
   * @param organizationId - Organization ID
   * @returns Array of reservations
   */
  async getReservationsByCustomer(
    customerId: string,
    organizationId: string
  ): Promise<ReservationDocument[]> {
    return this.reservationRepo.findByCustomer(customerId, organizationId)
  }

  /**
   * Get reservations for a date range
   * @param startDate - Start date
   * @param endDate - End date
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of reservations
   */
  async getReservationsByDateRange(
    startDate: Date,
    endDate: Date,
    branchId: string,
    organizationId: string
  ): Promise<ReservationDocument[]> {
    return this.reservationRepo.findByDateRange(startDate, endDate, branchId, organizationId)
  }

  /**
   * Check if table is available for a date/time
   * @param tableId - Table ID
   * @param reservationDate - Reservation date
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Boolean indicating availability
   */
  async isTableAvailable(
    tableId: string,
    reservationDate: Date,
    branchId: string,
    organizationId: string
  ): Promise<boolean> {
    const existing = await this.reservationRepo.findByTableAndDate(
      tableId,
      reservationDate,
      branchId,
      organizationId
    )
    return existing === null
  }

  /**
   * Update reservation
   * @param reservationId - Reservation ID
   * @param updates - Updates to apply
   * @param userId - User performing update
   * @returns Updated reservation
   */
  async updateReservation(
    reservationId: string,
    updates: UpdateReservationPayload,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.reservationRepo.update(reservationId, updates, userId)
  }

  /**
   * Update reservation status
   * @param reservationId - Reservation ID
   * @param status - New status
   * @param userId - User performing update
   * @returns Updated reservation
   */
  async updateReservationStatus(
    reservationId: string,
    status: ReservationStatus,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.reservationRepo.updateStatus(reservationId, status, userId)
  }

  /**
   * Check in a reservation
   * @param reservationId - Reservation ID
   * @param userId - User performing check-in
   * @returns Updated reservation
   */
  async checkInReservation(
    reservationId: string,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.reservationRepo.checkIn(reservationId, userId)
  }

  /**
   * Complete a reservation
   * @param reservationId - Reservation ID
   * @param userId - User completing
   * @returns Updated reservation
   */
  async completeReservation(
    reservationId: string,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.reservationRepo.complete(reservationId, userId)
  }

  /**
   * Cancel a reservation
   * @param reservationId - Reservation ID
   * @param cancellationReason - Reason for cancellation
   * @param userId - User cancelling
   * @returns Updated reservation
   */
  async cancelReservation(
    reservationId: string,
    cancellationReason: string,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.reservationRepo.cancel(reservationId, cancellationReason, userId)
  }

  /**
   * Mark reservation as no-show
   * @param reservationId - Reservation ID
   * @param noShowReason - Reason for no-show
   * @param userId - User marking no-show
   * @returns Updated reservation
   */
  async markReservationNoShow(
    reservationId: string,
    noShowReason: string,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.reservationRepo.markNoShow(reservationId, noShowReason, userId)
  }

  /**
   * Delete (soft delete) a reservation
   * @param reservationId - Reservation ID
   * @param userId - User deleting
   * @returns Delete result
   */
  async deleteReservation(
    reservationId: string,
    userId: string
  ) {
    return this.reservationRepo.delete(reservationId, userId)
  }

  /**
   * Restore a deleted reservation
   * @param reservationId - Reservation ID
   * @param userId - User restoring
   * @returns Restored reservation
   */
  async restoreReservation(
    reservationId: string,
    userId: string
  ): Promise<UpdateResult<ReservationDocument>> {
    return this.reservationRepo.restore(reservationId, userId)
  }

  // ============= PAYMENT OPERATIONS =============

  /**
   * Record a payment for reservation
   * @param reservationId - Reservation ID
   * @param data - Payment data
   * @param userId - User recording payment
   * @param organizationId - Organization ID
   * @returns Created payment
   */
  async recordPayment(
    reservationId: string,
    data: Omit<CreateReservationPaymentPayload, 'reservationId'>,
    userId: string,
    organizationId: string
  ): Promise<CreateResult<ReservationPaymentDocument>> {
    return this.paymentRepo.create(reservationId, data, userId, organizationId)
  }

  /**
   * Get payments for a reservation
   * @param reservationId - Reservation ID
   * @returns Array of payments
   */
  async getReservationPayments(
    reservationId: string
  ): Promise<ReservationPaymentDocument[]> {
    return this.paymentRepo.findByReservation(reservationId)
  }

  /**
   * Calculate total paid for a reservation
   * @param reservationId - Reservation ID
   * @returns Total amount paid
   */
  async calculateTotalPaid(
    reservationId: string
  ): Promise<number> {
    return this.paymentRepo.calculateTotalForReservation(reservationId)
  }

  /**
   * Update payment status
   * @param reservationId - Reservation ID
   * @param paymentId - Payment ID
   * @param status - New status
   * @param userId - User performing update
   * @returns Updated payment
   */
  async updatePaymentStatus(
    reservationId: string,
    paymentId: string,
    status: PaymentStatus,
    userId: string
  ) {
    return this.paymentRepo.updateStatus(reservationId, paymentId, status, userId)
  }

  // ============= NO-SHOW LOG OPERATIONS =============

  /**
   * Record a no-show event
   * @param reservationId - Reservation ID
   * @param noShowCount - Number of no-shows
   * @param totalPenalty - Total penalty amount
   * @param notes - Optional notes
   * @param userId - User recording
   * @param organizationId - Organization ID
   * @returns Created log
   */
  async recordNoShow(
    reservationId: string,
    noShowCount: number,
    totalPenalty: number,
    notes: string | null,
    userId: string,
    organizationId: string
  ) {
    return this.noShowLogRepo.create(
      reservationId,
      {
        noShowCount,
        totalPenalty,
        notes,
      },
      userId,
      organizationId
    )
  }

  /**
   * Get no-show logs for a reservation
   * @param reservationId - Reservation ID
   * @returns Array of no-show logs
   */
  async getReservationNoShowLogs(
    reservationId: string
  ) {
    return this.noShowLogRepo.findByReservation(reservationId)
  }

  /**
   * Calculate total penalty for a reservation
   * @param reservationId - Reservation ID
   * @returns Total penalty amount
   */
  async calculateTotalPenalty(
    reservationId: string
  ): Promise<number> {
    return this.noShowLogRepo.calculateTotalPenalty(reservationId)
  }

  /**
   * Get no-show count for a reservation
   * @param reservationId - Reservation ID
   * @returns Number of no-shows
   */
  async getNoShowCount(
    reservationId: string
  ): Promise<number> {
    return this.noShowLogRepo.getNoShowCount(reservationId)
  }

  // ============= STATISTICS OPERATIONS =============

  /**
   * Get active reservations count for a branch
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Count of active reservations
   */
  async getActiveReservationsCount(
    branchId: string,
    organizationId: string
  ): Promise<number> {
    return this.reservationRepo.countTodayActive(branchId, organizationId)
  }

  /**
   * Get reservation count by status
   * @param status - Status to count
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Count of reservations with given status
   */
  async getReservationCountByStatus(
    status: ReservationStatus,
    branchId: string,
    organizationId: string
  ): Promise<number> {
    return this.reservationRepo.countByStatus(status, branchId, organizationId)
  }
}
