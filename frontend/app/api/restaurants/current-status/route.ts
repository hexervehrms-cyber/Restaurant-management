/**
 * GET /api/restaurants/current-status?branchId=<id>
 * Get current restaurant status (open/closed)
 */

import { NextRequest, NextResponse } from 'next/server'
import { RestaurantSettingsRepository } from '@/backend/src/repositories'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

const settingsRepo = new RestaurantSettingsRepository()

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

    // TODO: Fetch branch from Firestore to get restaurantId
    // For now, use mock restaurantId from auth context
    const restaurantId = authContext.restaurantId

    // Fetch restaurant settings
    const settings = await settingsRepo.findByRestaurantAndOrganization(
      restaurantId,
      tenantContext.organizationId
    )

    if (!settings) {
      throw new ValidationError('Restaurant settings not found')
    }

    // Parse operating hours from settings
    // TODO: Implement proper operating hours logic
    const now = new Date()
    const currentHour = now.getHours()

    // Assume operating hours: 6am - 11pm (default if not configured)
    const isOpen = currentHour >= 6 && currentHour < 23
    const closingTime = '11 PM'
    const timezone = settings.timezone || 'Asia/Kolkata'

    return NextResponse.json(
      successResponse({
        isOpen,
        statusLabel: isOpen ? 'Restaurant Open' : 'Restaurant Closed',
        closingTime: isOpen ? closingTime : null,
        timezone,
      })
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
      errorResponse(error.message, 'STATUS_ERROR'),
      { status: 500 }
    )
  }
}
