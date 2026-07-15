/**
 * GET /api/staff?branchId=<id>&role=all&status=all
 * Get staff members for a branch
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')
    const role = request.nextUrl.searchParams.get('role') || 'all'

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Return mock staff data
    // TODO: Implement with Firestore
    const formatted = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91-9876-543210',
        role: 'waiter',
        avatar: 'JD',
        status: 'active',
        joinDate: '2024-01-15',
        salary: 15000,
        department: 'Service',
        tablesAssigned: [],
        ordersToday: 5,
        performanceScore: 92,
      },
    ]

    return NextResponse.json(successResponse({
      data: formatted,
      meta: {
        total: formatted.length,
        roles: ['waiter'],
      },
    }))
  } catch (error: any) {
    console.error('Error fetching staff:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'STAFF_ERROR'),
      { status: 500 }
    )
  }
}
