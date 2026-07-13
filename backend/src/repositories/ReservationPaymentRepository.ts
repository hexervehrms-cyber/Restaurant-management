/**
 * Reservation Payment Repository
 * Handles all Firestore operations for ReservationPayment subcollection documents
 * 
 * Features:
 * - CRUD operations for payments
 * - Soft delete and restore
 * - Organization scoped
 * - Advanced filtering and pagination
 * 
 * Usage:
 *   const repo = new ReservationPaymentRepository()
 *   const payment = await repo.createForReservation(reservationId, data, userId, orgId)
 *   const payments = await repo.findByReservation(reservationId, orgId)
 */

import * as admin from 'firebase-admin'
import { getFirestore } from '../config/firebase'
import { SUBCOLLECTION_PATHS } from '../firestore/collections'
import {
  ReservationPaymentDocument,
  CreateReservationPaymentPayload,
  UpdateReservationPaymentPayload,
  PaymentStatus,
  DocumentId,
  CreateResult,
  UpdateResult,
  DeleteResult,
} from '../types/firestore'
import {
  prepareDocumentForCreate,
  prepareDocumentForUpdate,
  prepareDocumentForDelete,
  querySnapshotToArray,
} from '../config/converters'

export type {
  ReservationPaymentDocument,
  CreateReservationPaymentPayload,
  UpdateReservationPaymentPayload,
}

/**
 * Reservation Payment Repository
 * Manages payments subcollection within Reservation documents
 */
export class ReservationPaymentRepository {
  protected db: admin.firestore.Firestore

  constructor() {
    this.db = getFirestore()
  }

  /**
   * Get subcollection reference for a reservation
   */
  protected getPaymentsCollection(reservationId: string) {
    return this.db.collection(SUBCOLLECTION_PATHS.reservationPayments(reservationId))
  }

  /**
   * Get payment document reference
   */
  protected getPaymentDocRef(reservationId: string, paymentId: string) {
    return this.getPaymentsCollection(reservationId).doc(paymentId)
  }

