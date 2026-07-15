/**
 * GET /api/dashboard/kpis?branchId=<id>
 * 
 * Returns all dashboard KPI metrics for a restaurant branch.
 * Single aggregated endpoint - not six separate endpoints.
 * 
 * FLOW:
 * API Route
 *   ↓
 * DashboardKPIService.getDashboardKPIs()
 *   ↓
 * Multiple Repository Queries (optimized)
 *   ↓
 * Firestore
 *
 * RESPONSE:
 * {
 *   revenue: {...},
 *   orders: {...},
 *   averageTicket: {...},
 *   occupancy: {...},
 *   guests: {...},
 *   satisfaction: {...},
 *   lastUpdated: "2024-01-15T10:30:00.000Z",
 *   timestamp: 1705318200000
 * }
 *
 * Query Parameters:
 * - branchId (required): Restaurant branch identifier
 * 
 * Response Codes:
 * - 200: Success
 * - 400: Missing branchId
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { dashboardKPIService } from '@/api/services/dashboard-kpi.service'
import { logger } from '@/lib/logger'
import type { DashboardKPIResponse } from '@/types/dashboard'

// Prevent static generation for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const branchId = request.nextUrl.searchParams.get('branchId')

    // Validate input
    if (!branchId) {
      logger.warn('Missing branchId parameter in dashboard KPI request')
      throw new ValidationError('branchId query parameter is required')
    }

    // TODO: Extract real auth context from JWT token
    const authContext = getMockAuthContext()

    // Extract tenant context
    const tenantContext = extractTenantContext(authContext)

    // Get all KPIs from service
    const kpis: DashboardKPIResponse = await dashboardKPIService.getDashboardKPIs(
      branchId,
      tenantContext.organizationId
    )

    logger.debug('Dashboard KPI request completed successfully', {
      branchId,
      organizationId: tenantContext.organizationId,
    })

    // Return success response
    const response = successResponse<DashboardKPIResponse>(kpis, 200)
    return NextResponse.json(response)
  } catch (error) {
    // Handle known errors
    if (error instanceof ValidationError) {
      logger.warn('Validation error in dashboard KPI request', { error: error.message })
      const response = errorResponse(error.message, 400)
      return NextResponse.json(response, { status: 400 })
    }

    // Log and return generic error
    logger.error('Error fetching dashboard KPIs', { error })
    const response = errorResponse('Failed to fetch dashboard KPIs', 500)
    return NextResponse.json(response, { status: 500 })
  }
}
