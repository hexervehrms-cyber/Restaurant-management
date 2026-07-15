/**
 * GET /api/tables?branchId=<id>
 * Get all tables for a branch
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

    // Return mock table data
    // TODO: Implement with Firestore RestaurantTableRepository
    const tables = [
      {
        id: '1',
        tableNumber: '1',
        capacity: 2,
        section: 'Indoor',
        status: 'available',
      },
      {
        id: '2',
        tableNumber: '2',
        capacity: 4,
        section: 'Indoor',
        status: 'available',
      },
      {
        id: '3',
        tableNumber: '3',
        capacity: 6,
        section: 'Outdoor',
        status: 'available',
      },
    ]

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
