/**
 * GET /api/menu/items?branchId=<id>&category=all&search=""
 * Get menu items for a restaurant (via branch)
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

// Import repositories lazily to avoid circular dependencies
// Frontend fetches data from backend API, then formats it
const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')
    const category = request.nextUrl.searchParams.get('category') || 'all'
    const search = request.nextUrl.searchParams.get('search') || ''

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    // Relay request to backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'
    const queryParams = new URLSearchParams({
      branchId,
      category,
      search,
    })

    const response = await fetch(`${backendUrl}/api/menu/items?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching menu items:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'MENU_ERROR'),
      { status: 500 }
    )
  }
}
