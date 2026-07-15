/**
 * POST /api/payments
 * Record a payment for a bill
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
 * TODO: Implement with Firestore BillingService
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

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

    // TODO: Replace with Firestore BillingService
    // Mock response: return payment created
    return NextResponse.json(
      successResponse({
        paymentId: `payment_${Date.now()}`,
        billId: billId,
        amount: amount,
        paymentMethod: paymentMethod,
        status: 'completed',
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
