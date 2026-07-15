/**
 * GET /api/billing/invoices?branchId=<id>&date=&status=all
 * Get invoices/bills for a branch
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 * TODO: Implement with Firestore BillingService
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')
    const date = request.nextUrl.searchParams.get('date')
    const status = request.nextUrl.searchParams.get('status') || 'all'

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // TODO: Replace with Firestore BillingService
    // Mock response: empty invoices array
    const formatted: any[] = []

    return NextResponse.json(successResponse({
      data: formatted,
      meta: {
        total: formatted.length,
        statuses: {
          paid: formatted.filter((b) => b.status === 'completed').length,
          pending: formatted.filter((b) => b.status === 'pending').length,
          overdue: 0,
        },
      },
    }))
  } catch (error: any) {
    console.error('Error fetching invoices:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'BILLING_ERROR'),
      { status: 500 }
    )
  }
}
