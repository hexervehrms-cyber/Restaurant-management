/**
 * Reservation No-Show Log Repository
 * Handles all Firestore operations for ReservationNoShowLog subcollection documents
 * 
 * Features:
 * - CRUD operations for no-show logs
 * - Soft delete and restore
 * - Organization scoped
 * - Advanced filtering and pagination
 * 
 * Usage:
 *   const repo = new ReservationNoShowLogRepository()
 *   const log = await repo.createForReservation(reservationId, data, userId, orgId)
 *   const logs = await repo.findByReservation(reservationId, orgId)
 */

import * as admin from 'firebase-admin'
import { getFirestore } from '../config/firebase'
import { SUBCOLLECTION_PATHS } from '../firestore/collections'
import {
  ReservationNoShowLogDocument,
  CreateReservationNoShowLogPayload,
  UpdateReservationNoShowLogPayload,
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
  ReservationNoShowLogDocument,
  CreateReservationNoShowLogPayload,
  UpdateReservationNoShowLogPayload,
}

/**
 * Reservation No-Show Log Repository
 * Manages noShowLogs subcollection within Reservation documents
 */
export class ReservationNoShowLogRepository {
  protected db: admin.firestore.Firestore

  constructor() {
    this.db = getFirestore()
  }

  /**
   * Get subcollection reference for a reservation
   */
  protected getNoShowLogsCollection(reservationId: string) {
    return this.db.collection(SUBCOLLECTION_PATHS.reservationNoShowLogs(reservationId))
  }

  /**
   * Get no-show log document reference
   */
  protected getNoShowLogDocRef(reservationId: string, logId: string) {
    return this.getNoShowLogsCollection(reservationId).doc(logId)
  }

