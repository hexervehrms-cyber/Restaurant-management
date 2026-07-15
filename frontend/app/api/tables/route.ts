/**
 * GET /api/tables?branchId=<id>
 * Get all tables for a branch
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 * TODO: Implement with Firestore RestaurantTableRepository
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

    // TODO: Replace with Firestore RestaurantTableRepository
    // Mock response: return empty tables array
    const tables: any[] = []

    return NextResponse.json(successResponse(tables))
  } catch (error: any) {
    console.error('Error fetching tables:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'TABLES_ERROR'),
      { status: 500 }
    )
  }
}
