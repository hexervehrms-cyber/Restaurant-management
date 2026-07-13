/**
 * Customer Loyalty Points Repository
 * Handles all CustomerLoyaltyPoints subcollection operations
 * 
 * Scope: Organization-scoped (inherits from parent Customer)
 * Collection: Dynamic subcollection at /customers/{customerId}/loyalty_points
 * 
 * Business Methods:
 * - findByCustomer: Get loyalty points for customer (1:1)
 * - earnPoints: Add points to customer
 * - redeemPoints: Deduct points from customer
 * - getBalance: Get current points balance
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
  CustomerLoyaltyPointsDocument,
  CreateCustomerLoyaltyPointsPayload,
  UpdateCustomerLoyaltyPointsPayload,
} from '../types/firestore/customer'
import {
  prepareDocumentForCreate,
  prepareDocumentForUpdate,
  prepareDocumentForDelete,
  querySnapshotToArray,
} from '../config/converters'

export type {
  CustomerLoyaltyPointsDocument,
  CreateCustomerLoyaltyPointsPayload,
  UpdateCustomerLoyaltyPointsPayload,
}

/**
 * Customer Loyalty Points Repository
 * Manages loyalty points subcollection within Customer documents
 * 
 * NOTE: This is typically a 1:1 relationship with Customer
 * Stored as subcollection for flexibility and future extensibility
 */
export class CustomerLoyaltyPointsRepository {
  protected db: admin.firestore.Firestore

  constructor() {
    this.db = getFirestore()
  }

  /**
   * Get subcollection reference for a customer
   */
  protected getLoyaltyPointsCollection(customerId: string) {
    return this.db.collection(SUBCOLLECTION_PATHS.customerLoyaltyPoints(customerId))
  }

  /**
   * Get loyalty points document reference
   * Assumes ID is "default" or similar constant for 1:1 relationship
   */
  protected getLoyaltyPointsDocRef(customerId: string, loyaltyId: string) {
    return this.getLoyaltyPointsCollection(customerId).doc(loyaltyId)
  }

