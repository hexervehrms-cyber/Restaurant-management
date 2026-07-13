/**
 * GET /api/notifications?limit=10
 * Get notifications for current user
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

    // Fetch notifications for current user using Firestore
    const notifications = await notificationRepository.findByUser(
      authContext.userId,
      authContext.organizationId,
      {
        limit,
      }
    )

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

    return NextResponse.json(successResponse({ notifications: formattedNotifications }))
  } catch (error: any) {
    console.error('Error fetching notifications:', error)

    return NextResponse.json(
      errorResponse(error.message, 'NOTIFICATIONS_ERROR'),
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

