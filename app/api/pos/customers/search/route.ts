/**
 * GET /api/pos/customers/search?query=<phoneOrName>
 * Search customers by phone number or name
 * Returns: array of matching customers with id, phone, firstName, lastName, email
 */

import { NextRequest, NextResponse } from 'next/server'
import { CustomerRepository } from '@/repositories'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

const customerRepo = new CustomerRepository()

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

    // Search customers by query using repository
    const customers = await customerRepo.search(tenantContext.organizationId, query)

    // Limit to 10 results and format response
    const results = customers.slice(0, 10).map((customer) => ({
      id: customer.id,
      phone: customer.phone,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
    }))

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
