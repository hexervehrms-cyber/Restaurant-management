/**
 * POST /api/bills
 * Create a bill from an order
 * 
 * Request body:
 * {
 *   orderId: string,
 *   discount?: number
 * }
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 * TODO: Implement with Firestore BillingService
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

async function generateBillNumber(
  branchId: string,
  organizationId: string
): Promise<string> {
  const today = new Date()
  const date = today.toISOString().split('T')[0].replace(/-/g, '')
  return `BILL-${date}-0001`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, discount } = body

    if (!orderId) {
      throw new ValidationError('orderId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // TODO: Replace with Firestore OrderRepository and BillingService
    // Generate bill number
    const billNumber = await generateBillNumber(
      'stub-branch-id',
      tenantContext.organizationId
    )

    return NextResponse.json(
      successResponse({
        id: 'mock-bill-id',
        billNumber: billNumber,
        totalAmount: 0,
        balanceDue: 0,
        paymentStatus: 'pending',
        itemCount: 0,
      }),
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating bill:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message || 'Failed to create bill', 'BILL_CREATE_ERROR'),
      { status: 500 }
    )
  }
}
