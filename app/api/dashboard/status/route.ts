/**
 * GET /api/dashboard/status?branchId=<id>&restaurantId=<id>
 * Retrieve current restaurant operational status
 * Returns: operationalStatus, isOpen, openingTime, closingTime, currentTime, timezone, hasManualOverride
 * 
 * FLOW: API Route → Service → Repository → Firestore
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { getRestaurantStatus, updateRestaurantStatus } from '@/api/services/dashboard-status.service'

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const branchId = request.nextUrl.searchParams.get('branchId')
    const restaurantId = request.nextUrl.searchParams.get('restaurantId')

    // Validate inputs
    if (!branchId || !restaurantId) {
      throw new ValidationError('branchId and restaurantId are required', 'MISSING_PARAMS')
    }

    // Extract auth and tenant context
    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Get restaurant status from service
    const status = await getRestaurantStatus(branchId, restaurantId, tenantContext)

    return NextResponse.json(
      successResponse(status, 'Restaurant status retrieved successfully')
    )
  } catch (error: any) {
    console.error('Error fetching restaurant status:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch restaurant status', 'RESTAURANT_STATUS_ERROR'),
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { branchId, restaurantId, operationalStatus } = body

    // Validate inputs
    if (!branchId || !restaurantId) {
      throw new ValidationError('branchId and restaurantId are required', 'MISSING_PARAMS')
    }

    if (!operationalStatus) {
      throw new ValidationError('operationalStatus is required', 'MISSING_STATUS')
    }

    // Validate operational status value
    const validStatuses = ['OPEN', 'CLOSED', 'RUSH_HOUR']
    if (!validStatuses.includes(operationalStatus)) {
      throw new ValidationError(
        `Invalid operationalStatus. Must be one of: ${validStatuses.join(', ')}`,
        'INVALID_STATUS'
      )
    }

    // Extract auth and tenant context
    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Update restaurant status
    const updatedStatus = await updateRestaurantStatus(
      restaurantId,
      operationalStatus,
      authContext.userId,
      tenantContext
    )

    return NextResponse.json(
      successResponse(updatedStatus, 'Restaurant status updated successfully')
    )
  } catch (error: any) {
    console.error('Error updating restaurant status:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message || 'Failed to update restaurant status', 'RESTAURANT_STATUS_ERROR'),
      { status: 500 }
    )
  }
}
