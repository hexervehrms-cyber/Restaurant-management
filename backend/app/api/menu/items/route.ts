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

const prisma = new PrismaClient()

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

    // Query menu items by restaurantId (not branchId)
    const where: any = {
      restaurantId: branch.restaurantId,
      organizationId: tenantContext.organizationId,
      isAvailable: true,
      deletedAt: null,
    }

    if (category !== 'all') {
      where.categoryId = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        variants: true,
        modifierGroups: true,
      },
      orderBy: { displayOrder: 'asc' },
      take: 100,
    })

    const formatted = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      category: item.category?.name || 'Uncategorized',
      price: Number(item.basePrice),
      image: item.imageUrl || '',
      isVeg: item.isVegetarian,
      isAvailable: item.isAvailable,
      prepTime: item.preparationTimeMinutes || 15,
      gst: 5,
      rating: 4.5,
      tags: item.isSpicy ? ['spicy'] : [],
      variants: item.variants?.map((v) => ({
        id: v.id,
        name: v.name,
        price: Number(v.priceModifier || 0),
      })) || [],
      addons: item.modifierGroups?.map((m) => ({
        id: m.id,
        name: m.name,
        price: 0,
      })) || [],
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
