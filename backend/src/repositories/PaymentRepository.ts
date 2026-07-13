/**
 * Payment Repository
 * Handles all payment-related Firestore operations
 * Replaces Prisma Payment model operations with Firestore
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import { BaseDocument, QueryOptions, UpdateResult, CreateResult, BatchResult } from '../types/firestore'
import * as admin from 'firebase-admin'

/**
 * Payment Document Model for Firestore
 */
export interface Payment extends BaseDocument {
  // Identifiers
  billId: string
  orderId?: string
  
  // Foreign Keys
  organizationId: string
  customerId?: string
  receivedById?: string
  
  // Payment Information
  amount: string // Decimal as string
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet' | 'bank_transfer' | 'cheque' | 'online_payment'
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled'
  
  // Gateway Information
  referenceNumber?: string // External transaction/order ID
  transactionId?: string // Payment gateway transaction ID
  paymentGatewayResponse?: Record<string, any> // Razorpay/gateway response stored as JSON
  
  // Notes & Metadata
  notes?: string
  metadata?: Record<string, any>
}

/**
 * Payment creation payload
 */
export interface CreatePaymentPayload {
  billId: string
  orderId?: string
  organizationId: string
  customerId?: string
  amount: string | number
  paymentMethod: Payment['paymentMethod']
  paymentStatus?: Payment['paymentStatus']
  referenceNumber?: string
  transactionId?: string
  paymentGatewayResponse?: Record<string, any>
  notes?: string
  metadata?: Record<string, any>
  receivedById?: string
}

/**
 * Payment update payload
 */
export interface UpdatePaymentPayload {
  amount?: string | number
  paymentStatus?: Payment['paymentStatus']
  transactionId?: string
  paymentGatewayResponse?: Record<string, any>
  notes?: string
  metadata?: Record<string, any>
  receivedById?: string
}

/**
 * Payment Repository
 * Extends BaseRepository with Payment-specific operations
 */
export class PaymentRepository extends BaseRepository<Payment> {
  constructor() {
    super(COLLECTIONS.payments)
  }

  /**
   * Find payments by bill ID
   *
   * @example
   *   const payments = await paymentRepo.findByBill(billId)
   */
  async findByBill(billId: string): Promise<Payment[]> {
    try {
      return await this.findMany({
        filters: [{ field: 'billId', operator: '==', value: billId }],
        orders: [{ field: 'createdAt', direction: 'asc' }],
      })
    } catch (error) {
      console.error('Error finding payments by bill:', error)
      return []
    }
  }

