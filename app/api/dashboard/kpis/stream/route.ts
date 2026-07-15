/**
 * GET /api/dashboard/kpis/stream
 * 
 * Server-Sent Events (SSE) endpoint for real-time dashboard KPI updates.
 * 
 * FLOW:
 * Client (SSE) → This Route
 *              → RealtimeDashboardKPIService.subscribe()
 *                 → Firestore Listeners (Orders, Tables, Customers, Feedback)
 *                    → Auto-calculate KPIs on any change
 *                       → SSE callback sends update to client
 * 
 * The client connects once and receives updates as they happen.
 * Much more efficient than polling every 60 seconds.
 * 
 * Query Parameters:
 * - branchId (required): Restaurant branch identifier
 * 
 * Response: Server-Sent Events stream
 * Format:
 * ```
 * data: {"revenue":...,"orders":...,...}
 * 
 * data: {"revenue":...,"orders":...,...}
 * ...
 * ```
 * 
 * Connection Management:
 * - Client closes: Listener unsubscribed automatically
 * - Error: Stream closes, client reconnects via hook with exponential backoff
 * - Timeout: Server keeps-alive with ": keep-alive" comments every 30s
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { ValidationError } from '@/api/utils/errors'
import { getRealtimeDashboardKPIService } from '@/api/services/realtime-dashboard-kpi.service'
import type { DashboardKPIResponse } from '@/types/dashboard'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const branchId = request.nextUrl.searchParams.get('branchId')

    // Validate input
    if (!branchId) {
      return new NextResponse('branchId query parameter is required', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // TODO: Extract real auth context from JWT token
    const authContext = getMockAuthContext()

    // Extract tenant context
    const tenantContext = extractTenantContext(authContext)

    // Get realtime service
    const realtimeService = getRealtimeDashboardKPIService()

    // Create custom encoder for streaming
    const encoder = new TextEncoder()

    // Track if stream is closed
    let streamClosed = false

    // Create readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Subscribe to real-time KPI updates
          const unsubscribe = await realtimeService.subscribe(
            branchId,
            tenantContext.organizationId,
            (kpis: DashboardKPIResponse) => {
              if (streamClosed) return

              try {
                // Format as SSE
                const message = `data: ${JSON.stringify(kpis)}\n\n`
                controller.enqueue(encoder.encode(message))
              } catch (error) {
                console.error('Error encoding SSE message:', error)
                controller.error(error)
              }
            },
            (error: Error) => {
              console.error('KPI subscription error:', error)
              if (!streamClosed) {
                try {
                  const errorMessage = `data: ${JSON.stringify({ error: error.message })}\n\n`
                  controller.enqueue(encoder.encode(errorMessage))
                } catch (e) {
                  console.error('Error sending error message:', e)
                }
              }
            }
          )

          // Keep-alive: Send comment every 30 seconds to keep connection alive
          const keepAliveInterval = setInterval(() => {
            if (!streamClosed) {
              try {
                controller.enqueue(encoder.encode(': keep-alive\n\n'))
              } catch (error) {
                clearInterval(keepAliveInterval)
              }
            }
          }, 30000)

          // Handle client disconnect
          // When client closes connection, this request will abort
          request.signal.addEventListener('abort', () => {
            streamClosed = true
            clearInterval(keepAliveInterval)
            unsubscribe()
            controller.close()
            console.log(`SSE stream closed for branch ${branchId}`)
          })
        } catch (error) {
          console.error('Error in SSE stream start:', error)
          controller.error(error)
        }
      },
    })

    // Return SSE response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable Nginx buffering if behind proxy
      },
    })
  } catch (error) {
    // Handle known errors
    if (error instanceof ValidationError) {
      return new NextResponse(error.message, {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // Log and return generic error
    console.error('Error in GET /api/dashboard/kpis/stream:', error)
    return new NextResponse('Failed to establish real-time KPI stream', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
