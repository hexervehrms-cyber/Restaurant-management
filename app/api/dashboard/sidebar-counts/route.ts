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
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { logger } from '@/lib/logger'

// Prevent static generation for this API route
export const dynamic = 'force-dynamic'

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

    // Return mock data (all counters as 0)
    // TODO: Implement with Firestore repositories
    logger.debug('Sidebar counts retrieved successfully', { branchId })
    return NextResponse.json(
      successResponse({
        reservations: 0,
        liveOrders: 0,
        inventoryAlerts: 0,
        posLive: false,
        kitchenLive: false,
      })
    )
  } catch (error: any) {
    if (error instanceof ValidationError) {
      logger.warn('Validation error in sidebar counts request', { error: error.message })
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    logger.error('Error fetching sidebar counts', { error })
    return NextResponse.json(
      errorResponse(error.message, 'SIDEBAR_ERROR'),
      { status: 500 }
    )
  }
}
