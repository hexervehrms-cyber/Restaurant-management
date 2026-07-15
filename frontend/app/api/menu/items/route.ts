/**
 * GET /api/menu/items?branchId=<id>&category=all&search=""
 * Get menu items for a restaurant (via branch)
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 * TODO: Implement with Firestore repositories
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')
    const category = request.nextUrl.searchParams.get('category') || 'all'
    const search = request.nextUrl.searchParams.get('search') || ''

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // TODO: Replace with Firestore menu item repositories
    // Mock response: empty menu items array
    const formatted: any[] = []

    return NextResponse.json(successResponse({
      data: formatted,
      meta: {
        total: formatted.length,
      },
    }))
  } catch (error: any) {
    console.error('Error fetching menu items:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'MENU_ERROR'),
      { status: 500 }
    )
  }
}
