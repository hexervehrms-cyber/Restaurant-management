/**
 * Billing Service
 * Business logic for billing operations
 * Uses repositories for Firestore data access
 * 
 * RESPONSIBILITIES:
 * - Bill creation and generation
 * - Payment processing and recording
 * - Refund processing
 * - Revenue calculations
 * - Bill number generation
 */

import { BillRepository, Bill, CreateBillPayload } from '../repositories/BillRepository'
import { BillItemRepository, BillItem, CreateBillItemPayload } from '../repositories/BillItemRepository'
import { PaymentRepository, Payment, CreatePaymentPayload } from '../repositories/PaymentRepository'
import { RefundRepository, Refund, CreateRefundPayload } from '../repositories/RefundRepository'
import { BaseDocument } from '../types/firestore'
import { COLLECTIONS } from '../firestore/collections'

/**
 * Bill creation request
 */
export interface CreateBillRequest {
  billNumber: string
  orderId?: string
  branchId: string
  restaurantId: string
  organizationId: string
  customerId?: string
  tableId?: string
  billType: Bill['billType']
  subtotal: number
  discountAmount?: number
  discountPercentage?: number
  discountReason?: string
  taxAmount: number
  serviceCharge?: number
  roundingAdjustment?: number
  notes?: string
  createdById?: string
}

/**
 * Bill item request
 */
export interface BillItemRequest {
  menuItemId?: string
  itemName: string
  basePrice: number
  quantity: number
  itemTotal: number
  taxAmount?: number
  discountAmount?: number
}

/**
 * Payment recording request
 */
export interface RecordPaymentRequest {
  billId: string
  amount: number
  paymentMethod: Payment['paymentMethod']
  referenceNumber?: string
  transactionId?: string
  notes?: string
  receivedById?: string
}

/**
 * Billing Service
 * Orchestrates billing operations
 */
export class BillingService {
  private billRepository: BillRepository
  private billItemRepository: BillItemRepository
  private paymentRepository: PaymentRepository
  private refundRepository: RefundRepository

  constructor() {
    this.billRepository = new BillRepository()
    this.billItemRepository = new BillItemRepository()
    this.paymentRepository = new PaymentRepository()
    this.refundRepository = new RefundRepository()
  }

  /**
   * Create a complete bill with items
   *
   * @example
   *   const result = await billingService.createBill(
   *     {
   *       billNumber: 'BILL-20240115-0001',
   *       branchId: 'branch-123',
   *       ...
   *     },
   *     items,
   *     userId
   *   )
   */
  async createBill(
    billData: CreateBillRequest,
    items: BillItemRequest[],
    userId: string
  ): Promise<{ success: boolean; billId?: string; error?: string }> {
    try {
      // Calculate totals
      const calculatedTotals = this.calculateBillTotals(billData, items)

      // Prepare bill payload - type without organizationId and base document fields
      const billPayload: Omit<Bill, keyof BaseDocument> = {
        billNumber: billData.billNumber,
        orderId: billData.orderId,
        branchId: billData.branchId,
        restaurantId: billData.restaurantId,
        customerId: billData.customerId,
        tableId: billData.tableId,
        billType: billData.billType,
        subtotal: billData.subtotal.toFixed(2),
        discountAmount: (billData.discountAmount || 0).toFixed(2),
        discountPercentage: (billData.discountPercentage || 0).toFixed(2),
        discountReason: billData.discountReason,
        taxAmount: billData.taxAmount.toFixed(2),
        serviceCharge: (billData.serviceCharge || 0).toFixed(2),
        roundingAdjustment: (billData.roundingAdjustment || 0).toFixed(2),
        totalAmount: calculatedTotals.totalAmount.toFixed(2),
        amountPaid: '0.00',
        balanceDue: calculatedTotals.totalAmount.toFixed(2),
        paymentStatus: 'pending' as const,
        billStatus: 'open' as const,
        notes: billData.notes,
        metadata: {},
      }

      // Prepare bill items
      const billItems: Array<Omit<BillItem, keyof BaseDocument>> = items.map((item) => ({
        billId,
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        basePrice: item.basePrice.toFixed(2),
        quantity: item.quantity,
        itemTotal: item.itemTotal.toFixed(2),
        taxAmount: (item.taxAmount || 0).toFixed(2),
        discountAmount: (item.discountAmount || 0).toFixed(2),
        lineTotal: ((item.itemTotal || 0) + (item.taxAmount || 0) - (item.discountAmount || 0)).toFixed(2),
      }))

      // Create bill with items
      const billResult = await this.billRepository.create(billPayload, userId, billData.organizationId)

      if (!billResult.success || !billResult.data?.id) {
        return {
          success: false,
          error: billResult.error || 'Failed to create bill',
        }
      }

      const billId = billResult.data.id

      // Create bill items
      for (const item of billItems) {
        await this.billItemRepository.create(
          item,
          userId,
          billData.organizationId
        )
      }

      return {
        success: true,
        billId,
      }
    } catch (error) {
      console.error('Error creating bill:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bill',
      }
    }
  }

  /**
   * Record a payment for a bill
   *
   * @example
   *   const result = await billingService.recordPayment(
   *     {
   *       billId: 'bill-123',
   *       amount: 500,
   *       paymentMethod: 'cash',
   *     },
   *     userId
   *   )
   */
  async recordPayment(request: RecordPaymentRequest, userId: string): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      // Fetch bill
      const bill = await this.billRepository.findById(request.billId)
      if (!bill) {
        return {
          success: false,
          error: 'Bill not found',
        }
      }

