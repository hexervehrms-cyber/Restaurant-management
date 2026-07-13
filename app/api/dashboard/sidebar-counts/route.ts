/**
 * GET /api/dashboard/sidebar-counts?branchId=<id>
 * Get sidebar badge counts
 * 
 * ARCHITECTURE (Phase 6.2.14):
 * All metrics use Firestore-backed repositories:
 * - Inventory alerts: InventoryService (Firestore)
 * - Reservations: ReservationService (Firestore)
 * - Kitchen: KitchenService (Firestore)
 * - Live orders: OrderRepository (Firestore)
 * - POS: Prisma (not yet in migration scope)
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { InventoryService, OrderRepository } from '@/repositories'
import { ReservationService } from '@/backend/src/services/ReservationService'
import { KitchenService } from '@/backend/src/services/KitchenService'

const prisma = new PrismaClient()
const inventoryService = new InventoryService()
const reservationService = new ReservationService()
const kitchenService = new KitchenService()
const orderRepo = new OrderRepository()

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

    // Get active reservations count (using Firestore)
    const pendingCount = await reservationService.getReservationCountByStatus(
      'pending',
      branchId,
      tenantContext.organizationId
    )
    
    const confirmedCount = await reservationService.getReservationCountByStatus(
      'confirmed',
      branchId,
      tenantContext.organizationId
    )

    const reservationsCount = pendingCount + confirmedCount

    // Get live orders count (use OrderRepository - Firestore)
    const liveOrdersCount = await orderRepo.getLiveOrders(
      branchId,
      tenantContext.organizationId
    ).then(orders => orders.length)

    // Get inventory alerts count (using InventoryService + Firestore)
    const inventoryAlertsCount = await inventoryService.countActiveLowStockAlerts(
      branchId,
      tenantContext.restaurantId,
      tenantContext.organizationId
    )

    // Check if POS is live (using Prisma - not in Inventory scope)
    const posSession = await prisma.cashRegisterSession.findFirst({
      where: {
        organizationId: tenantContext.organizationId,
        cashRegister: {
          branchId: branchId,
        },
        status: 'open',
      },
    })

    // Check if kitchen is live (using Firestore)
    const kitchenLiveStatus = await kitchenService.getKitchenLiveStatus(
      branchId,
      tenantContext.organizationId
    )

    return NextResponse.json(
      successResponse({
        reservations: reservationsCount,
        liveOrders: liveOrdersCount,
        inventoryAlerts: inventoryAlertsCount,
        posLive: !!posSession,
        kitchenLive: kitchenLiveStatus.isLive,
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