  /**
   * CREATE - Initialize loyalty points for customer
   * Called when customer is created
   * 
   * @param customerId - Customer ID
   * @param data - Loyalty points data
   * @param userId - User creating the loyalty record
   * @param organizationId - Organization ID
   * @returns Created loyalty points document or error
   * 
   * @example
   *   const result = await loyaltyRepo.create(customerId, { pointsBalance: 0 }, userId, orgId)
   */
  async create(
    customerId: string,
    data: Omit<CreateCustomerLoyaltyPointsPayload, 'customerId'>,
    userId: string,
    organizationId: string
  ): Promise<CreateResult<CustomerLoyaltyPointsDocument>> {
    try {
      const docRef = this.getLoyaltyPointsCollection(customerId).doc()

      const loyaltyPayload: Omit<CreateCustomerLoyaltyPointsPayload, 'organizationId' | 'customerId'> = {
        ...data,
        pointsBalance: data.pointsBalance ?? 0,
        lifetimePoints: data.lifetimePoints ?? 0,
      }

      const prepared = prepareDocumentForCreate(
        { ...loyaltyPayload, customerId: customerId as DocumentId, id: docRef.id },
        userId,
        organizationId
      )

      await docRef.set(prepared)

      return {
        success: true,
        data: { id: docRef.id, ...prepared } as CustomerLoyaltyPointsDocument,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * READ - Get loyalty points for customer
   * Assumes 1:1 relationship, returns first/only document
   * 
   * @param customerId - Customer ID
   * @returns Loyalty points document or null
   * 
   * @example
   *   const loyalty = await loyaltyRepo.findByCustomer(customerId)
   */
  async findByCustomer(customerId: string): Promise<CustomerLoyaltyPointsDocument | null> {
    try {
      const snap = await this.getLoyaltyPointsCollection(customerId)
        .where('isDeleted', '==', false)
        .limit(1)
        .get()

      if (snap.empty) return null

      const doc = snap.docs[0]
      const data = doc.data()
      return { id: doc.id, ...data } as CustomerLoyaltyPointsDocument
    } catch (error) {
      console.error(`Error finding loyalty points for customer:`, error)
      return null
    }
  }

  /**
   * READ - Get loyalty points by ID
   * 
   * @param customerId - Customer ID
   * @param loyaltyId - Loyalty points document ID
   * @returns Loyalty points document or null
   * 
   * @example
   *   const loyalty = await loyaltyRepo.findById(customerId, loyaltyId)
   */
  async findById(
    customerId: string,
    loyaltyId: string
  ): Promise<CustomerLoyaltyPointsDocument | null> {
    try {
      const snap = await this.getLoyaltyPointsDocRef(customerId, loyaltyId).get()
      if (!snap.exists) return null

      const data = snap.data()
      return { id: snap.id, ...data } as CustomerLoyaltyPointsDocument
    } catch (error) {
      console.error(`Error finding loyalty points by ID:`, error)
      return null
    }
  }

  /**
   * UPDATE - Update loyalty points
   * 
   * @param customerId - Customer ID
   * @param loyaltyId - Loyalty points document ID
   * @param updates - Partial loyalty points update
   * @param userId - User performing update
   * @returns Updated loyalty points or error
   * 
   * @example
   *   const result = await loyaltyRepo.update(customerId, loyaltyId, { pointsBalance: 100 }, userId)
   */
  async update(
    customerId: string,
    loyaltyId: string,
    updates: Partial<CustomerLoyaltyPointsDocument>,
    userId: string
  ): Promise<UpdateResult<CustomerLoyaltyPointsDocument>> {
    try {
      const prepared = prepareDocumentForUpdate(updates, userId)
      await this.getLoyaltyPointsDocRef(customerId, loyaltyId).update(prepared)

      // Fetch updated document
      const updated = await this.findById(customerId, loyaltyId)
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
   * DELETE - Soft delete loyalty points
   * 
   * @param customerId - Customer ID
   * @param loyaltyId - Loyalty points document ID
   * @param userId - User performing delete
   * @returns Deletion result or error
   * 
   * @example
   *   const result = await loyaltyRepo.delete(customerId, loyaltyId, userId)
   */
  async delete(
    customerId: string,
    loyaltyId: string,
    userId: string
  ): Promise<DeleteResult> {
    try {
      const prepared = prepareDocumentForDelete(userId)
      await this.getLoyaltyPointsDocRef(customerId, loyaltyId).update(prepared)

      return {
        success: true,
        deletedId: loyaltyId,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * EARN POINTS - Add loyalty points to customer
   * Called when customer makes purchase or completes action
   * 
   * @param customerId - Customer ID
   * @param loyaltyId - Loyalty points document ID
   * @param points - Number of points to add
   * @param userId - User recording the transaction
   * @returns Updated loyalty points or error
   * 
   * @example
   *   const result = await loyaltyRepo.earnPoints(customerId, loyaltyId, 50, userId)
   */
  async earnPoints(
    customerId: string,
    loyaltyId: string,
    points: number,
    userId: string
  ): Promise<UpdateResult<CustomerLoyaltyPointsDocument>> {
    try {
      const loyalty = await this.findById(customerId, loyaltyId)
      if (!loyalty) {
        return {
          success: false,
          error: 'Loyalty points record not found',
        }
      }

      const newBalance = loyalty.pointsBalance + points
      const newLifetime = loyalty.lifetimePoints + points

      return this.update(
        customerId,
        loyaltyId,
        {
          pointsBalance: newBalance,
          lifetimePoints: newLifetime,
          lastEarnedAt: new Date(),
        } as Partial<CustomerLoyaltyPointsDocument>,
        userId
      )
    } catch (error) {
      console.error(`Error earning points:`, error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * REDEEM POINTS - Deduct loyalty points from customer
   * Called when customer redeems rewards
   * 
   * @param customerId - Customer ID
   * @param loyaltyId - Loyalty points document ID
   * @param points - Number of points to redeem
   * @param userId - User recording the transaction
   * @returns Updated loyalty points or error (fails if insufficient balance)
   * 
   * @example
   *   const result = await loyaltyRepo.redeemPoints(customerId, loyaltyId, 25, userId)
   */
  async redeemPoints(
    customerId: string,
    loyaltyId: string,
    points: number,
    userId: string
  ): Promise<UpdateResult<CustomerLoyaltyPointsDocument>> {
    try {
      const loyalty = await this.findById(customerId, loyaltyId)
      if (!loyalty) {
        return {
          success: false,
          error: 'Loyalty points record not found',
        }
      }

      if (loyalty.pointsBalance < points) {
        return {
          success: false,
          error: `Insufficient points. Balance: ${loyalty.pointsBalance}, Requested: ${points}`,
        }
      }

      const newBalance = loyalty.pointsBalance - points

      return this.update(
        customerId,
        loyaltyId,
        {
          pointsBalance: newBalance,
          lastRedeemedAt: new Date(),
        } as Partial<CustomerLoyaltyPointsDocument>,
        userId
      )
    } catch (error) {
      console.error(`Error redeeming points:`, error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * GET BALANCE - Get current points balance for customer
   * 
   * @param customerId - Customer ID
   * @returns Current points balance or 0 if not found
   * 
   * @example
   *   const balance = await loyaltyRepo.getBalance(customerId)
   */
  async getBalance(customerId: string): Promise<number> {
    try {
      const loyalty = await this.findByCustomer(customerId)
      return loyalty?.pointsBalance ?? 0
    } catch (error) {
      console.error(`Error getting balance:`, error)
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
