/**
 * POST /api/pos/customers
 * Create a quick customer from POS
 * Required: phone
 * Optional: firstName, lastName, email
 * 
 * MIGRATED TO FIRESTORE (Phase 6.2.8)
 */

import { NextRequest, NextResponse } from 'next/server'
import { CustomerRepository } from '@/repositories'
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

    // Initialize repository
    const customerRepo = new CustomerRepository()

    // Check if customer already exists with this phone
    const existingCustomer = await customerRepo.findByPhone(
      tenantContext.organizationId,
      phone
    )

    if (existingCustomer) {
      return NextResponse.json(
        successResponse({
          id: existingCustomer.id,
          phone: existingCustomer.phone,
          firstName: existingCustomer.firstName,
          lastName: existingCustomer.lastName,
          email: existingCustomer.email,
        })
      )
    }

    // Create new customer
    const createResult = await customerRepo.create(
      {
        phone,
        firstName: firstName || null,
        lastName: lastName || null,
        email: email || null,
        dateOfBirth: null,
        gender: null,
        profilePictureUrl: null,
        totalOrders: 0,
        totalSpent: 0,
        preferredLanguage: null,
        status: 'active',
        customerSource: 'pos',
        metadata: {},
        lastVisitAt: null,
        restaurantId: tenantContext.restaurantId,
      },
      authContext.userId,
      tenantContext.organizationId
    )

    if (!createResult.success) {
      return NextResponse.json(
        errorResponse(createResult.error || 'Failed to create customer', 'CUSTOMER_CREATE_ERROR'),
        { status: 500 }
      )
    }

    const customer = createResult.data!

    return NextResponse.json(
      successResponse({
        id: customer.id,
        phone: customer.phone,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      }),
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
