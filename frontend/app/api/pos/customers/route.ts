/**
 * POST /api/pos/customers
 * Create a quick customer from POS
 * Required: phone
 * Optional: firstName, lastName, email
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 * TODO: Implement with Firestore CustomerRepository
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, firstName, lastName, email } = body

    if (!phone) {
      throw new ValidationError('phone is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // TODO: Replace with Firestore CustomerRepository
    // Mock response: return new customer
    const newCustomer = {
      id: `customer_${Date.now()}`,
      phone: phone,
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || '',
    }

    return NextResponse.json(
      successResponse(newCustomer),
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating customer:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'CUSTOMER_CREATE_ERROR'),
      { status: 500 }
    )
  }
}
