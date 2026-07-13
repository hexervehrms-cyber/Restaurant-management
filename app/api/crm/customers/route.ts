/**
 * GET /api/crm/customers?branchId=<id>&tier=all&search=""
 * Get customers for a branch
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
    const branchId = request.nextUrl.searchParams.get('branchId')
    const search = request.nextUrl.searchParams.get('search') || ''

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Fetch customers using repository
    let customers = await customerRepo.findByRestaurant(tenantContext.restaurantId)

    // Filter by search if provided
    if (search) {
      customers = customers.filter((c) => {
        const searchLower = search.toLowerCase()
        return (
          c.name?.toLowerCase().includes(searchLower) ||
          c.phone?.includes(search) ||
          c.email?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Limit to 100 results
    customers = customers.slice(0, 100)

    const formatted = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      totalSpent: parseFloat(customer.totalSpent?.toString() || '0'),
      visits: customer.visitCount || 0, // Note: visitCount may not be on CustomerDocument
      lastVisit: customer.lastVisitAt ? new Date(customer.lastVisitAt).toISOString() : null,
      tier: customer.tier || 'silver',
      loyaltyPoints: 0,
      preferences: [],
      notes: customer.notes || '',
    } as any))

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
