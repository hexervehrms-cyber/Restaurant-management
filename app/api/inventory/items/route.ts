/**
 * GET /api/inventory/items?branchId=<id>&search=""&lowStock=false
 * Get inventory items for a branch
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
    const search = request.nextUrl.searchParams.get('search') || ''
    const lowStock = request.nextUrl.searchParams.get('lowStock') === 'true'

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    const where: any = {
      branchId,
      restaurantId: tenantContext.restaurantId,
      organizationId: tenantContext.organizationId,
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 100,
    })

    const formatted = items
      .map((item) => {
        const status = item.currentQuantity < (item.reorderLevel || 0)
          ? 'low'
          : item.currentQuantity < ((item.reorderLevel || 0) * 0.5)
            ? 'critical'
            : 'ok'

        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category,
          quantity: item.currentQuantity,
          unit: item.unit,
          reorderLevel: item.reorderLevel || 0,
          price: item.costPrice || 0,
          supplier: item.supplier || '',
          lastRestockDate: item.lastRestockDate?.toISOString().split('T')[0] || '',
          expiryDate: item.expiryDate?.toISOString().split('T')[0] || '',
          status,
        }
      })
      .filter((item) => !lowStock || item.status !== 'ok')

    const criticalCount = formatted.filter((i) => i.status === 'critical').length
    const lowStockCount = formatted.filter((i) => i.status === 'low').length

    return NextResponse.json(successResponse({
      data: formatted,
      meta: {
        total: formatted.length,
        lowStockCount,
        criticalCount,
      },
    }))
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
