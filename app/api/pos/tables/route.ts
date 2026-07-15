/**
 * GET /api/pos/tables?branchId=<id>
 * Get all tables for POS Terminal with current status and occupancy
 * Returns: id, tableNumber, capacity, section, status, currentOrderId, guestCount
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Return mock table data
    // TODO: Implement with Firestore RestaurantTableRepository
    const formatted = [
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
    ]

    return NextResponse.json(successResponse({
      data: formatted,
      meta: {
        total: formatted.length,
      },
    }))
  } catch (error: any) {
    console.error('Error fetching POS tables:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'POS_TABLES_ERROR'),
      { status: 500 }
    )
  }
}
