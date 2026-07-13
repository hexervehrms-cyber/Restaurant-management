/**
 * POST /api/bills
 * Create a bill from an order
 * MIGRATED TO FIRESTORE: Uses BillingService
 * 
 * Request body:
 * {
 *   orderId: string,
 *   discount?: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { BillingService } from '@/src/services/BillingService'

const billingService = new BillingService()

async function generateBillNumber(
  branchId: string,
  organizationId: string
): Promise<string> {
  const today = new Date()
  const date = today.toISOString().split('T')[0].replace(/-/g, '')
  // Simple number generation - in production would query database
  const count = Math.floor(Math.random() * 10000)
  return `BILL-${date}-${String(count).padStart(4, '0')}`
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

    // TODO: Fetch order from OrderRepository instead of using mock data
    // For now, generate bill with minimal data
    const billNumber = await generateBillNumber(
      tenantContext.branchId || 'default-branch',
      tenantContext.organizationId
    )

    // Prepare bill creation request
    const result = await billingService.createBill(
      {
        billNumber,
        orderId,
        branchId: tenantContext.branchId || 'default-branch',
        restaurantId: tenantContext.restaurantId || 'default-restaurant',
        organizationId: tenantContext.organizationId,
        discountAmount: discount ? parseFloat(discount as any) : 0,
        billType: 'dine_in',
        subtotal: 0, // Will be fetched from order
        taxAmount: 0, // Will be calculated
      },
      [], // Items will be fetched from order
      authContext.userId
    )

    if (!result.success) {
      throw new ValidationError(result.error || 'Failed to create bill')
    }

    return NextResponse.json(
      successResponse({
        billId: result.billId,
        success: true,
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
