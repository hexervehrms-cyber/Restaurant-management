/**
 * GET /api/dashboard/sidebar-counts?branchId=<id>
 * Get sidebar badge counts
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { startOfDay, endOfDay } from 'date-fns'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const branchId = request.nextUrl.searchParams.get('branchId')

    // Validate input
    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    // TODO: Extract real auth context from JWT token
    const authContext = getMockAuthContext()

    // Extract tenant context
    const tenantContext = extractTenantContext(authContext)

    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)

    // Get active reservations count
    const reservationsCount = await prisma.reservation.count({
      where: {
        organizationId: tenantContext.organizationId,
        branchId: branchId,
        reservationDate: today,
        status: {
          in: ['pending', 'confirmed'],
        },
        deletedAt: null,
      },
    })

    // Get live orders count
    const liveOrdersCount = await prisma.order.count({
      where: {
        organizationId: tenantContext.organizationId,
        branchId: branchId,
        status: {
          in: [
            'pending',
            'confirmed',
            'preparing',
            'ready',
          ],
        },
        deletedAt: null,
      },
    })

    // Get inventory alerts count
    const inventoryAlertsCount = await prisma.lowStockAlert.count({
      where: {
        organizationId: tenantContext.organizationId,
        branchId: branchId,
        alertStatus: 'active',
      },
    })

    // Check if POS is live (open cash register session)
    const posSession = await prisma.cashRegisterSession.findFirst({
      where: {
        organizationId: tenantContext.organizationId,
        cashRegister: {
          branchId: branchId,
        },
        status: 'open',
      },
    })

    // Check if kitchen is live (active kitchen tickets)
    const kitchenTickets = await prisma.kitchenTicket.count({
      where: {
        organizationId: tenantContext.organizationId,
        branchId: branchId,
        status: {
          in: ['pending', 'preparing'],
        },
        deletedAt: null,
      },
    })

    return NextResponse.json(
      successResponse({
        reservations: reservationsCount,
        liveOrders: liveOrdersCount,
        inventoryAlerts: inventoryAlertsCount,
        posLive: !!posSession,
        kitchenLive: kitchenTickets > 0,
      })
    )
  } catch (error: any) {
    console.error('Error fetching sidebar counts:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'SIDEBAR_ERROR'),
      { status: 500 }
    )
  }
}
