/**
 * GET /api/pos/menu?branchId=<id>
 * Get menu items with full data for POS Terminal
 * Returns: categories, menu items with variants, modifiers, preparation time, availability, prices
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 * TODO: Implement with Firestore repositories
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // TODO: Replace with Firestore menu repositories
    // Mock response: return empty menu
    const formattedCategories: any[] = []
    const formattedItems: any[] = []

    return NextResponse.json(successResponse({
      categories: formattedCategories,
      items: formattedItems,
      meta: {
        totalItems: formattedItems.length,
        totalCategories: formattedCategories.length,
      },
    }))
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