      // Validate payment amount
      const balanceDue = parseFloat(bill.balanceDue)
      if (request.amount > balanceDue) {
        return {
          success: false,
          error: `Payment amount cannot exceed balance due (₹${balanceDue.toFixed(2)})`,
        }
      }

      // Create payment record
      const paymentPayload: Omit<Payment, keyof BaseDocument> = {
        billId: request.billId,
        orderId: bill.orderId,
        customerId: bill.customerId,
        amount: request.amount.toFixed(2),
        paymentMethod: request.paymentMethod,
        paymentStatus: 'completed' as const,
        referenceNumber: request.referenceNumber,
        transactionId: request.transactionId,
        notes: request.notes,
        receivedById: request.receivedById || userId,
      }

      const paymentResult = await this.paymentRepository.create(paymentPayload, userId, bill.organizationId)

      if (!paymentResult.success || !paymentResult.data?.id) {
        return {
          success: false,
          error: paymentResult.error || 'Failed to record payment',
        }
      }

      // Update bill payment status
      const newAmountPaid = parseFloat(bill.amountPaid) + request.amount
      const newBalanceDue = balanceDue - request.amount
      const isFullyPaid = newBalanceDue <= 0

      await this.billRepository.updatePaymentStatus(
        request.billId,
        isFullyPaid ? 'completed' : 'pending',
        newAmountPaid.toFixed(2),
        Math.max(0, newBalanceDue).toFixed(2),
        userId
      )

      return {
        success: true,
        paymentId: paymentResult.data.id,
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record payment',
      }
    }
  }

  /**
   * Process a refund
   *
   * @example
   *   const result = await billingService.processRefund(
   *     paymentId,
   *     amount,
   *     reason,
   *     userId
   *   )
   */
  async processRefund(
    paymentId: string,
    refundAmount: number,
    reason: string,
    userId: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      // Fetch payment
      const payment = await this.paymentRepository.findById(paymentId)
      if (!payment) {
        return {
          success: false,
          error: 'Payment not found',
        }
      }

      // Validate refund amount
      const paymentAmount = parseFloat(payment.amount)
      if (refundAmount > paymentAmount) {
        return {
          success: false,
          error: `Refund amount cannot exceed payment amount (₹${paymentAmount.toFixed(2)})`,
        }
      }

      // Create refund record
      const refundPayload: Omit<Refund, keyof BaseDocument> = {
        paymentId,
        billId: payment.billId,
        orderId: payment.orderId,
        refundAmount: refundAmount.toFixed(2),
        refundReason: reason,
        paymentMethod: payment.paymentMethod,
        status: 'pending' as const,
        processedById: userId,
      }

      const refundResult = await this.refundRepository.create(refundPayload, userId, payment.organizationId)

      if (!refundResult.success || !refundResult.data?.id) {
        return {
          success: false,
          error: refundResult.error || 'Failed to process refund',
        }
      }

      return {
        success: true,
        refundId: refundResult.data.id,
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process refund',
      }
    }
  }

  /**
   * Get bills for a branch
   *
   * @example
   *   const bills = await billingService.getBillsByBranch(branchId, orgId)
   */
  async getBillsByBranch(branchId: string, organizationId: string): Promise<Bill[]> {
    try {
      return await this.billRepository.findByBranch(branchId, organizationId)
    } catch (error) {
      console.error('Error fetching bills:', error)
      return []
    }
  }

  /**
   * Get bills by payment status
   *
   * @example
   *   const bills = await billingService.getBillsByStatus('pending', orgId)
   */
  async getBillsByStatus(
    status: Bill['paymentStatus'],
    organizationId: string,
    branchId?: string
  ): Promise<Bill[]> {
    try {
      return await this.billRepository.findByPaymentStatus(status, organizationId, branchId)
    } catch (error) {
      console.error('Error fetching bills by status:', error)
      return []
    }
  }

  /**
   * Calculate revenue for period
   *
   * @example
   *   const revenue = await billingService.getRevenue(startDate, endDate, branchId, orgId)
   */
  async getRevenue(
    startDate: Date,
    endDate: Date,
    branchId: string,
    organizationId: string
  ): Promise<{ revenue: number; count: number }> {
    try {
      const revenue = await this.billRepository.getRevenueSum(startDate, endDate, branchId, organizationId, 'completed')
      const count = await this.billRepository.count({
        filters: [
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'createdAt', operator: '>=', value: startDate },
          { field: 'createdAt', operator: '<=', value: endDate },
          { field: 'paymentStatus', operator: '==', value: 'completed' },
        ],
      })

      return { revenue, count }
    } catch (error) {
      console.error('Error calculating revenue:', error)
      return { revenue: 0, count: 0 }
    }
  }

  /**
   * Calculate bill totals
   * Internal helper for calculations
   */
  private calculateBillTotals(billData: CreateBillRequest, items: BillItemRequest[]): { totalAmount: number } {
    let itemsTotal = items.reduce((sum, item) => sum + (item.itemTotal || 0), 0)
    let taxTotal = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0)
    let discountTotal = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0)

    // Add bill-level adjustments
    const serviceCharge = billData.serviceCharge || 0
    const roundingAdjustment = billData.roundingAdjustment || 0

    const totalAmount = itemsTotal + taxTotal + serviceCharge + roundingAdjustment - discountTotal

    return { totalAmount }
  }
}

