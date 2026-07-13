/**
 * Tables Service
 * Handles table-related queries - Firestore-backed
 */

import { TenantContext } from '@/api/middleware/tenant'
import { RestaurantTableRepository } from '@/src/repositories'

const tableRepo = new RestaurantTableRepository()

export interface TableInfo {
  id: string
  tableNumber: string
  capacity: number
  section: string | null
  status: string
  occupiedSince: Date | null
  guestCount: number | null
  waiterName: string | null
  x: number | null
  y: number | null
}

/**
 * Get all tables for a branch
 */
export const getTablesByBranch = async (
  branchId: string,
  tenantContext: TenantContext
): Promise<TableInfo[]> => {
  try {
    const tables = await prisma.restaurantTable.findMany({
      where: {
        organizationId: tenantContext.organizationId,
        branchId: branchId,
        deletedAt: null,
      },
      include: {
        reservations: {
          where: {
            status: {
              in: ['confirmed', 'checked_in'],
            },
            deletedAt: null,
          },
        },
        orders: {
          where: {
            status: {
              in: ['pending', 'confirmed', 'preparing', 'ready'],
            },
            deletedAt: null,
          },
          include: {
            createdBy: true,
          },
        },
      },
      orderBy: {
        tableNumber: 'asc',
      },
    })

    return tables.map((table) => {
      const activeOrder = table.orders[0]

      return {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        section: table.section,
        status: table.status,
        occupiedSince: activeOrder?.createdAt ?? null,
        guestCount: activeOrder ? undefined : null, // TODO: Get from reservation or order
        waiterName: activeOrder?.createdBy?.firstName ?? null,
        x: table.xPosition ? Number(table.xPosition) : null,
        y: table.yPosition ? Number(table.yPosition) : null,
      }
    })
  } catch (error) {
    console.error('Error fetching tables:', error)
    throw error
  }
}

/**
 * Get table counts for dashboard
 */
export const getTableCounts = async (
  branchId: string,
  tenantContext: TenantContext
) => {
  try {
    // Use RestaurantTableRepository (Firestore)
    const occupied = await tableRepo.countOccupied(branchId, tenantContext.organizationId)
    const available = await tableRepo.countAvailable(branchId, tenantContext.organizationId)
    const maintenance = await tableRepo.countByStatus(branchId, tenantContext.organizationId, 'maintenance')

    return {
      occupied,
      available,
      maintenance,
      total: occupied + available + maintenance,
    }
  } catch (error) {
    console.error('Error fetching table counts:', error)
    throw error
  }
}