  /**
   * CREATE - Add new no-show log for reservation
   * 
   * @param reservationId - Reservation ID
   * @param data - No-show log data
   * @param userId - User creating (also logged as creator)
   * @param organizationId - Organization ID
   * @returns Created log document or error
   */
  async create(
    reservationId: string,
    data: Omit<CreateReservationNoShowLogPayload, 'reservationId'>,
    userId: string,
    organizationId: string
  ): Promise<CreateResult<ReservationNoShowLogDocument>> {
    try {
      const docRef = this.getNoShowLogsCollection(reservationId).doc()

      const prepared = prepareDocumentForCreate(
        { ...data, reservationId: reservationId as DocumentId, createdBy: userId, id: docRef.id },
        userId,
        organizationId
      )

      await docRef.set(prepared)

      return {
        success: true,
        data: { id: docRef.id, ...prepared } as ReservationNoShowLogDocument,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * READ - Get no-show log by ID
   * 
   * @param reservationId - Reservation ID
   * @param logId - No-show log ID
   * @returns No-show log document or null
   */
  async findById(
    reservationId: string,
    logId: string
  ): Promise<ReservationNoShowLogDocument | null> {
    try {
      const snap = await this.getNoShowLogDocRef(reservationId, logId).get()
      if (!snap.exists) return null

      const data = snap.data()
      return { id: snap.id, ...data } as ReservationNoShowLogDocument
    } catch (error) {
      console.error(`Error finding no-show log by ID:`, error)
      return null
    }
  }

  /**
   * READ - Get all no-show logs for reservation
   * 
   * @param reservationId - Reservation ID
   * @returns Array of no-show log documents
   */
  async findByReservation(
    reservationId: string
  ): Promise<ReservationNoShowLogDocument[]> {
    try {
      const snap = await this.getNoShowLogsCollection(reservationId)
        .where('isDeleted', '==', false)
        .orderBy('createdAt', 'desc')
        .get()

      return querySnapshotToArray<ReservationNoShowLogDocument>(snap)
    } catch (error) {
      console.error(`Error finding no-show logs for reservation:`, error)
      return []
    }
  }

  /**
   * READ - Get latest no-show log for reservation
   * 
   * @param reservationId - Reservation ID
   * @returns Latest no-show log or null
   */
  async findLatestByReservation(
    reservationId: string
  ): Promise<ReservationNoShowLogDocument | null> {
    try {
      const logs = await this.findByReservation(reservationId)
      return logs.length > 0 ? logs[0] : null
    } catch (error) {
      console.error(`Error finding latest no-show log:`, error)
      return null
    }
  }

  /**
   * UPDATE - Update no-show log by ID
   * 
   * @param reservationId - Reservation ID
   * @param logId - No-show log ID
   * @param updates - Partial log update
   * @param userId - User performing update
   * @returns Updated log or error
   */
  async update(
    reservationId: string,
    logId: string,
    updates: Partial<ReservationNoShowLogDocument>,
    userId: string
  ): Promise<UpdateResult<ReservationNoShowLogDocument>> {
    try {
      const prepared = prepareDocumentForUpdate(updates, userId)
      await this.getNoShowLogDocRef(reservationId, logId).update(prepared)

      // Fetch updated document
      const updated = await this.findById(reservationId, logId)
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
   * UPDATE - Update penalty information
   * 
   * @param reservationId - Reservation ID
   * @param logId - No-show log ID
   * @param noShowCount - Updated no-show count
   * @param totalPenalty - Updated total penalty
   * @param userId - User performing update
   * @returns Updated log or error
   */
  async updatePenalty(
    reservationId: string,
    logId: string,
    noShowCount: number,
    totalPenalty: number,
    userId: string
  ): Promise<UpdateResult<ReservationNoShowLogDocument>> {
    return this.update(
      reservationId,
      logId,
      {
        noShowCount,
        totalPenalty,
      } as Partial<ReservationNoShowLogDocument>,
      userId
    )
  }

  /**
   * DELETE - Soft delete no-show log
   * 
   * @param reservationId - Reservation ID
   * @param logId - No-show log ID
   * @param userId - User performing delete
   * @returns Deletion result or error
   */
  async delete(
    reservationId: string,
    logId: string,
    userId: string
  ): Promise<DeleteResult> {
    try {
      const prepared = prepareDocumentForDelete(userId)
      await this.getNoShowLogDocRef(reservationId, logId).update(prepared)

      return {
        success: true,
        deletedId: logId,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * CALCULATE - Calculate total penalty for a reservation
   * 
   * @param reservationId - Reservation ID
   * @returns Total penalty amount
   */
  async calculateTotalPenalty(
    reservationId: string
  ): Promise<number> {
    try {
      const logs = await this.findByReservation(reservationId)
      
      return logs.reduce((total, log) => {
        if (log.totalPenalty !== null) {
          const penalty = typeof log.totalPenalty === 'number'
            ? log.totalPenalty
            : typeof log.totalPenalty === 'string'
            ? parseFloat(log.totalPenalty)
            : 0
          return total + penalty
        }
        return total
      }, 0)
    } catch (error) {
      console.error(`Error calculating total penalty:`, error)
      return 0
    }
  }

  /**
   * CALCULATE - Get no-show count for a reservation
   * 
   * @param reservationId - Reservation ID
   * @returns Number of times reservation was no-show
   */
  async getNoShowCount(
    reservationId: string
  ): Promise<number> {
    try {
      const logs = await this.findByReservation(reservationId)
      
      return logs.reduce((count, log) => {
        return count + (log.noShowCount || 0)
      }, 0)
    } catch (error) {
      console.error(`Error getting no-show count:`, error)
      return 0
    }
  }

  /**
   * COUNT - Count active no-show logs for reservation
   * 
   * @param reservationId - Reservation ID
   * @returns Number of active no-show logs
   */
  async countByReservation(reservationId: string): Promise<number> {
    try {
      const snap = await this.getNoShowLogsCollection(reservationId)
        .where('isDeleted', '==', false)
        .count()
        .get()

      return snap.data().count
    } catch (error) {
      console.error(`Error counting no-show logs:`, error)
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
