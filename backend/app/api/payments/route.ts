/**
 * POST /api/payments
 * Record a payment for a bill
 * MIGRATED TO FIRESTORE: Uses PaymentRepository and BillingService
 * 
 * Request body:
 * {
 *   billId: string,
 *   amount: number,
 *   paymentMethod: 'cash' | 'card' | 'upi' | 'online_payment' | 'wallet',
 *   referenceNumber?: string,
 *   transactionId?: string,
 *   notes?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { BillingService } from '@/src/services/BillingService'

const billingService = new BillingService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      billId,
      amount,
      paymentMethod,
      referenceNumber,
      transactionId,
      notes,
    } = body

    // Validate required fields
    if (!billId) throw new ValidationError('billId is required')
    if (!amount || amount <= 0) throw new ValidationError('amount must be positive')
    if (!paymentMethod) throw new ValidationError('paymentMethod is required')

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Record payment using BillingService
    const result = await billingService.recordPayment(
      {
        billId,
        amount,
        paymentMethod: paymentMethod as any,
        referenceNumber,
        transactionId,
        notes,
      },
      authContext.userId
    )

    if (!result.success) {
      throw new ValidationError(result.error || 'Failed to record payment')
    }

    return NextResponse.json(
      successResponse({
        paymentId: result.paymentId,
        success: true,
      }),
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error recording payment:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to record payment',
        'PAYMENT_ERROR'
      ),
      { status: 500 }
    )
  }
}
