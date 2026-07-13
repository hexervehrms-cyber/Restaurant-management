/**
 * Customer Note Repository
 * Handles all CustomerNote subcollection operations
 * 
 * Scope: Organization-scoped (inherits from parent Customer)
 * Collection: Dynamic subcollection at /customers/{customerId}/notes
 * 
 * Business Methods:
 * - findByCustomer: Get all notes for a customer
 * - findByAuthor: Get notes created by specific user
 */

import * as admin from 'firebase-admin'
import { getFirestore } from '../config/firebase'
import { SUBCOLLECTION_PATHS } from '../config/collections'
import {
  DocumentId,
  CreateResult,
  UpdateResult,
  DeleteResult,
} from '../types/firestore'
import {
  CustomerNoteDocument,
  CreateCustomerNotePayload,
  UpdateCustomerNotePayload,
} from '../types/firestore/customer'
import {
  prepareDocumentForCreate,
  prepareDocumentForUpdate,
  prepareDocumentForDelete,
  querySnapshotToArray,
} from '../config/converters'

export type {
  CustomerNoteDocument,
  CreateCustomerNotePayload,
  UpdateCustomerNotePayload,
}

/**
 * Customer Note Repository
 * Manages notes subcollection within Customer documents
 */
export class CustomerNoteRepository {
  protected db: admin.firestore.Firestore

  constructor() {
    this.db = getFirestore()
  }

  /**
   * Get subcollection reference for a customer
   */
  protected getNotesCollection(customerId: string) {
    return this.db.collection(SUBCOLLECTION_PATHS.customerNotes(customerId))
  }

  /**
   * Get note document reference
   */
  protected getNoteDocRef(customerId: string, noteId: string) {
    return this.getNotesCollection(customerId).doc(noteId)
  }

  /**
   * CREATE - Add new note for customer
   * 
   * @param customerId - Customer ID
   * @param data - Note data
   * @param userId - User creating the note
   * @param organizationId - Organization ID
   * @returns Created note document or error
   * 
   * @example
   *   const result = await noteRepo.create(customerId, { note: "VIP customer" }, userId, orgId)
   */
  async create(
    customerId: string,
    data: Omit<CreateCustomerNotePayload, 'customerId'>,
    userId: string,
    organizationId: string
  ): Promise<CreateResult<CustomerNoteDocument>> {
    try {
      const docRef = this.getNotesCollection(customerId).doc()

      const notePayload: Omit<CreateCustomerNotePayload, 'organizationId' | 'customerId' | 'createdBy'> = data

      const prepared = prepareDocumentForCreate(
        { ...notePayload, customerId: customerId as DocumentId, id: docRef.id },
        userId,
        organizationId
      )

      await docRef.set(prepared)

      return {
        success: true,
        data: { id: docRef.id, ...prepared } as CustomerNoteDocument,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * READ - Get note by ID
   * 
   * @param customerId - Customer ID
   * @param noteId - Note ID
   * @returns Note document or null
   * 
   * @example
   *   const note = await noteRepo.findById(customerId, noteId)
   */
  async findById(customerId: string, noteId: string): Promise<CustomerNoteDocument | null> {
    try {
      const snap = await this.getNoteDocRef(customerId, noteId).get()
      if (!snap.exists) return null

      const data = snap.data()
      return { id: snap.id, ...data } as CustomerNoteDocument
    } catch (error) {
      console.error(`Error finding note by ID:`, error)
      return null
    }
  }

  /**
   * READ - Get all notes for customer
   * Ordered by most recent first
   * 
   * @param customerId - Customer ID
   * @returns Array of note documents
   * 
   * @example
   *   const notes = await noteRepo.findByCustomer(customerId)
   */
  async findByCustomer(customerId: string): Promise<CustomerNoteDocument[]> {
    try {
      const snap = await this.getNotesCollection(customerId)
        .where('isDeleted', '==', false)
        .orderBy('createdAt', 'desc')
        .get()

      return querySnapshotToArray<CustomerNoteDocument>(snap)
    } catch (error) {
      console.error(`Error finding notes for customer:`, error)
      return []
    }
  }

  /**
   * READ - Get notes created by specific user
   * 
   * @param customerId - Customer ID
   * @param userId - User ID
   * @returns Array of note documents created by user
   * 
   * @example
   *   const userNotes = await noteRepo.findByAuthor(customerId, userId)
   */
  async findByAuthor(customerId: string, userId: string): Promise<CustomerNoteDocument[]> {
    try {
      const snap = await this.getNotesCollection(customerId)
        .where('createdBy', '==', userId)
        .where('isDeleted', '==', false)
        .orderBy('createdAt', 'desc')
        .get()

      return querySnapshotToArray<CustomerNoteDocument>(snap)
    } catch (error) {
      console.error(`Error finding notes by author:`, error)
      return []
    }
  }

  /**
   * UPDATE - Update note by ID
   * 
   * @param customerId - Customer ID
   * @param noteId - Note ID
   * @param updates - Partial note update
   * @param userId - User performing update
   * @returns Updated note or error
   * 
   * @example
   *   const result = await noteRepo.update(customerId, noteId, { note: "Updated note" }, userId)
   */
  async update(
    customerId: string,
    noteId: string,
    updates: Partial<CustomerNoteDocument>,
    userId: string
  ): Promise<UpdateResult<CustomerNoteDocument>> {
    try {
      const prepared = prepareDocumentForUpdate(updates, userId)
      await this.getNoteDocRef(customerId, noteId).update(prepared)

      // Fetch updated document
      const updated = await this.findById(customerId, noteId)
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
   * DELETE - Soft delete note
   * 
   * @param customerId - Customer ID
   * @param noteId - Note ID
   * @param userId - User performing delete
   * @returns Deletion result or error
   * 
   * @example
   *   const result = await noteRepo.delete(customerId, noteId, userId)
   */
  async delete(
    customerId: string,
    noteId: string,
    userId: string
  ): Promise<DeleteResult> {
    try {
      const prepared = prepareDocumentForDelete(userId)
      await this.getNoteDocRef(customerId, noteId).update(prepared)

      return {
        success: true,
        deletedId: noteId,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * COUNT - Count active notes for customer
   * 
   * @param customerId - Customer ID
   * @returns Number of active notes
   * 
   * @example
   *   const count = await noteRepo.countByCustomer(customerId)
   */
  async countByCustomer(customerId: string): Promise<number> {
    try {
      const snap = await this.getNotesCollection(customerId)
        .where('isDeleted', '==', false)
        .count()
        .get()

      return snap.data().count
    } catch (error) {
      console.error(`Error counting notes:`, error)
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
