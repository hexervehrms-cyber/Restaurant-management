/**
 * GET /api/tables?branchId=<id>
 * Get all tables for a branch
 * MIGRATED TO FIRESTORE: Uses RestaurantTableRepository
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { RestaurantTableRepository } from '@/repositories'

const tableRepository = new RestaurantTableRepository()

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const branchId = request.nextUrl.searchParams.get('branchId')

    // Validate input
    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Fetch all tables for the branch
    const tables = await tableRepository.findByBranch(branchId)

    // Filter for organization (soft delete check)
    const filtered = tables.filter(t => !t.isDeleted && t.organizationId === tenantContext.organizationId)

    const response = filtered.map(table => ({
      id: table.id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      section: table.section,
      status: table.status,
    }))

    return NextResponse.json(successResponse(response))
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
