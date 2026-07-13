/**
 * Customer Address Repository
 * Handles all CustomerAddress subcollection operations
 * 
 * Scope: Organization-scoped (inherits from parent Customer)
 * Collection: Dynamic subcollection at /customers/{customerId}/addresses
 * 
 * Business Methods:
 * - findByCustomer: Get all addresses for a customer
 * - getDefault: Get the default address for a customer
 * - setDefault: Set a specific address as default
 */

import * as admin from 'firebase-admin'
import { getFirestore } from '../config/firebase'
import { SUBCOLLECTION_PATHS } from '../config/collections'
import { COLLECTIONS } from '../config/collections'
import {
  DocumentId,
  CreateResult,
  UpdateResult,
  DeleteResult,
  QueryOptions,
} from '../types/firestore'
import {
  CustomerAddressDocument,
  CreateCustomerAddressPayload,
  UpdateCustomerAddressPayload,
} from '../types/firestore/customer'
import {
  prepareDocumentForCreate,
  prepareDocumentForUpdate,
  prepareDocumentForDelete,
  querySnapshotToArray,
} from '../config/converters'

export type {
  CustomerAddressDocument,
  CreateCustomerAddressPayload,
  UpdateCustomerAddressPayload,
}

/**
 * Customer Address Repository
 * Manages addresses subcollection within Customer documents
 */
export class CustomerAddressRepository {
  protected db: admin.firestore.Firestore

  constructor() {
    this.db = getFirestore()
  }

  /**
   * Get subcollection reference for a customer
   */
  protected getAddressesCollection(customerId: string) {
    return this.db.collection(SUBCOLLECTION_PATHS.customerAddresses(customerId))
  }

  /**
   * Get address document reference
   */
  protected getAddressDocRef(customerId: string, addressId: string) {
    return this.getAddressesCollection(customerId).doc(addressId)
  }

