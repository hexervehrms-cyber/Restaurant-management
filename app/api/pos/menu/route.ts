/**
 * GET /api/pos/menu?branchId=<id>
 * Get menu items with full data for POS Terminal
 * Returns: categories, menu items with variants, modifiers, preparation time, availability, prices
 * 
 * This route relays requests to the backend API which has access to Firestore repositories
 */

import { NextRequest, NextResponse } from 'next/server'
import { ValidationError } from '@/api/utils/errors'
import { errorResponse } from '@/api/utils/responses'

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    // Relay request to backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'
    const queryParams = new URLSearchParams({
      branchId,
    })

    const response = await fetch(`${backendUrl}/api/pos/menu?${queryParams}`, {
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
    console.error('Error fetching POS menu:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'POS_MENU_ERROR'),
      { status: 500 }
    )
  }
}
