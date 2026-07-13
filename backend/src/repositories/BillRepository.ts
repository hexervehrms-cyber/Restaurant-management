/**
 * Bill Repository
 * Handles all bill-related Firestore operations
 * Replaces Prisma Bill model operations with Firestore
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import { BaseDocument, QueryOptions, UpdateResult, CreateResult, BatchResult } from '../types/firestore'
import * as admin from 'firebase-admin'

/**
 * Bill Document Model for Firestore
 */
export interface Bill extends BaseDocument {
  // Identifiers
  billNumber: string
  orderId?: string
  
  // Foreign Keys
  branchId: string
  restaurantId: string
  organizationId: string
  customerId?: string
  tableId?: string
  
  // Bill Type
  billType: 'dine_in' | 'takeaway' | 'delivery' | 'aggregator'
  
  // Financial Amounts (stored as decimal strings for precision)
  subtotal: string // Decimal as string
  discountAmount: string // Decimal as string
  discountPercentage: string // Decimal as string
  discountReason?: string
  taxAmount: string // Decimal as string
  serviceCharge: string // Decimal as string
  roundingAdjustment: string // Decimal as string
  totalAmount: string // Decimal as string
  
  // Payment Tracking
  amountPaid: string // Decimal as string
  balanceDue: string // Decimal as string
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled'
  billStatus: 'open' | 'paid' | 'cancelled'
  
  // Customer Information
  customerPhone?: string
  customerName?: string
  
  // Timestamps & Status
  settledAt?: Date
  cancelledAt?: Date
  cancellationReason?: string
  
  // Notes & Metadata
  notes?: string
  metadata?: Record<string, any>
  
  // Audit Fields
  createdById?: string
  settledById?: string
}

/**
 * Bill creation payload
 */
export interface CreateBillPayload {
  billNumber: string
  orderId?: string
  branchId: string
  restaurantId: string
  organizationId: string
  customerId?: string
  tableId?: string
  billType: Bill['billType']
  subtotal: string | number
  discountAmount?: string | number
  discountPercentage?: string | number
  discountReason?: string
  taxAmount: string | number
  serviceCharge?: string | number
  roundingAdjustment?: string | number
  totalAmount: string | number
  amountPaid?: string | number
  balanceDue: string | number
  paymentStatus?: Bill['paymentStatus']
  billStatus?: Bill['billStatus']
  customerPhone?: string
  customerName?: string
  notes?: string
  metadata?: Record<string, any>
  createdById?: string
}

/**
 * Bill update payload
 */
export interface UpdateBillPayload {
  discountAmount?: string | number
  discountPercentage?: string | number
  discountReason?: string
  amountPaid?: string | number
  balanceDue?: string | number
  paymentStatus?: Bill['paymentStatus']
  billStatus?: Bill['billStatus']
  customerId?: string
  customerPhone?: string
  customerName?: string
  settledAt?: Date
  settledById?: string
  cancelledAt?: Date
  cancellationReason?: string
  notes?: string
  metadata?: Record<string, any>
}

/**
 * Bill Repository
 * Extends BaseRepository with Bill-specific operations
 */
export class BillRepository extends BaseRepository<Bill> {
  constructor() {
    super(COLLECTIONS.bills)
  }

