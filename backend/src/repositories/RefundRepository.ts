/**
 * Refund Repository
 * Handles all refund-related Firestore operations
 * Replaces Prisma Refund model operations with Firestore
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import { BaseDocument, QueryOptions, UpdateResult, CreateResult } from '../types/firestore'

/**
 * Refund Document Model for Firestore
 */
export interface Refund extends BaseDocument {
  // Identifiers
  paymentId?: string
  billId?: string
  orderId?: string
  
  // Foreign Keys
  organizationId: string
  processedById?: string
  
  // Refund Information
  refundAmount: string // Decimal as string
  refundReason: string
  paymentMethod?: 'cash' | 'card' | 'upi' | 'wallet' | 'bank_transfer' | 'cheque' | 'online_payment'
  
  // Gateway Information
  referenceNumber?: string // External refund ID
  transactionId?: string // Payment gateway refund transaction ID
  paymentGatewayResponse?: Record<string, any> // Razorpay/gateway response stored as JSON
  
  // Status & Timestamps
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  processedAt?: Date
  
  // Notes & Metadata
  notes?: string
  metadata?: Record<string, any>
}

/**
 * Refund creation payload
 */
export interface CreateRefundPayload {
  paymentId?: string
  billId?: string
  orderId?: string
  organizationId: string
  refundAmount: string | number
  refundReason: string
  paymentMethod?: Refund['paymentMethod']
  referenceNumber?: string
  transactionId?: string
  paymentGatewayResponse?: Record<string, any>
  status?: Refund['status']
  notes?: string
  metadata?: Record<string, any>
  processedById?: string
}

/**
 * Refund update payload
 */
export interface UpdateRefundPayload {
  refundAmount?: string | number
  refundReason?: string
  status?: Refund['status']
  transactionId?: string
  paymentGatewayResponse?: Record<string, any>
  processedAt?: Date
  processedById?: string
  notes?: string
  metadata?: Record<string, any>
}

/**
 * Refund Repository
 * Extends BaseRepository with Refund-specific operations
 */
export class RefundRepository extends BaseRepository<Refund> {
  constructor() {
    super(COLLECTIONS.refunds)
  }

  /**
   * Find refunds by payment ID
   *
   * @example
   *   const refunds = await refundRepo.findByPayment(paymentId)
   */
  async findByPayment(paymentId: string): Promise<Refund[]> {
    try {
      return await this.findMany({
        filters: [{ field: 'paymentId', operator: '==', value: paymentId }],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding refunds by payment:', error)
      return []
    }
  }

  /**
   * Find refunds by bill ID
   *
   * @example
   *   const refunds = await refundRepo.findByBill(billId)
   */
  async findByBill(billId: string, organizationId: string): Promise<Refund[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'billId', operator: '==', value: billId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding refunds by bill:', error)
      return []
    }
  }

  /**
   * Find refunds by order ID
   *
   * @example
   *   const refunds = await refundRepo.findByOrder(orderId, orgId)
   */
  async findByOrder(orderId: string, organizationId: string): Promise<Refund[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'orderId', operator: '==', value: orderId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding refunds by order:', error)
      return []
    }
  }

  /**
   * Find refunds by status
   *
   * @example
   *   const pendingRefunds = await refundRepo.findByStatus('pending', orgId)
   */
  async findByStatus(
    status: Refund['status'],
    organizationId: string
  ): Promise<Refund[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'status', operator: '==', value: status },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding refunds by status:', error)
      return []
    }
  }

  /**
   * Find refund by reference number
   *
   * @example
   *   const refund = await refundRepo.findByReference('refund_123', orgId)
   */
  async findByReference(referenceNumber: string, organizationId: string): Promise<Refund | null> {
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
      console.error('Error finding refund by reference:', error)
      return null
    }
  }

  /**
   * Find refunds by date range
   *
   * @example
   *   const dailyRefunds = await refundRepo.findByDateRange(
   *     startDate,
   *     endDate,
   *     orgId
   *   )
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    organizationId: string,
    status?: Refund['status']
  ): Promise<Refund[]> {
    try {
      const filters: QueryOptions['filters'] = [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'createdAt', operator: '>=', value: startDate },
        { field: 'createdAt', operator: '<=', value: endDate },
      ]

      if (status) {
        filters.push({ field: 'status', operator: '==', value: status })
      }

      return await this.findMany({
        filters,
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding refunds by date range:', error)
      return []
    }
  }

  /**
   * Get total refund amount for payment
   *
   * @example
   *   const totalRefunded = await refundRepo.getPaymentRefundTotal(paymentId)
   */
  async getPaymentRefundTotal(paymentId: string): Promise<number> {
    try {
      const refunds = await this.findByPayment(paymentId)

      return refunds.reduce((sum, refund) => {
        // Only count completed refunds
        if (refund.status === 'completed') {
          const amount = parseFloat(refund.refundAmount) || 0
          return sum + amount
        }
        return sum
      }, 0)
    } catch (error) {
      console.error('Error calculating refund total:', error)
      return 0
    }
  }

  /**
   * Get total refund amount for bill
   *
   * @example
   *   const billRefunded = await refundRepo.getBillRefundTotal(billId, orgId)
   */
  async getBillRefundTotal(billId: string, organizationId: string): Promise<number> {
    try {
      const refunds = await this.findByBill(billId, organizationId)

      return refunds.reduce((sum, refund) => {
        // Only count completed refunds
        if (refund.status === 'completed') {
          const amount = parseFloat(refund.refundAmount) || 0
          return sum + amount
        }
        return sum
      }, 0)
    } catch (error) {
      console.error('Error calculating bill refund total:', error)
      return 0
    }
  }

  /**
   * Count pending refunds
   *
   * @example
   *   const count = await refundRepo.countPending(orgId)
   */
  async countPending(organizationId: string): Promise<number> {
    try {
      return await this.count({
        filters: [
          { field: 'status', operator: '==', value: 'pending' },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
      })
    } catch (error) {
      console.error('Error counting pending refunds:', error)
      return 0
    }
  }

  /**
   * Update refund status and mark as processed
   * Convenience method for refund processing
   *
   * @example
   *   const result = await refundRepo.markAsProcessed(
   *     refundId,
   *     'completed',
   *     userId
   *   )
   */
  async markAsProcessed(
    refundId: string,
    status: Refund['status'],
    userId: string,
    transactionId?: string
  ): Promise<UpdateResult<Refund>> {
    try {
      const updates: UpdateRefundPayload = {
        status,
        processedAt: new Date(),
        processedById: userId,
      }

      if (transactionId) {
        updates.transactionId = transactionId
      }

      return await this.update(
        refundId,
        updates as Partial<Refund>,
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
   * Create refund from payment
   * Convenience method that extracts refund info from payment
   *
   * @example
   *   const result = await refundRepo.createFromPayment(
   *     payment,
   *     refundReason,
   *     userId
   *   )
   */
  async createFromPayment(
    payment: any,
    refundReason: string,
    userId: string
  ): Promise<CreateResult<Refund>> {
    try {
      const refundPayload: Omit<Refund, keyof BaseDocument> = {
        paymentId: payment.id,
        billId: payment.billId,
        orderId: payment.orderId,
        refundAmount: payment.amount,
        refundReason,
        paymentMethod: payment.paymentMethod,
        status: 'pending' as const,
        notes: `Refund initiated for payment ${payment.id}`,
      }

      return await this.create(
        refundPayload,
        userId,
        payment.organizationId
      )
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
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
