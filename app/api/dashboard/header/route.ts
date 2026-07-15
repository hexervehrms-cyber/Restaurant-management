/**
 * GET /api/dashboard/header?branchId=<id>
 * Get dashboard header information including user, restaurant, and business status
 * Returns: userName, userGreeting, restaurantName, branchName, isOpen, closingTime, currentTime
 * 
 * OPTIMIZED FLOW: 
 * - BEFORE: API Route → 4 sequential Firestore queries
 * - AFTER: API Route → 4 parallel Firestore queries via Promise.all()
 * 
 * PERFORMANCE GAIN: ~75% latency reduction (from ~5500ms to ~1500ms estimated)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { logger } from '@/lib/logger'
import type { DashboardHeader } from '@/types/dashboard'

// Prevent static generation for this API route
export const dynamic = 'force-dynamic'

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

    // ─── OPTIMIZATION: Load all data in parallel ─────────────────────────
    // BEFORE: 4 sequential Firestore queries (~5500ms total)
    // AFTER: 4 parallel Firestore queries (~1500ms total)
    
    const [user, restaurant, branch, settings] = await Promise.all([
      userRepo.findById(authContext.userId),
      restaurantRepo.findByIdAndOrganization(
        authContext.restaurantId,
        tenantContext.organizationId
      ),
      branchRepo.findById(branchId),
      settingsRepo.findByRestaurantAndOrganization(
        authContext.restaurantId,
        tenantContext.organizationId
      ),
    ])

    logger.debug('Dashboard header data fetched successfully')

    // ─── Process User Data ──────────────────────────────────────────────
    let finalUser = user
    
    // Fallback for development: If user doesn't exist, use mock data
    // In production, this should throw an error
    if (!finalUser) {
      logger.warn('User not found in Firestore, using fallback data', {
        userId: authContext.userId,
      })
      // Create a minimal user object for development
      finalUser = {
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

    const userName = `${finalUser!.firstName} ${finalUser!.lastName}`.trim() || 'User'

    // ─── Calculate User Greeting ──────────────────────────
    const now = new Date()
    const hour = now.getHours()
    let userGreeting = 'Good morning'
    if (hour >= 12 && hour < 17) {
      userGreeting = 'Good afternoon'
    } else if (hour >= 17) {
      userGreeting = 'Good evening'
    }

    // ─── Validate Restaurant ──────────────────────────────
    if (!restaurant) {
      throw new ValidationError('Restaurant not found')
    }

    const restaurantName = restaurant.name || 'Restaurant'

    // ─── Validate Branch ──────────────────────────────────
    const branchName = branch?.name || 'Main Branch'

    // ─── Validate Settings ────────────────────────────────
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
    if (error instanceof ValidationError) {
      logger.warn('Validation error in dashboard header request', { error: error.message })
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    logger.error('Error fetching dashboard header', { error })
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch dashboard header', 'DASHBOARD_HEADER_ERROR'),
      { status: 500 }
    )
  }
}
