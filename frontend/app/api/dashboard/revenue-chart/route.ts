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

    return NextResponse.json(successResponse(chartData))
  } catch (error: any) {
    console.error('Error fetching revenue chart:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'CHART_ERROR'),
      { status: 500 }
    )
  }
}
