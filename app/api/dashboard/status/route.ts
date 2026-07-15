/**
 * GET /api/dashboard/status?branchId=<id>&restaurantId=<id>
 * Retrieve current restaurant operational status
 * Returns: operationalStatus, isOpen, openingTime, closingTime, currentTime, timezone, hasManualOverride
 * 
 * FLOW: API Route → Service → Repository → Firestore
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext, validateStatusUpdatePermission } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError, AuthorizationError } from '@/api/utils/errors'
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
    const { branchId, restaurantId, operationalStatus, overrideDurationMinutes } = body

    // Validate inputs
    if (!branchId || !restaurantId) {
      throw new ValidationError('branchId and restaurantId are required', 'MISSING_PARAMS')
    }

    if (!operationalStatus) {
      throw new ValidationError('operationalStatus is required', 'MISSING_STATUS')
    }

    if (typeof operationalStatus !== 'string') {
      throw new ValidationError('operationalStatus must be a string', 'INVALID_STATUS_TYPE')
    }

    // Validate operational status value
    const validStatuses = ['OPEN', 'CLOSED', 'RUSH_HOUR']
    if (!validStatuses.includes(operationalStatus)) {
      throw new ValidationError(
        `Invalid operationalStatus. Must be one of: ${validStatuses.join(', ')}`,
        'INVALID_STATUS'
      )
    }

    // Validate override duration if provided
    if (overrideDurationMinutes !== undefined && overrideDurationMinutes !== null) {
      // Check type
      if (typeof overrideDurationMinutes !== 'number') {
        throw new ValidationError(
          'overrideDurationMinutes must be a number',
          'INVALID_DURATION_TYPE'
        )
      }

      // Check if it's an integer
      if (!Number.isInteger(overrideDurationMinutes)) {
        throw new ValidationError(
          'overrideDurationMinutes must be an integer',
          'INVALID_DURATION_FORMAT'
        )
      }

      // Check minimum value
      if (overrideDurationMinutes <= 0) {
        throw new ValidationError(
          'overrideDurationMinutes must be greater than 0',
          'INVALID_DURATION_MIN'
        )
      }

      // Check maximum value (24 hours = 1440 minutes)
      if (overrideDurationMinutes > 1440) {
        throw new ValidationError(
          'overrideDurationMinutes cannot exceed 1440 minutes (24 hours)',
          'DURATION_EXCEEDED'
        )
      }

      // Ensure override duration makes sense with status
      // Can't set CLOSED with very short durations if it would be < 5 minutes
      if (overrideDurationMinutes < 5) {
        throw new ValidationError(
          'overrideDurationMinutes must be at least 5 minutes',
          'DURATION_TOO_SHORT'
        )
      }
    }

    // Extract auth and tenant context
    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // PERMISSION CHECK: Validate that user can modify restaurant status
    try {
      validateStatusUpdatePermission(authContext)
    } catch (error: any) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          errorResponse(error.message, error.code),
          { status: 403 }
        )
      }
      throw error
    }

    // Update restaurant status
    const updatedStatus = await updateRestaurantStatus(
      restaurantId,
      operationalStatus,
      authContext.userId,
      tenantContext,
      overrideDurationMinutes
    )

    return NextResponse.json(
      successResponse(updatedStatus, 'Restaurant status updated successfully')
    )
  } catch (error: any) {
    console.error('Error updating restaurant status:', error)

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 403 }
      )
    }

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
