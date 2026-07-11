/**
 * GET /api/orders/live?branchId=<id>&status=active
 * Get active live orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { getLiveOrders } from '@/api/services/orders.service'
import { ValidationError } from '@/api/utils/errors'

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const branchId = request.nextUrl.searchParams.get('branchId')
    const status = request.nextUrl.searchParams.get('status') || 'active'

    // Validate input
    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    if (status !== 'active') {
      // TODO: Support other status filters
      throw new ValidationError("status must be 'active'")
    }

    // TODO: Extract real auth context from JWT token
    const authContext = getMockAuthContext()

    // Extract tenant context
    const tenantContext = extractTenantContext(authContext)

    // Fetch live orders
    const liveOrders = await getLiveOrders(branchId, tenantContext)

    return NextResponse.json(successResponse(liveOrders))
  } catch (error: any) {
    console.error('Error fetching live orders:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'ORDERS_ERROR'),
      { status: 500 }
    )
  }
}
