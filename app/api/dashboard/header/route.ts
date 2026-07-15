/**
 * GET /api/dashboard/header?branchId=<id>
 * Get dashboard header information including user, restaurant, and business status
 * Returns: userName, userGreeting, restaurantName, branchName, isOpen, closingTime, currentTime
 * 
 * FLOW: API Route → Repositories → Firestore
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import type { DashboardHeader } from '@/types/dashboard'

// Import repositories from backend
import { UserRepository } from '@/backend/src/repositories/UserRepository'
import { RestaurantRepository } from '@/backend/src/repositories/RestaurantRepository'
import { RestaurantSettingsRepository } from '@/backend/src/repositories/RestaurantSettingsRepository'
import { BranchRepository } from '@/backend/src/repositories/BranchRepository'

export async function GET(request: NextRequest) {
  try {
    // Repositories instantiate and access Firestore
    // Firebase is initialized globally via instrumentation hook on server startup
    const userRepo = new UserRepository()
    const restaurantRepo = new RestaurantRepository()
    const settingsRepo = new RestaurantSettingsRepository()
    const branchRepo = new BranchRepository()

    // Extract query parameters
    const branchId = request.nextUrl.searchParams.get('branchId')

    // Validate input
    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    // TODO: Extract real auth context from JWT token
    const authContext = getMockAuthContext()

    // Extract tenant context
    const tenantContext = extractTenantContext(authContext)

    // ─── Load User Data from Firestore ────────────────────
    let user = await userRepo.findById(authContext.userId)
    
    // Fallback for development: If user doesn't exist, use mock data
    // In production, this should throw an error
    if (!user) {
      console.warn(`User ${authContext.userId} not found in Firestore, using fallback`)
      // Create a minimal user object for development
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

    const userName = `${user!.firstName} ${user!.lastName}`.trim() || 'User'

    // ─── Calculate User Greeting ──────────────────────────
    const now = new Date()
    const hour = now.getHours()
    let userGreeting = 'Good morning'
    if (hour >= 12 && hour < 17) {
      userGreeting = 'Good afternoon'
    } else if (hour >= 17) {
      userGreeting = 'Good evening'
    }

    // ─── Load Restaurant from Firestore ───────────────────
    const restaurantId = authContext.restaurantId
    const restaurant = await restaurantRepo.findByIdAndOrganization(
      restaurantId,
      tenantContext.organizationId
    )

    if (!restaurant) {
      throw new ValidationError('Restaurant not found')
    }

    const restaurantName = restaurant.name || 'Restaurant'

    // ─── Load Branch from Firestore ───────────────────────
    const branch = await branchRepo.findById(branchId)
    const branchName = branch?.name || 'Main Branch'

    // ─── Load Settings from Firestore ─────────────────────
    const settings = await settingsRepo.findByRestaurantAndOrganization(
      restaurantId,
      tenantContext.organizationId
    )

    if (!settings) {
      throw new ValidationError('Restaurant settings not found')
    }

    // ─── Determine if Restaurant is Open ───────────────────
    let isOpen = false
    let closingTime = null

    // Parse operating hours if available
    if (settings.operatingHours) {
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]
      const dayHours = settings.operatingHours[dayName] as any

      if (dayHours && dayHours.open && dayHours.close) {
        const openTime = parseInt(dayHours.open.split(':')[0])
        const closeTime = parseInt(dayHours.close.split(':')[0])
        isOpen = hour >= openTime && hour < closeTime
        closingTime = dayHours.close
      } else {
        // Fallback to default hours
        isOpen = hour >= 6 && hour < 23
        closingTime = '11:00 PM'
      }
    } else {
      // No settings configured, use default: 6am - 11pm
      isOpen = hour >= 6 && hour < 23
      closingTime = '11:00 PM'
    }

    // ─── Format Current Time ──────────────────────────────
    const currentTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    const timezone = settings.timezone || 'Asia/Kolkata'

    // ─── Build Response ───────────────────────────────────
    const headerData: DashboardHeader = {
      userName,
      userGreeting,
      restaurantName,
      branchName,
      isOpen,
      closingTime,
      currentTime,
      timezone,
    }

    return NextResponse.json(successResponse(headerData))
  } catch (error: any) {
    console.error('Error fetching dashboard header:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch dashboard header', 'DASHBOARD_HEADER_ERROR'),
      { status: 500 }
    )
  }
}
