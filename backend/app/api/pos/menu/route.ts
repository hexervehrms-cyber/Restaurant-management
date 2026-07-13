/**
 * GET /api/pos/menu?branchId=<id>
 * Get menu items with full data for POS Terminal
 * Returns: categories, menu items with variants, modifiers, preparation time, availability, prices
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  MenuCategoryRepository,
  MenuItemRepository,
  MenuVariantRepository,
  ModifierGroupRepository,
  ModifierRepository,
  MenuItemModifierGroupRepository,
} from '@/src/repositories'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

const prisma = new PrismaClient()
const categoryRepo = new MenuCategoryRepository()
const itemRepo = new MenuItemRepository()
const variantRepo = new MenuVariantRepository()
const groupRepo = new ModifierGroupRepository()
const modifierRepo = new ModifierRepository()
const itemModifierGroupRepo = new MenuItemModifierGroupRepository()

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')

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

    // Fetch all categories for this restaurant using repository
    const categories = await categoryRepo.findByRestaurant(
      branch.restaurantId,
      tenantContext.organizationId
    )

    // Fetch all available menu items for this restaurant using repository
    const items = await itemRepo.findAvailableByRestaurant(
      branch.restaurantId,
      tenantContext.organizationId
    )

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

    // Fetch all modifier groups for this restaurant
    const modifierGroups = await groupRepo.findByRestaurant(
      branch.restaurantId,
      tenantContext.organizationId
    )

    // Batch fetch all modifiers for these groups
    const groupIds = modifierGroups.map((g) => g.id)
    const allModifiers = await modifierRepo.findMany({
      filters: [
        { field: 'modifierGroupId', operator: 'in', value: groupIds },
        { field: 'organizationId', operator: '==', value: tenantContext.organizationId },
        { field: 'isDeleted', operator: '==', value: false },
      ],
    })
    const groupModifiersMap = new Map<string, any[]>()
    for (const modifier of allModifiers) {
      if (!groupModifiersMap.has(modifier.modifierGroupId)) {
        groupModifiersMap.set(modifier.modifierGroupId, [])
      }
      groupModifiersMap.get(modifier.modifierGroupId)!.push(modifier)
    }

    // Fetch all MenuItem-ModifierGroup relationships for these items
    const itemModifierGroupRelations = await itemModifierGroupRepo.findMany({
      filters: [
        { field: 'menuItemId', operator: 'in', value: itemIds },
        { field: 'organizationId', operator: '==', value: tenantContext.organizationId },
        { field: 'isDeleted', operator: '==', value: false },
      ],
    })
    
    // Build map of item ID to associated modifier group IDs
    const itemModifierGroupMap = new Map<string, string[]>()
    for (const relation of itemModifierGroupRelations) {
      if (!itemModifierGroupMap.has(relation.menuItemId)) {
        itemModifierGroupMap.set(relation.menuItemId, [])
      }
      itemModifierGroupMap.get(relation.menuItemId)!.push(relation.modifierGroupId)
    }
    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      label: cat.name,
      icon: '🍽️',
    }))

    const formattedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      category: item.categoryId || '',
      price: item.basePrice,
      image: item.imageUrl || '',
      isVeg: item.isVegetarian,
      isAvailable: item.isAvailable,
      gst: 5,
      rating: 4.5,
      prepTime: item.preparationTimeMinutes || 15,
      variants: (itemVariantsMap.get(item.id) || []).map((v) => ({
        id: v.id,
        name: v.name,
        price: v.priceModifier || 0,
      })),
      modifiers: modifierGroups
        .filter((g) => {
          // Filter groups associated with this item via MenuItemModifierGroup relationship
          const groupIds = itemModifierGroupMap.get(item.id) || []
          return groupIds.includes(g.id)
        })
        .map((mg) => ({
          id: mg.id,
          name: mg.name,
          isMultiSelect: mg.maxSelections > 1,
          options: (groupModifiersMap.get(mg.id) || []).map((m) => ({
            id: m.id,
            name: m.name,
            price: m.priceModifier || 0,
          })),
        })),
      tags: item.isSpicy ? ['spicy'] : [],
    }))

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
