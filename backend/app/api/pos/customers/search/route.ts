/**
 * GET /api/pos/customers/search?query=<phoneOrName>
 * Search customers by phone number or name
 * Returns: array of matching customers with id, phone, firstName, lastName, email
 * 
 * MIGRATED TO FIRESTORE (Phase 6.2.8)
 */

import { NextRequest, NextResponse } from 'next/server'
import { CustomerRepository } from '@/repositories'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        successResponse({
          data: [],
          meta: { total: 0 },
        })
      )
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Initialize repository
    const customerRepo = new CustomerRepository()

    // Search customers
    const customers = await customerRepo.search(
      tenantContext.organizationId,
      query,
      { limit: 10 }
    )

    // Format response with only required fields
    const formatted = customers.map((customer) => ({
      id: customer.id,
      phone: customer.phone || null,
      firstName: customer.firstName || null,
      lastName: customer.lastName || null,
      email: customer.email || null,
    }))

    return NextResponse.json(
      successResponse({
        data: formatted,
        meta: { total: formatted.length },
      })
    )
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
