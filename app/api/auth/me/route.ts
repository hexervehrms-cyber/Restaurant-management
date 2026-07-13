/**
 * GET /api/auth/me
 * Get current logged-in user context
 * Uses Firestore repositories for data retrieval
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { UserRepository, OrganizationRepository } from '@/repositories'

export async function GET(request: NextRequest) {
  try {
    const userRepo = new UserRepository()
    const orgRepo = new OrganizationRepository()

    // TODO: Extract auth context from JWT token in Authorization header
    // For now, use mock context
    const authContext = getMockAuthContext()

    // Fetch user from Firestore
    const user = await userRepo.findById(authContext.userId)
    if (!user) {
      return NextResponse.json(
        errorResponse('User not found', 'USER_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Fetch organization from Firestore
    const org = await orgRepo.findById(user.organizationId)
    if (!org) {
      return NextResponse.json(
        errorResponse('Organization not found', 'ORG_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Build response
    const userContext = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      organizationId: user.organizationId,
      restaurantId: user.restaurantId || 'demo-restaurant',
      branchId: user.branchId || 'demo-branch',
      restaurantName: org.displayName,
      branchName: org.name,
    }

    return NextResponse.json(successResponse(userContext))
  } catch (error: any) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      errorResponse(error.message || 'Internal server error', 'AUTH_ERROR'),
      { status: 500 }
    )
  }
}
