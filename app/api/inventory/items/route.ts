/**
 * GET /api/inventory/items?branchId=<id>&search=""&lowStock=false
 * Get inventory items for a branch
 * 
 * Migrated to use InventoryService and Firestore repositories
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

export async function GET(request: NextRequest) {
  try {
    // Import service only when route is called, not at module load time
    const { InventoryService } = await import('@/repositories')
    const inventoryService = new InventoryService()

    const branchId = request.nextUrl.searchParams.get('branchId')
    const search = request.nextUrl.searchParams.get('search') || ''
    const lowStock = request.nextUrl.searchParams.get('lowStock') === 'true'

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Fetch inventory items using InventoryService
    let items = await inventoryService.getInventoryItemsByBranch(
      branchId,
      tenantContext.restaurantId,
      tenantContext.organizationId
    )

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      items = items.filter(
        (item) =>
          item.itemName.toLowerCase().includes(searchLower) ||
          item.itemCode?.toLowerCase().includes(searchLower)
      )
    }

    // Format response matching existing contract
    const formatted = items
      .map((item) => {
        const quantity = typeof item.quantityInStock === 'number'
          ? item.quantityInStock
          : 0
        const reorder = typeof item.reorderLevel === 'number'
          ? item.reorderLevel
          : 0
        
        const status = quantity < reorder
          ? 'low'
          : quantity < (reorder * 0.5)
            ? 'critical'
            : 'ok'

        return {
          id: item.id,
          name: item.itemName,
          sku: item.itemCode || '',
          category: item.category || '',
          quantity,
          unit: item.unitOfMeasure || '',
          reorderLevel: reorder,
          price: typeof item.costPerUnit === 'number' ? item.costPerUnit : 0,
          supplier: item.supplierId || '',
          lastRestockDate: item.lastCountedAt
            ? new Date(item.lastCountedAt as any).toISOString().split('T')[0]
            : '',
          expiryDate: '',
          status,
        }
      })
      .filter((item) => !lowStock || item.status !== 'ok')

    const criticalCount = formatted.filter((i) => i.status === 'critical').length
    const lowStockCount = formatted.filter((i) => i.status === 'low').length

    return NextResponse.json(
      successResponse({
        data: formatted,
        meta: {
          total: formatted.length,
          lowStockCount,
          criticalCount,
        },
      })
    )
  } catch (error: any) {
    console.error('Error fetching inventory items:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'INVENTORY_ERROR'),
      { status: 500 }
    )
  }
}