  /**
   * Find payments by order ID
   *
   * @example
   *   const payments = await paymentRepo.findByOrder(orderId, orgId)
   */
  async findByOrder(orderId: string, organizationId: string): Promise<Payment[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'orderId', operator: '==', value: orderId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'asc' }],
      })
    } catch (error) {
      console.error('Error finding payments by order:', error)
      return []
    }
  }

  /**
   * Find payments by customer
   *
   * @example
   *   const payments = await paymentRepo.findByCustomer(customerId, orgId)
   */
  async findByCustomer(customerId: string, organizationId: string): Promise<Payment[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'customerId', operator: '==', value: customerId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding payments by customer:', error)
      return []
    }
  }

  /**
   * Find payment by reference number (external transaction ID)
   *
   * @example
   *   const payment = await paymentRepo.findByReference(
   *     'razorpay_order_123',
   *     orgId
   *   )
   */
  async findByReference(referenceNumber: string, organizationId: string): Promise<Payment | null> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'referenceNumber', operator: '==', value: referenceNumber },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        limit: 1,
      })

      return docs.length > 0 ? docs[0] : null
    } catch (error) {
      console.error('Error finding payment by reference:', error)
      return null
    }
  }

  /**
   * Find payment by transaction ID
   *
   * @example
   *   const payment = await paymentRepo.findByTransaction(
   *     'txn_12345',
   *     orgId
   *   )
   */
  async findByTransaction(transactionId: string, organizationId: string): Promise<Payment | null> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'transactionId', operator: '==', value: transactionId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        limit: 1,
      })

      return docs.length > 0 ? docs[0] : null
    } catch (error) {
      console.error('Error finding payment by transaction ID:', error)
      return null
    }
  }

  /**
   * Find payments by payment status
   *
   * @example
   *   const completedPayments = await paymentRepo.findByPaymentStatus(
   *     'completed',
   *     orgId
   *   )
   */
  async findByPaymentStatus(
    paymentStatus: Payment['paymentStatus'],
    organizationId: string
  ): Promise<Payment[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'paymentStatus', operator: '==', value: paymentStatus },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding payments by status:', error)
      return []
    }
  }

  /**
   * Find payments by payment method
   *
   * @example
   *   const cashPayments = await paymentRepo.findByMethod('cash', orgId)
   */
  async findByMethod(method: Payment['paymentMethod'], organizationId: string): Promise<Payment[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'paymentMethod', operator: '==', value: method },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding payments by method:', error)
      return []
    }
  }

  /**
   * Find payments by date range
   *
   * @example
   *   const dailyPayments = await paymentRepo.findByDateRange(
   *     startDate,
   *     endDate,
   *     orgId
   *   )
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    organizationId: string,
    paymentStatus?: Payment['paymentStatus']
  ): Promise<Payment[]> {
    try {
      const filters: QueryOptions['filters'] = [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'createdAt', operator: '>=', value: startDate },
        { field: 'createdAt', operator: '<=', value: endDate },
      ]

      if (paymentStatus) {
        filters.push({ field: 'paymentStatus', operator: '==', value: paymentStatus })
      }

      return await this.findMany({
        filters,
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding payments by date range:', error)
      return []
    }
  }

  /**
   * Get total payment amount for bill
   *
   * @example
   *   const total = await paymentRepo.getBillTotal(billId)
   */
  async getBillTotal(billId: string): Promise<number> {
    try {
      const payments = await this.findByBill(billId)
      
      return payments.reduce((sum, payment) => {
        // Only count completed and partially_refunded payments
        if (['completed', 'partially_refunded'].includes(payment.paymentStatus)) {
          const amount = parseFloat(payment.amount) || 0
          return sum + amount
        }
        return sum
      }, 0)
    } catch (error) {
      console.error('Error calculating bill total:', error)
      return 0
    }
  }

  /**
   * Get revenue sum for period
   * Used for dashboard and reporting
   *
   * @example
   *   const revenue = await paymentRepo.getRevenueSum(
   *     startDate,
   *     endDate,
   *     orgId
   *   )
   */
  async getRevenueSum(
    startDate: Date,
    endDate: Date,
    organizationId: string,
    paymentStatus: Payment['paymentStatus'] = 'completed'
  ): Promise<number> {
    try {
      const payments = await this.findByDateRange(startDate, endDate, organizationId, paymentStatus)

      return payments.reduce((sum, payment) => {
        const amount = parseFloat(payment.amount) || 0
        return sum + amount
      }, 0)
    } catch (error) {
      console.error('Error calculating revenue sum:', error)
      return 0
    }
  }

  /**
   * Count payments by status
   *
   * @example
   *   const count = await paymentRepo.countByStatus('completed', orgId)
   */
  async countByStatus(
    paymentStatus: Payment['paymentStatus'],
    organizationId: string
  ): Promise<number> {
    try {
      return await this.count({
        filters: [
          { field: 'paymentStatus', operator: '==', value: paymentStatus },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
      })
    } catch (error) {
      console.error('Error counting payments by status:', error)
      return 0
    }
  }

  /**
   * Update payment status with gateway response
   * Convenience method for payment gateway updates
   *
   * @example
   *   const result = await paymentRepo.updateWithGatewayResponse(
   *     paymentId,
   *     'completed',
   *     razorpayResponse,
   *     userId
   *   )
   */
  async updateWithGatewayResponse(
    paymentId: string,
    paymentStatus: Payment['paymentStatus'],
    gatewayResponse: Record<string, any>,
    userId: string
  ): Promise<UpdateResult<Payment>> {
    try {
      return await this.update(
        paymentId,
        {
          paymentStatus,
          paymentGatewayResponse: gatewayResponse,
        } as Partial<Payment>,
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
   * Batch update payment statuses
   * Used for bulk payment processing
   *
   * @example
   *   const result = await paymentRepo.batchUpdateStatus(
   *     paymentIds,
   *     'completed',
   *     userId
   *   )
   */
  async batchUpdateStatus(
    paymentIds: string[],
    paymentStatus: Payment['paymentStatus'],
    userId: string
  ): Promise<BatchResult> {
    try {
      return await this.batchWrite((batch) => {
        paymentIds.forEach((paymentId) => {
          const docRef = this.getDocRef(paymentId)
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
        failureCount: paymentIds.length,
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
}