  /**
   * Find bills by organization and branch
   *
   * @example
   *   const bills = await billRepo.findByBranch(branchId, orgId)
   */
  async findByBranch(branchId: string, organizationId: string): Promise<Bill[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding bills by branch:', error)
      return []
    }
  }

  /**
   * Find bills by payment status
   *
   * @example
   *   const pendingBills = await billRepo.findByPaymentStatus('pending', orgId)
   */
  async findByPaymentStatus(
    paymentStatus: Bill['paymentStatus'],
    organizationId: string,
    branchId?: string
  ): Promise<Bill[]> {
    try {
      const filters: QueryOptions['filters'] = [
        { field: 'paymentStatus', operator: '==', value: paymentStatus },
        { field: 'organizationId', operator: '==', value: organizationId },
      ]

      if (branchId) {
        filters.push({ field: 'branchId', operator: '==', value: branchId })
      }

      return await this.findMany({
        filters,
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding bills by payment status:', error)
      return []
    }
  }

  /**
   * Find bills by customer
   *
   * @example
   *   const customerBills = await billRepo.findByCustomer(customerId, orgId)
   */
  async findByCustomer(customerId: string, organizationId: string): Promise<Bill[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'customerId', operator: '==', value: customerId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding bills by customer:', error)
      return []
    }
  }

  /**
   * Find bills by order ID
   *
   * @example
   *   const bill = await billRepo.findByOrderId(orderId, orgId)
   */
  async findByOrderId(orderId: string, organizationId: string): Promise<Bill | null> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'orderId', operator: '==', value: orderId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        limit: 1,
      })

      return docs.length > 0 ? docs[0] : null
    } catch (error) {
      console.error('Error finding bill by order ID:', error)
      return null
    }
  }

  /**
   * Find bills by bill number (unique per branch)
   *
   * @example
   *   const bill = await billRepo.findByBillNumber('BILL-20240115-0001', branchId)
   */
  async findByBillNumber(billNumber: string, branchId: string, organizationId: string): Promise<Bill | null> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'billNumber', operator: '==', value: billNumber },
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        limit: 1,
      })

      return docs.length > 0 ? docs[0] : null
    } catch (error) {
      console.error('Error finding bill by bill number:', error)
      return null
    }
  }

  /**
   * Find bills by date range
   *
   * @example
   *   const dailyBills = await billRepo.findByDateRange(
   *     startDate,
   *     endDate,
   *     branchId,
   *     orgId
   *   )
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    branchId: string,
    organizationId: string
  ): Promise<Bill[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'createdAt', operator: '>=', value: startDate },
          { field: 'createdAt', operator: '<=', value: endDate },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding bills by date range:', error)
      return []
    }
  }

  /**
   * Count bills by payment status
   *
   * @example
   *   const pendingCount = await billRepo.countByPaymentStatus('pending', orgId)
   */
  async countByPaymentStatus(
    paymentStatus: Bill['paymentStatus'],
    organizationId: string,
    branchId?: string
  ): Promise<number> {
    try {
      const filters: QueryOptions['filters'] = [
        { field: 'paymentStatus', operator: '==', value: paymentStatus },
        { field: 'organizationId', operator: '==', value: organizationId },
      ]

      if (branchId) {
        filters.push({ field: 'branchId', operator: '==', value: branchId })
      }

      return await this.count({ filters })
    } catch (error) {
      console.error('Error counting bills by payment status:', error)
      return 0
    }
  }

  /**
   * Get revenue sum for period
   * Used for dashboard and reporting
   *
   * @example
   *   const revenue = await billRepo.getRevenueSum(
   *     startDate,
   *     endDate,
   *     branchId,
   *     orgId
   *   )
   */
  async getRevenueSum(
    startDate: Date,
    endDate: Date,
    branchId: string,
    organizationId: string,
    paymentStatusFilter?: Bill['paymentStatus']
  ): Promise<number> {
    try {
      const filters: QueryOptions['filters'] = [
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'createdAt', operator: '>=', value: startDate },
        { field: 'createdAt', operator: '<=', value: endDate },
      ]

      if (paymentStatusFilter) {
        filters.push({ field: 'paymentStatus', operator: '==', value: paymentStatusFilter })
      }

      const bills = await this.findMany({ filters })

      // Sum totalAmount fields
      return bills.reduce((sum, bill) => {
        const amount = parseFloat(bill.totalAmount) || 0
        return sum + amount
      }, 0)
    } catch (error) {
      console.error('Error calculating revenue sum:', error)
      return 0
    }
  }

  /**
   * Update bill payment status
   * Convenience method for payment updates
   *
   * @example
   *   const result = await billRepo.updatePaymentStatus(
   *     billId,
   *     'completed',
   *     amountPaid,
   *     balanceDue,
   *     userId
   *   )
   */
  async updatePaymentStatus(
    billId: string,
    paymentStatus: Bill['paymentStatus'],
    amountPaid: string | number,
    balanceDue: string | number,
    userId: string
  ): Promise<UpdateResult<Bill>> {
    try {
      const isFullyPaid = parseFloat(balanceDue.toString()) <= 0
      const billStatus = isFullyPaid ? 'paid' : 'open'

      const updates: UpdateBillPayload = {
        paymentStatus,
        amountPaid: amountPaid.toString(),
        balanceDue: balanceDue.toString(),
        billStatus,
      }

      if (isFullyPaid) {
        updates.settledAt = new Date()
        updates.settledById = userId
      }

      return await this.update(billId, updates as Partial<Bill>, userId)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Cancel bill
   * Convenience method for bill cancellation
   *
   * @example
   *   const result = await billRepo.cancel(billId, reason, userId)
   */
  async cancel(billId: string, reason: string, userId: string): Promise<UpdateResult<Bill>> {
    try {
      return await this.update(
        billId,
        {
          billStatus: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason,
        } as Partial<Bill>,
        userId
      )
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Batch update bill payment statuses
   * Used for bulk payment processing
   *
   * @example
   *   const result = await billRepo.batchUpdatePaymentStatus(
   *     billIds,
   *     'completed',
   *     userId
   *   )
   */
  async batchUpdatePaymentStatus(
    billIds: string[],
    paymentStatus: Bill['paymentStatus'],
    userId: string
  ): Promise<BatchResult> {
    try {
      return await this.batchWrite((batch) => {
        billIds.forEach((billId) => {
          const docRef = this.getDocRef(billId)
          batch.update(docRef, {
            paymentStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: userId,
          } as Record<string, any>)
        })
      })
    } catch (error) {
      return {
        success: false,
        successCount: 0,
        failureCount: billIds.length,
        errors: [
          {
            docId: 'batch',
            error: this.getErrorMessage(error),
          },
        ],
      }
    }
  }

  /**
   * Helper to convert numeric amounts to decimal strings
   */
  protected toDecimalString(value: string | number): string {
    return typeof value === 'string' ? value : value.toFixed(2)
  }

  /**
   * Create bill with nested items
   * Creates bill and bill items in transaction
   *
   * @example
   *   const result = await billRepo.createWithItems(
   *     billData,
   *     billItems,
   *     userId
   *   )
   */
  async createWithItems(
    billData: CreateBillPayload,
    billItems: any[],
    userId: string
  ): Promise<CreateResult<Bill>> {
    try {
      return await this.transaction(async (transaction) => {
        // Create bill document
        const billRef = this.db.collection(this.collectionName).doc()
        
        const billPayload: Bill = {
          id: billRef.id,
          ...billData,
          subtotal: this.toDecimalString(billData.subtotal),
          discountAmount: this.toDecimalString(billData.discountAmount || 0),
          discountPercentage: this.toDecimalString(billData.discountPercentage || 0),
          taxAmount: this.toDecimalString(billData.taxAmount),
          serviceCharge: this.toDecimalString(billData.serviceCharge || 0),
          roundingAdjustment: this.toDecimalString(billData.roundingAdjustment || 0),
          totalAmount: this.toDecimalString(billData.totalAmount),
          amountPaid: this.toDecimalString(billData.amountPaid || 0),
          balanceDue: this.toDecimalString(billData.balanceDue),
          paymentStatus: billData.paymentStatus || 'pending',
          billStatus: billData.billStatus || 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        } as Bill

        transaction.set(billRef, billPayload)

        // Create bill items
        const itemsRef = this.db.collection(COLLECTIONS.billItems)
        for (const item of billItems) {
          const itemRef = itemsRef.doc()
          const itemPayload = {
            id: itemRef.id,
            billId: billRef.id,
            ...item,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId,
            updatedBy: userId,
          }
          transaction.set(itemRef, itemPayload)
        }

        return {
          success: true,
          data: billPayload,
        }
      })
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

}
