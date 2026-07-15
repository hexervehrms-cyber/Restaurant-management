/**
 * GET /api/staff?branchId=<id>&role=all&status=all
 * Get staff members for a branch
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 * TODO: Implement with Firestore UserRepository
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

    // TODO: Replace with Firestore UserRepository
    // Mock response: empty staff array
    const formatted: any[] = []

    return NextResponse.json(successResponse({
      data: formatted,
      meta: {
        total: formatted.length,
        roles: [],
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