  /**
   * CREATE - Add new address for customer
   * 
   * @param customerId - Customer ID
   * @param data - Address data
   * @param userId - User creating the address
   * @param organizationId - Organization ID
   * @returns Created address document or error
   * 
   * @example
   *   const result = await addressRepo.create(customerId, addressData, userId, orgId)
   */
  async create(
    customerId: string,
    data: Omit<CreateCustomerAddressPayload, 'customerId'>,
    userId: string,
    organizationId: string
  ): Promise<CreateResult<CustomerAddressDocument>> {
    try {
      const docRef = this.getAddressesCollection(customerId).doc()

      const addressPayload: Omit<CreateCustomerAddressPayload, 'organizationId' | 'customerId'> = data

      const prepared = prepareDocumentForCreate(
        { ...addressPayload, customerId: customerId as DocumentId, id: docRef.id },
        userId,
        organizationId
      )

      await docRef.set(prepared)

      return {
        success: true,
        data: { id: docRef.id, ...prepared } as CustomerAddressDocument,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * READ - Get address by ID
   * 
   * @param customerId - Customer ID
   * @param addressId - Address ID
   * @returns Address document or null
   * 
   * @example
   *   const address = await addressRepo.findById(customerId, addressId)
   */
  async findById(customerId: string, addressId: string): Promise<CustomerAddressDocument | null> {
    try {
      const snap = await this.getAddressDocRef(customerId, addressId).get()
      if (!snap.exists) return null

      const data = snap.data()
      return { id: snap.id, ...data } as CustomerAddressDocument
    } catch (error) {
      console.error(`Error finding address by ID:`, error)
      return null
    }
  }

  /**
   * READ - Get all addresses for customer
   * 
   * @param customerId - Customer ID
   * @param orderByDefault - If true, default address first
   * @returns Array of address documents
   * 
   * @example
   *   const addresses = await addressRepo.findByCustomer(customerId, true)
   */
  async findByCustomer(
    customerId: string,
    orderByDefault: boolean = false
  ): Promise<CustomerAddressDocument[]> {
    try {
      let query: any = this.getAddressesCollection(customerId)
        .where('isDeleted', '==', false)

      if (orderByDefault) {
        query = query.orderBy('isDefault', 'desc').orderBy('createdAt', 'desc')
      } else {
        query = query.orderBy('createdAt', 'desc')
      }

      const snap = await query.get()
      return querySnapshotToArray<CustomerAddressDocument>(snap)
    } catch (error) {
      console.error(`Error finding addresses for customer:`, error)
      return []
    }
  }

  /**
   * READ - Get default address for customer
   * 
   * @param customerId - Customer ID
   * @returns Default address or null
   * 
   * @example
   *   const defaultAddress = await addressRepo.getDefault(customerId)
   */
  async getDefault(customerId: string): Promise<CustomerAddressDocument | null> {
    try {
      const snap = await this.getAddressesCollection(customerId)
        .where('isDefault', '==', true)
        .where('isDeleted', '==', false)
        .limit(1)
        .get()

      if (snap.empty) return null

      const doc = snap.docs[0]
      const data = doc.data()
      return { id: doc.id, ...data } as CustomerAddressDocument
    } catch (error) {
      console.error(`Error getting default address:`, error)
      return null
    }
  }

  /**
   * UPDATE - Update address by ID
   * 
   * @param customerId - Customer ID
   * @param addressId - Address ID
   * @param updates - Partial address update
   * @param userId - User performing update
   * @returns Updated address or error
   * 
   * @example
   *   const result = await addressRepo.update(customerId, addressId, updates, userId)
   */
  async update(
    customerId: string,
    addressId: string,
    updates: Partial<CustomerAddressDocument>,
    userId: string
  ): Promise<UpdateResult<CustomerAddressDocument>> {
    try {
      const prepared = prepareDocumentForUpdate(updates, userId)
      await this.getAddressDocRef(customerId, addressId).update(prepared)

      // Fetch updated document
      const updated = await this.findById(customerId, addressId)
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
   * DELETE - Soft delete address
   * 
   * @param customerId - Customer ID
   * @param addressId - Address ID
   * @param userId - User performing delete
   * @returns Deletion result or error
   * 
   * @example
   *   const result = await addressRepo.delete(customerId, addressId, userId)
   */
  async delete(
    customerId: string,
    addressId: string,
    userId: string
  ): Promise<DeleteResult> {
    try {
      const prepared = prepareDocumentForDelete(userId)
      await this.getAddressDocRef(customerId, addressId).update(prepared)

      return {
        success: true,
        deletedId: addressId,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * SET DEFAULT - Set specific address as default for customer
   * Unsets all other addresses as non-default
   * 
   * @param customerId - Customer ID
   * @param addressId - Address ID to set as default
   * @param userId - User performing operation
   * @returns Updated address or error
   * 
   * @example
   *   const result = await addressRepo.setDefault(customerId, addressId, userId)
   */
  async setDefault(
    customerId: string,
    addressId: string,
    userId: string
  ): Promise<UpdateResult<CustomerAddressDocument>> {
    try {
      const batch = this.db.batch()

      // Get all addresses for customer
      const addresses = await this.findByCustomer(customerId)

      // Unset current defaults
      for (const addr of addresses) {
        if (addr.isDefault && addr.id !== addressId) {
          batch.update(this.getAddressDocRef(customerId, addr.id), {
            isDefault: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: userId,
          })
        }
      }

      // Set new default
      batch.update(this.getAddressDocRef(customerId, addressId), {
        isDefault: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: userId,
      })

      await batch.commit()

      // Fetch updated address
      const updated = await this.findById(customerId, addressId)
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
   * COUNT - Count active addresses for customer
   * 
   * @param customerId - Customer ID
   * @returns Number of active addresses
   * 
   * @example
   *   const count = await addressRepo.countByCustomer(customerId)
   */
  async countByCustomer(customerId: string): Promise<number> {
    try {
      const snap = await this.getAddressesCollection(customerId)
        .where('isDeleted', '==', false)
        .count()
        .get()

      return snap.data().count
    } catch (error) {
      console.error(`Error counting addresses:`, error)
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
