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
import { BillRepository, PaymentRepository } from '@/src/repositories'

const billRepo = new BillRepository()
const paymentRepo = new PaymentRepository()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { billId, amount } = body

    // Validate
    if (!billId) throw new ValidationError('billId is required')
    if (!amount || amount <= 0) throw new ValidationError('amount must be positive')

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Fetch the bill
    const bill = await billRepo.findById(billId)

    if (!bill || bill.organizationId !== tenantContext.organizationId) {
      throw new ValidationError('Bill not found')
    }

    // Validate amount doesn't exceed balance
    const balanceDue = parseFloat(bill.balanceDue as any)
    if (amount > balanceDue) {
      throw new ValidationError(
        `Payment amount cannot exceed balance due (₹${balanceDue})`
      )
    }

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: rupeesToPaise(amount),
      currency: 'INR',
      receipt: bill.billNumber,
      notes: {
        bill_id: billId,
        order_id: bill.orderId || '',
        branch_id: bill.branchId,
        organization_id: tenantContext.organizationId,
      },
    })

    // Store the Razorpay order ID in database for tracking
    await paymentRepo.create(
      {
        billId: bill.id,
        orderId: bill.orderId,
        customerId: bill.customerId,
        amount: parseFloat(bill.totalAmount as any).toFixed(2),
        paymentMethod: 'online_payment',
        paymentStatus: 'pending',
        referenceNumber: razorpayOrder.id,
        transactionId: null,
        notes: `Razorpay order created. Amount: ₹${amount}`,
      },
      authContext.userId,
      tenantContext.organizationId
    )

    return NextResponse.json(
      successResponse({
        razorpayOrderId: razorpayOrder.id,
        razorpayKey: getRazorpayKeyId(),
        amount: amount,
        currency: 'INR',
        billId: billId,
        billNumber: bill.billNumber,
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
