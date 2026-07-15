/**
 * POST /api/orders/[id]/send-to-kitchen
 * Send an order to kitchen for preparation
 * Creates kitchen tickets and updates order status
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 */

import { NextRequest, NextResponse } from 'next/server'
import { KitchenService } from '@/backend/src/services/KitchenService'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

const kitchenService = new KitchenService()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    if (!orderId) {
      throw new ValidationError('orderId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // TODO: Fetch order from Firestore
    // For now, return mock response
    // const order = await orderRepo.findById(orderId)

    // Return stub response
    return NextResponse.json(
      successResponse({
        ticketId: 'stub-ticket-id',
        ticketNumber: 'TICKET-001',
        itemCount: 0,
        status: 'sent_to_kitchen',
      }),
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error sending order to kitchen:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to send order to kitchen',
        'KITCHEN_ERROR'
      ),
      { status: 500 }
    )
  }
}
