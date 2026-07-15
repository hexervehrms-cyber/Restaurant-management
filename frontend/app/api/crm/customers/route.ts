/**
 * GET /api/crm/customers?branchId=<id>&tier=all&search=""
 * Get customers for a branch
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 * TODO: Implement with Firestore CustomerRepository
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')
    const search = request.nextUrl.searchParams.get('search') || ''

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // TODO: Replace with Firestore CustomerRepository
    // Mock response: empty customers array
    const formatted: any[] = []

    return NextResponse.json(successResponse({
      data: formatted,
      meta: {
        total: formatted.length,
        tiers: {
          gold: formatted.filter((c) => c.tier === 'gold').length,
          silver: formatted.filter((c) => c.tier === 'silver').length,
          bronze: formatted.filter((c) => c.tier === 'bronze').length,
        },
      },
    }))
  } catch (error: any) {
    console.error('Error fetching customers:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'CRM_ERROR'),
      { status: 500 }
    )
  }
}
