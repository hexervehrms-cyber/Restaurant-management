/**
 * GET /api/pos/customers/search?query=<phoneOrName>
 * Search customers by phone number or name
 * Returns: array of matching customers with id, phone, firstName, lastName, email
 * TODO: Implement with Firestore CustomerRepository
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(successResponse({
        data: [],
        meta: { total: 0 },
      }))
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // TODO: Replace with Firestore CustomerRepository
    // Mock response: empty search results
    const results: any[] = []

    return NextResponse.json(successResponse({
      data: results,
      meta: { total: results.length },
    }))
  } catch (error: any) {
    console.error('Error searching customers:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'CUSTOMER_SEARCH_ERROR'),
      { status: 500 }
    )
  }
}
