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
import { RestaurantTableRepository } from '@/src/repositories'

const tableRepo = new RestaurantTableRepository()

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Fetch all tables for the branch with their current status
    const tables = await tableRepo.findMany({
      filters: [
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'organizationId', operator: '==', value: tenantContext.organizationId },
        { field: 'isDeleted', operator: '==', value: false },
      ],
      orderBy: [
        { field: 'section', direction: 'asc' },
        { field: 'tableNumber', direction: 'asc' },
      ],
    })

    const formatted = tables.map((table) => ({
      id: table.id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      section: table.section,
      status: table.status,
    }))

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
