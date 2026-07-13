/**
 * POST /api/payments/razorpay/create-order
 * Create a Razorpay order for payment
 * 
 * Request body:
 * {
 *   billId: string,
 *   amount: number (in rupees)
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import {
  createRazorpayOrder,
  rupeesToPaise,
  getRazorpayKeyId,
} from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { billId, amount } = body

    // Validate
    if (!billId) throw new ValidationError('billId is required')
    if (!amount || amount <= 0) throw new ValidationError('amount must be positive')

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: rupeesToPaise(amount),
      currency: 'INR',
      receipt: `BILL-${billId}`,
      notes: {
        bill_id: billId,
        organization_id: tenantContext.organizationId,
      },
    })

    return NextResponse.json(
      successResponse({
        razorpayOrderId: razorpayOrder.id,
        razorpayKey: getRazorpayKeyId(),
        amount: amount,
        currency: 'INR',
        billId: billId,
        prefill: {
          name: authContext.userName || '',
          email: '',
          contact: '',
        },
      }),
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to create Razorpay order',
        'RAZORPAY_ORDER_ERROR'
      ),
      { status: 500 }
    )
  }
}
