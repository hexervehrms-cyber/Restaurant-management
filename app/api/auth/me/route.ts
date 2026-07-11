/**
 * GET /api/auth/me
 * Get current logged-in user context
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext, extractAuthContext } from '@/api/middleware/auth'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { getCurrentUserContext } from '@/api/services/auth.service'

export async function GET(request: NextRequest) {
  try {
    // TODO: Extract auth context from JWT token in Authorization header
    // For now, use mock context
    const authContext = getMockAuthContext()

    // TODO: Fetch real user context from database using authContext.userId
    // For development, return mock data with TODO comments

    const userContext = {
      id: authContext.userId,
      name: 'Rajesh Sharma', // TODO: Fetch from users table
      role: 'Owner', // TODO: Fetch from users table
      organizationId: authContext.organizationId,
      restaurantId: authContext.restaurantId,
      branchId: authContext.branchId,
      restaurantName: 'Spice Garden', // TODO: Fetch from restaurants table
      branchName: 'Mumbai Central', // TODO: Fetch from branches table
    }

    return NextResponse.json(successResponse(userContext))
  } catch (error: any) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      errorResponse(error.message, 'AUTH_ERROR'),
      { status: 400 }
    )
  }
}
