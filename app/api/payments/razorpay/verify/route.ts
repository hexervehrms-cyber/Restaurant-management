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
import { BillingService, RecordPaymentRequest } from '@/services/BillingService'

const billingService = new BillingService()

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

    // Calculate payment amount
    const paymentAmount = paiseToRupees(razorpayPayment.amount)

    // Record the payment through BillingService
    const paymentRequest: RecordPaymentRequest = {
      billId,
      amount: paymentAmount,
      paymentMethod: 'online_payment',
      referenceNumber: razorpay_order_id,
      transactionId: razorpay_payment_id,
      notes: `Razorpay payment verified. Order ID: ${razorpay_order_id}`,
    }

    const result = await billingService.recordPayment(paymentRequest, authContext.userId)

    if (!result.success) {
      throw new ValidationError(result.error || 'Failed to record Razorpay payment')
    }

    return NextResponse.json(
      successResponse({
        paymentId: result.paymentId,
        amount: paymentAmount,
        transactionId: razorpay_payment_id,
        status: 'completed',
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
