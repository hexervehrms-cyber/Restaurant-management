/**
 * GET /api/dashboard/revenue-chart?branchId=<id>&range=today|week
 * Get revenue chart data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import {
  getRevenueChartToday,
  getRevenueChartWeek,
} from '@/api/services/dashboard.service'
import { ValidationError } from '@/api/utils/errors'
import { logger } from '@/lib/logger'

// Prevent static generation for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const branchId = request.nextUrl.searchParams.get('branchId')
    const range = request.nextUrl.searchParams.get('range') || 'today'

    // Validate input
    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    if (!['today', 'week'].includes(range)) {
      throw new ValidationError("range must be 'today' or 'week'")
    }

    // TODO: Extract real auth context from JWT token
    const authContext = getMockAuthContext()

    // Extract tenant context
    const tenantContext = extractTenantContext(authContext)

    // Fetch revenue chart data
    let chartData

    if (range === 'today') {
      chartData = await getRevenueChartToday(branchId, tenantContext)
    } else {
      chartData = await getRevenueChartWeek(branchId, tenantContext)
    }

    logger.debug('Revenue chart data fetched successfully')
    return NextResponse.json(successResponse(chartData))
  } catch (error: any) {
    if (error instanceof ValidationError) {
      logger.warn('Validation error in revenue chart request', { error: error.message })
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    logger.error('Error fetching revenue chart', { error })
    return NextResponse.json(
      errorResponse(error.message, 'CHART_ERROR'),
      { status: 500 }
    )
  }
}
