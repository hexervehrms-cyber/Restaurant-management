/**
 * GET /api/dashboard/summary?branchId=<id>&date=today
 * Get dashboard summary statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext, extractAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { getDashboardSummary } from '@/api/services/dashboard.service'
import { ValidationError } from '@/api/utils/errors'
import { logger } from '@/lib/logger'

// Prevent static generation for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const branchId = request.nextUrl.searchParams.get('branchId')
    const date = request.nextUrl.searchParams.get('date') || 'today'

    // Validate input
    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    if (date !== 'today') {
      // TODO: Support other date ranges like week, month
      throw new ValidationError("date must be 'today'")
    }

    // TODO: Extract real auth context from JWT token
    const authContext = getMockAuthContext()

    // Extract tenant context
    const tenantContext = extractTenantContext(authContext)

    // Fetch dashboard summary
    const summary = await getDashboardSummary(branchId, tenantContext)

    logger.debug('Dashboard summary fetched successfully', { branchId })
    return NextResponse.json(successResponse(summary))
  } catch (error: any) {
    if (error instanceof ValidationError) {
      logger.warn('Validation error in dashboard summary request', { error: error.message })
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    logger.error('Error fetching dashboard summary', { error })
    return NextResponse.json(
      errorResponse(error.message, 'DASHBOARD_ERROR'),
      { status: 500 }
    )
  }
}