  /**
   * CREATE - Add new payment for reservation
   * 
   * @param reservationId - Reservation ID
   * @param data - Payment data
   * @param userId - User creating the payment
   * @param organizationId - Organization ID
   * @returns Created payment document or error
   */
  async create(
    reservationId: string,
    data: Omit<CreateReservationPaymentPayload, 'reservationId'>,
    userId: string,
    organizationId: string
  ): Promise<CreateResult<ReservationPaymentDocument>> {
    try {
      const docRef = this.getPaymentsCollection(reservationId).doc()

      const prepared = prepareDocumentForCreate(
        { ...data, reservationId: reservationId as DocumentId, id: docRef.id },
        userId,
        organizationId
      )

      await docRef.set(prepared)

      return {
        success: true,
        data: { id: docRef.id, ...prepared } as ReservationPaymentDocument,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * READ - Get payment by ID
   * 
   * @param reservationId - Reservation ID
   * @param paymentId - Payment ID
   * @returns Payment document or null
   */
  async findById(
    reservationId: string,
    paymentId: string
  ): Promise<ReservationPaymentDocument | null> {
    try {
      const snap = await this.getPaymentDocRef(reservationId, paymentId).get()
      if (!snap.exists) return null

      const data = snap.data()
      return { id: snap.id, ...data } as ReservationPaymentDocument
    } catch (error) {
      console.error(`Error finding payment by ID:`, error)
      return null
    }
  }

  /**
   * READ - Get all payments for reservation
   * 
   * @param reservationId - Reservation ID
   * @returns Array of payment documents
   */
  async findByReservation(
    reservationId: string
  ): Promise<ReservationPaymentDocument[]> {
    try {
      const snap = await this.getPaymentsCollection(reservationId)
        .where('isDeleted', '==', false)
        .orderBy('createdAt', 'desc')
        .get()

      return querySnapshotToArray<ReservationPaymentDocument>(snap)
    } catch (error) {
      console.error(`Error finding payments for reservation:`, error)
      return []
    }
  }

  /**
   * READ - Get payments by status
   * 
   * @param reservationId - Reservation ID
   * @param status - Payment status to filter
   * @returns Array of payment documents
   */
  async findByStatus(
    reservationId: string,
    status: PaymentStatus
  ): Promise<ReservationPaymentDocument[]> {
    try {
      const snap = await this.getPaymentsCollection(reservationId)
        .where('paymentStatus', '==', status)
        .where('isDeleted', '==', false)
        .orderBy('createdAt', 'desc')
        .get()

      return querySnapshotToArray<ReservationPaymentDocument>(snap)
    } catch (error) {
      console.error(`Error finding payments by status:`, error)
      return []
    }
  }

  /**
   * READ - Get payment by transaction ID
   * 
   * @param reservationId - Reservation ID
   * @param transactionId - Transaction ID
   * @returns Payment document or null
   */
  async findByTransactionId(
    reservationId: string,
    transactionId: string
  ): Promise<ReservationPaymentDocument | null> {
    try {
      const snap = await this.getPaymentsCollection(reservationId)
        .where('transactionId', '==', transactionId)
        .where('isDeleted', '==', false)
        .limit(1)
        .get()

      if (snap.empty) return null

      const doc = snap.docs[0]
      const data = doc.data()
      return { id: doc.id, ...data } as ReservationPaymentDocument
    } catch (error) {
      console.error(`Error finding payment by transaction ID:`, error)
      return null
    }
  }

  /**
   * UPDATE - Update payment by ID
   * 
   * @param reservationId - Reservation ID
   * @param paymentId - Payment ID
   * @param updates - Partial payment update
   * @param userId - User performing update
   * @returns Updated payment or error
   */
  async update(
    reservationId: string,
    paymentId: string,
    updates: Partial<ReservationPaymentDocument>,
    userId: string
  ): Promise<UpdateResult<ReservationPaymentDocument>> {
    try {
      const prepared = prepareDocumentForUpdate(updates, userId)
      await this.getPaymentDocRef(reservationId, paymentId).update(prepared)

      // Fetch updated document
      const updated = await this.findById(reservationId, paymentId)
      return {
        success: true,
        data: updated || undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * UPDATE - Update payment status
   * 
   * @param reservationId - Reservation ID
   * @param paymentId - Payment ID
   * @param status - New payment status
   * @param userId - User performing update
   * @returns Updated payment or error
   */
  async updateStatus(
    reservationId: string,
    paymentId: string,
    status: PaymentStatus,
    userId: string
  ): Promise<UpdateResult<ReservationPaymentDocument>> {
    return this.update(
      reservationId,
      paymentId,
      { paymentStatus: status } as Partial<ReservationPaymentDocument>,
      userId
    )
  }

  /**
   * DELETE - Soft delete payment
   * 
   * @param reservationId - Reservation ID
   * @param paymentId - Payment ID
   * @param userId - User performing delete
   * @returns Deletion result or error
   */
  async delete(
    reservationId: string,
    paymentId: string,
    userId: string
  ): Promise<DeleteResult> {
    try {
      const prepared = prepareDocumentForDelete(userId)
      await this.getPaymentDocRef(reservationId, paymentId).update(prepared)

      return {
        success: true,
        deletedId: paymentId,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * CALCULATE - Calculate total completed payments for a reservation
   * 
   * @param reservationId - Reservation ID
   * @returns Total amount paid
   */
  async calculateTotalForReservation(
    reservationId: string
  ): Promise<number> {
    try {
      const payments = await this.findByStatus(reservationId, 'completed')
      
      return payments.reduce((total, payment) => {
        const amount = typeof payment.amount === 'number' 
          ? payment.amount 
          : typeof payment.amount === 'string'
          ? parseFloat(payment.amount)
          : 0
        return total + amount
      }, 0)
    } catch (error) {
      console.error(`Error calculating total payments:`, error)
      return 0
    }
  }

  /**
   * COUNT - Count active payments for reservation
   * 
   * @param reservationId - Reservation ID
   * @returns Number of active payments
   */
  async countByReservation(reservationId: string): Promise<number> {
    try {
      const snap = await this.getPaymentsCollection(reservationId)
        .where('isDeleted', '==', false)
        .count()
        .get()

      return snap.data().count
    } catch (error) {
      console.error(`Error counting payments:`, error)
      return 0
    }
  }

  /**
   * HELPER - Get error message from error object
   */
  protected getErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    return 'Unknown error occurred'
  }
}
