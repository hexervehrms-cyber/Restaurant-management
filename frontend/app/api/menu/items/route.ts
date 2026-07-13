/**
 * GET /api/menu/items?branchId=<id>&category=all&search=""
 * Get menu items for a restaurant (via branch)
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  MenuCategoryRepository,
  MenuItemRepository,
  MenuVariantRepository,
} from '@/backend/src/repositories'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

const prisma = new PrismaClient()
const categoryRepo = new MenuCategoryRepository()
const itemRepo = new MenuItemRepository()
const variantRepo = new MenuVariantRepository()

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')
    const category = request.nextUrl.searchParams.get('category') || 'all'
    const search = request.nextUrl.searchParams.get('search') || ''

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Get the branch to resolve restaurantId
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { restaurantId: true },
    })

    if (!branch) {
      throw new ValidationError('Branch not found')
    }

    // Query menu items by restaurantId using repository
    let items = await itemRepo.findAvailableByRestaurant(
      branch.restaurantId,
      tenantContext.organizationId
    )

    // Filter by category if specified
    if (category !== 'all') {
      items = items.filter((item) => item.categoryId === category)
    }

    // Filter by search term if specified
    if (search) {
      const searchLower = search.toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
      )
    }

    // Limit to 100 items
    items = items.slice(0, 100)

    // Fetch category names and variants for formatted response
    const allCategories = await categoryRepo.findByRestaurant(
      branch.restaurantId,
      tenantContext.organizationId
    )
    const categoryMap = new Map(allCategories.map((c) => [c.id, c.name]))

    // Batch fetch all variants for these items
    const itemIds = items.map((item) => item.id)
    const allVariants = await variantRepo.findMany({
      filters: [
        { field: 'menuItemId', operator: 'in', value: itemIds },
        { field: 'organizationId', operator: '==', value: tenantContext.organizationId },
        { field: 'isDeleted', operator: '==', value: false },
      ],
    })
    const itemVariantsMap = new Map<string, any[]>()
    for (const variant of allVariants) {
      if (!itemVariantsMap.has(variant.menuItemId)) {
        itemVariantsMap.set(variant.menuItemId, [])
      }
      itemVariantsMap.get(variant.menuItemId)!.push(variant)
    }

    const formatted = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      category: categoryMap.get(item.categoryId) || 'Uncategorized',
      price: item.basePrice,
      image: item.imageUrl || '',
      isVeg: item.isVegetarian,
      isAvailable: item.isAvailable,
      prepTime: item.preparationTimeMinutes || 15,
      gst: 5,
      rating: 4.5,
      tags: item.isSpicy ? ['spicy'] : [],
      variants: (itemVariantsMap.get(item.id) || []).map((v) => ({
        id: v.id,
        name: v.name,
        price: v.priceModifier || 0,
      })),
      addons: [],
    }))

    return NextResponse.json(successResponse({
      data: formatted,
      meta: {
        total: formatted.length,
      },
    }))
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
