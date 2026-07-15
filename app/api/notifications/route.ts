/**
 * GET /api/notifications?limit=10
 * Get notifications for current user
 * 
 * ERRORS:
 * - 400: Missing auth context or invalid parameters
 * - 409: Firestore composite index not ready (index creation in progress)
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { NotificationRepository } from '@/backend/src/repositories'
import { getMockAuthContext } from '@/api/middleware/auth'
import { successResponse, errorResponse } from '@/api/utils/responses'

const notificationRepository = new NotificationRepository()

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get('limit') || '10'),
      100
    )

    // TODO: Extract real auth context from JWT token
    const authContext = getMockAuthContext()

    // Validate auth context
    if (!authContext || !authContext.userId || !authContext.organizationId) {
      console.warn('[NotificationRepository.GET] Missing auth context')
      return NextResponse.json(
        errorResponse('Auth context required', 'AUTH_REQUIRED'),
        { status: 400 }
      )
    }

    // Fetch notifications for current user using Firestore
    let notifications: any[] = []
    try {
      notifications = await notificationRepository.findByUser(
        authContext.userId,
        authContext.organizationId,
        {
          limit,
        }
      )
    } catch (error: any) {
      // Handle Firestore index errors - index may be building
      const errorMsg = error.message || ''
      const errorCode = error.code || ''
      
      if (
        errorCode === 'FAILED_PRECONDITION' ||
        errorMsg.includes('FAILED_PRECONDITION') ||
        errorMsg.includes('composite index')
      ) {
        console.warn(
          '[NotificationRepository.GET] Composite index building',
          {
            error: errorMsg,
            userId: authContext.userId,
            organizationId: authContext.organizationId,
          }
        )
        return NextResponse.json(
          errorResponse(
            'Notification indexes building. Please try again in a moment.',
            'FIRESTORE_INDEX_BUILDING'
          ),
          { status: 409 }
        )
      }

      // Other Firestore errors
      if (errorCode === 'PERMISSION_DENIED') {
        console.error('[NotificationRepository.GET] Permission denied', { error: errorMsg })
        return NextResponse.json(
          errorResponse('Permission denied', 'PERMISSION_DENIED'),
          { status: 403 }
        )
      }

      // Unexpected errors - log but don't expose details
      console.error('[NotificationRepository.GET] Unexpected error', {
        error: errorMsg,
        code: errorCode,
        userId: authContext.userId,
      })

      throw error
    }

    // Format for response
    const formattedNotifications = notifications.map((notif) => ({
      id: notif.id,
      type: notif.notificationType,
      title: notif.title,
      body: notif.message,
      time: getTimeAgo(notif.createdAt),
      read: notif.isRead,
      createdAt: notif.createdAt,
    }))

    return NextResponse.json(
      successResponse({ notifications: formattedNotifications })
    )
  } catch (error: any) {
    console.error('[NotificationRepository.GET] Error fetching notifications:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
    })

    return NextResponse.json(
      errorResponse('Failed to fetch notifications', 'NOTIFICATIONS_ERROR'),
      { status: 500 }
    )
  }
}

/**
 * Helper to format time ago
 */
function getTimeAgo(date: Date | any): string {
  const dateObj = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return dateObj.toLocaleDateString()
}

