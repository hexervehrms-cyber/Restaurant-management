/**
 * POST /api/orders/[id]/send-to-kitchen
 * Send an order to kitchen for preparation
 * Creates kitchen tickets and updates order status
 * 
 * MIGRATED TO FIRESTORE: Uses KitchenService and KitchenTicketRepository
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { KitchenService } from '@/src/services/KitchenService'
import { OrderRepository } from '@/src/repositories'

const kitchenService = new KitchenService()
const orderRepo = new OrderRepository()

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

    // Fetch the order
    const order = await orderRepo.findById(orderId)

    if (!order || order.organizationId !== tenantContext.organizationId) {
      throw new ValidationError('Order not found')
    }

    // Validate order status
    if (order.status !== 'confirmed') {
      throw new ValidationError(
        `Only confirmed orders can be sent to kitchen. Current status: ${order.status}`
      )
    }

    // Create kitchen ticket using KitchenService
    const ticketResult = await kitchenService.createKitchenTicket(
      order.id,
      (order.items || []).map((item: any) => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
      })),
      order.branchId,
      order.restaurantId,
      tenantContext.organizationId,
      order.tableNumber ? order.tableNumber : 'Takeaway',
      'POS Order',
      order.notes || null,
      authContext.userId
    )

    // Update order status
    await orderRepo.update(orderId, { status: 'preparing' }, authContext.userId)

    return NextResponse.json(
      successResponse({
        ticketId: ticketResult.ticket.id,
        ticketNumber: ticketResult.ticket.ticketNumber,
        itemCount: ticketResult.items.length,
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
