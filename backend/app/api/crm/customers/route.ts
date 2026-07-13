/**
 * GET /api/crm/customers?branchId=<id>&tier=all&search=""
 * Get customers for a branch
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
    const branchId = request.nextUrl.searchParams.get('branchId')
    const search = request.nextUrl.searchParams.get('search') || ''

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Initialize repository
    const customerRepo = new CustomerRepository()

    // Build query options
    let customers = await customerRepo.findByRestaurant(
      tenantContext.organizationId,
      tenantContext.restaurantId,
      {
        orders: [{ field: 'createdAt', direction: 'desc' }],
        limit: 100,
      }
    )

    // Apply search filter if provided
    if (search) {
      customers = customers.filter((customer) => {
        const searchLower = search.toLowerCase()
        const nameMatch =
          `${customer.firstName || ''} ${customer.lastName || ''}`
            .toLowerCase()
            .includes(searchLower) ||
          `${customer.lastName || ''} ${customer.firstName || ''}`
            .toLowerCase()
            .includes(searchLower)
        const phoneMatch = customer.phone?.includes(search)
        const emailMatch = customer.email?.toLowerCase().includes(searchLower)

        return nameMatch || phoneMatch || emailMatch
      })
    }

    // Calculate tier based on totalSpent
    const getTier = (totalSpent: number | string): 'gold' | 'silver' | 'bronze' => {
      const spent = typeof totalSpent === 'string' ? parseFloat(totalSpent) : totalSpent
      if (spent >= 10000) return 'gold'
      if (spent >= 5000) return 'silver'
      return 'bronze'
    }

    // Format response
    const formatted = customers.map((customer) => ({
      id: customer.id,
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.phone || 'N/A',
      phone: customer.phone || '',
      email: customer.email || '',
      totalSpent: typeof customer.totalSpent === 'number' ? customer.totalSpent : 0,
      visits: customer.visitCount ?? customer.totalOrders ?? 0,
      lastVisit: customer.lastVisitAt
        ? new Date(customer.lastVisitAt as any).toISOString()
        : null,
      tier: getTier(customer.totalSpent),
      loyaltyPoints: customer.loyaltyPoints?.[0]?.pointsBalance || 0,
      preferences: customer.preferences || [],
      notes: customer.notes || '',
    }))

    // Calculate tier breakdown
    const tiers = {
      gold: formatted.filter((c) => c.tier === 'gold').length,
      silver: formatted.filter((c) => c.tier === 'silver').length,
      bronze: formatted.filter((c) => c.tier === 'bronze').length,
    }

    return NextResponse.json(
      successResponse({
        data: formatted,
        meta: {
          total: formatted.length,
          tiers,
        },
      })
    )
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
