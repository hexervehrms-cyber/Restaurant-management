/**
 * POST /api/payments/razorpay/verify
 * Verify Razorpay payment and update bill status
 * 
 * Request body:
 * {
 *   razorpay_order_id: string,
 *   razorpay_payment_id: string,
 *   razorpay_signature: string,
 *   billId: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import {
  verifyRazorpaySignature,
  fetchRazorpayPayment,
  paiseToRupees,
} from '@/lib/razorpay'
import { BillRepository, PaymentRepository } from '@/src/repositories'

const billRepo = new BillRepository()
const paymentRepo = new PaymentRepository()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      billId,
    } = body

    // Validate
    if (!razorpay_order_id) throw new ValidationError('razorpay_order_id is required')
    if (!razorpay_payment_id) throw new ValidationError('razorpay_payment_id is required')
    if (!razorpay_signature) throw new ValidationError('razorpay_signature is required')
    if (!billId) throw new ValidationError('billId is required')

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Verify Razorpay signature
    const isSignatureValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isSignatureValid) {
      throw new ValidationError('Invalid Razorpay signature - payment verification failed')
    }

    // Fetch payment details from Razorpay
    const razorpayPayment = await fetchRazorpayPayment(razorpay_payment_id)

    if (razorpayPayment.status !== 'captured') {
      throw new ValidationError(
        `Payment status is ${razorpayPayment.status}, expected 'captured'`
      )
    }

    // Fetch the bill
    const bill = await billRepo.findById(billId)

    if (!bill || bill.organizationId !== tenantContext.organizationId) {
      throw new ValidationError('Bill not found')
    }

    // Calculate payment amount
    const paymentAmount = paiseToRupees(razorpayPayment.amount)

    // Validate amount matches
    const balanceDue = parseFloat(bill.balanceDue as any)
    if (paymentAmount > balanceDue) {
      throw new ValidationError(
        'Payment amount exceeds balance due'
      )
    }

    // Update or create payment record
    const existingPayment = await paymentRepo.findMany({
      filters: [
        { field: 'referenceNumber', operator: '==', value: razorpay_order_id },
        { field: 'billId', operator: '==', value: billId },
      ],
    })

    let paymentId: string
    if (existingPayment.length > 0) {
      const updated = await paymentRepo.update(
        existingPayment[0].id,
        {
          amount: paymentAmount.toFixed(2),
          transactionId: razorpay_payment_id,
          paymentStatus: 'completed',
        },
        authContext.userId
      )
      paymentId = updated.data?.id || existingPayment[0].id
    } else {
      const created = await paymentRepo.create(
        {
          billId: bill.id,
          orderId: bill.orderId,
          customerId: bill.customerId,
          amount: paymentAmount.toFixed(2),
          paymentMethod: 'online_payment',
          paymentStatus: 'completed',
          referenceNumber: razorpay_order_id,
          transactionId: razorpay_payment_id,
          receivedById: authContext.userId,
        },
        authContext.userId,
        tenantContext.organizationId
      )
      paymentId = created.data?.id || ''
    }

    // Update bill with payment
    const amountPaid = parseFloat(bill.amountPaid as any)
    const newAmountPaid = amountPaid + paymentAmount
    const newBalanceDue = balanceDue - paymentAmount
    const isFullyPaid = newBalanceDue <= 0

    const billUpdateResult = await billRepo.updatePaymentStatus(
      billId,
      isFullyPaid ? 'completed' : 'pending',
      newAmountPaid.toFixed(2),
      Math.max(0, newBalanceDue).toFixed(2),
      authContext.userId
    )

    return NextResponse.json(
      successResponse({
        paymentId,
        amount: paymentAmount,
        transactionId: razorpay_payment_id,
        billStatus: isFullyPaid ? 'paid' : 'open',
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalanceDue),
        isFullyPaid,
      }),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to verify Razorpay payment',
        'RAZORPAY_VERIFY_ERROR'
      ),
      { status: 500 }
    )
  }
}
