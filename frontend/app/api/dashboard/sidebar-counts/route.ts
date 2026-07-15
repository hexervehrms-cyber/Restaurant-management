/**
 * GET /api/dashboard/sidebar-counts?branchId=<id>
 * Get sidebar badge counts
 * 
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 * TODO: Implement with Firestore repositories
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

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

    // TODO: Replace with Firestore repositories
    // Return mock data (all counters as 0)
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
