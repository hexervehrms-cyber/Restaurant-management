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
    let user = await userRepo.findById(authContext.userId)
    
    // Fallback for development: If user doesn't exist, use mock data
    if (!user) {
      console.warn(`User ${authContext.userId} not found in Firestore, using fallback`)
      user = {
        id: authContext.userId,
        email: 'demo@restaurant.local',
        firstName: 'Demo',
        lastName: 'User',
        role: 'restaurant_owner',
        status: 'active',
        organizationId: authContext.organizationId,
        restaurantId: authContext.restaurantId,
        branchId: authContext.branchId,
        emailVerified: true,
        loginAttempts: 0,
        createdBy: 'system',
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        isDeleted: false,
      } as any
    }

    // Fetch organization from Firestore
    let org = await orgRepo.findById(user.organizationId)
    
    // Fallback for development
    if (!org) {
      console.warn(`Organization ${user.organizationId} not found in Firestore, using fallback`)
      org = {
        id: user.organizationId,
        name: 'Demo Org',
        displayName: 'Demo Restaurant Group',
        tier: 'pro',
        maxRestaurants: 10,
        maxUsers: 50,
        maxBranches: 5,
        status: 'active',
        createdBy: 'system',
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        isDeleted: false,
      } as any
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
