/**
 * Restaurant Table Repository
 * Handles all restaurant table-related Firestore operations
 * Replaces Prisma RestaurantTable model operations with Firestore
 */

import { BaseRepository, IRepository } from '.'
import { COLLECTIONS } from '../config/collections'
import { QueryOptions, UpdateResult } from '../types/firestore'
import {
  RestaurantTableDocument,
  CreateRestaurantTablePayload,
  UpdateRestaurantTablePayload,
  TableOccupancyAnalytics,
} from '../types/firestore/table'

export type { RestaurantTableDocument, CreateRestaurantTablePayload, UpdateRestaurantTablePayload }

/**
 * Restaurant Table Repository
 * Extends BaseRepository with table-specific operations
 */
export class RestaurantTableRepository
  extends BaseRepository<RestaurantTableDocument>
  implements IRepository<RestaurantTableDocument> {
  constructor() {
    super(COLLECTIONS.restaurantTables)
  }

  /**
   * Find tables by branch
   * 
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @param options - Optional query options for ordering and pagination
   * @returns Array of table documents
   * 
   * @example
   *   const tables = await tableRepo.findByBranch(branchId, orgId)
   */
  async findByBranch(
    branchId: string,
    organizationId: string,
    options?: QueryOptions
  ): Promise<RestaurantTableDocument[]> {
    try {
      return await this.findMany({
        ...options,
        filters: [
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
          ...(options?.filters || []),
        ],
        orders: options?.orders || [{ field: 'tableNumber', direction: 'asc' }],
      })
    } catch (error) {
      console.error('Error finding tables by branch:', error)
      return []
    }
  }

  /**
   * Find tables by section
   * 
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @param section - Table section
   * @returns Array of table documents
   * 
   * @example
   *   const patioTables = await tableRepo.findBySection(branchId, orgId, 'Patio')
   */
  async findBySection(
    branchId: string,
    organizationId: string,
    section: string
  ): Promise<RestaurantTableDocument[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'section', operator: '==', value: section },
        ],
        orders: [{ field: 'tableNumber', direction: 'asc' }],
      })
    } catch (error) {
      console.error('Error finding tables by section:', error)
      return []
    }
  }

  /**
   * Find tables by table number (unique per branch)
   * 
   * @param tableNumber - Table number
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Table document or null
   * 
   * @example
   *   const table = await tableRepo.findByTableNumber('T-01', branchId, orgId)
   */
  async findByTableNumber(
    tableNumber: string,
    branchId: string,
    organizationId: string
  ): Promise<RestaurantTableDocument | null> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'tableNumber', operator: '==', value: tableNumber },
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        limit: 1,
      })

      return docs.length > 0 ? docs[0] : null
    } catch (error) {
      console.error('Error finding table by table number:', error)
      return null
    }
  }

  /**
   * Count tables by status
   * Used for occupancy tracking
   * 
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @param status - Table status
   * @returns Count of tables with given status
   * 
   * @example
   *   const occupiedCount = await tableRepo.countByStatus(branchId, orgId, 'occupied')
   */
  async countByStatus(
    branchId: string,
    organizationId: string,
    status: RestaurantTableDocument['status']
  ): Promise<number> {
    try {
      return await this.count({
        filters: [
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'status', operator: '==', value: status },
        ],
      })
    } catch (error) {
      console.error('Error counting tables by status:', error)
      return 0
    }
  }

  /**
   * Count occupied tables
   * Returns count of tables with status 'occupied'
   * 
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Count of occupied tables
   * 
   * @example
   *   const occupiedCount = await tableRepo.countOccupied(branchId, orgId)
   */
  async countOccupied(branchId: string, organizationId: string): Promise<number> {
    try {
      return await this.countByStatus(branchId, organizationId, 'occupied')
    } catch (error) {
      console.error('Error counting occupied tables:', error)
      return 0
    }
  }

  /**
   * Count available tables
   * Returns count of tables with status 'available'
   * 
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Count of available tables
   * 
   * @example
   *   const availableCount = await tableRepo.countAvailable(branchId, orgId)
   */
  async countAvailable(branchId: string, organizationId: string): Promise<number> {
    try {
      return await this.countByStatus(branchId, organizationId, 'available')
    } catch (error) {
      console.error('Error counting available tables:', error)
      return 0
    }
  }

  /**
   * Calculate occupancy percentage
   * OPTIMIZED: Uses single findByBranch() query + in-memory counting instead of 2 sequential Firestore calls
   * 
   * Returns percentage of occupied tables out of total
   * 
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Occupancy percentage (0-100)
   * 
   * @example
   *   const occupancy = await tableRepo.occupancyPercent(branchId, orgId)
   */
  async occupancyPercent(branchId: string, organizationId: string): Promise<number> {
    try {
      // OPTIMIZATION: Single Firestore query instead of 2 sequential counts
      const tables = await this.findByBranch(branchId, organizationId)
      
      if (tables.length === 0) return 0

      // In-memory counting is faster than additional Firestore calls
      const occupiedCount = tables.filter(t => t.status === 'occupied').length
      return (occupiedCount / tables.length) * 100
    } catch (error) {
      console.error('Error calculating occupancy percent:', error)
      return 0
    }
  }

  /**
   * Get tables by capacity
   * Find tables that can accommodate a certain number of people
   * 
   * @param capacity - Minimum capacity needed
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of table documents with at least the requested capacity
   * 
   * @example
   *   const tablesToSeat4 = await tableRepo.getByCapacity(4, branchId, orgId)
   */
  async getByCapacity(
    capacity: number,
    branchId: string,
    organizationId: string
  ): Promise<RestaurantTableDocument[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'capacity', operator: '>=', value: capacity },
        ],
        orders: [{ field: 'capacity', direction: 'asc' }],
      })
    } catch (error) {
      console.error('Error getting tables by capacity:', error)
      return []
    }
  }

  /**
   * Get available tables by capacity
   * Find available tables that can accommodate a certain number of people
   * 
   * @param capacity - Minimum capacity needed
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of available table documents
   * 
   * @example
   *   const availableTables = await tableRepo.getAvailableByCapacity(4, branchId, orgId)
   */
  async getAvailableByCapacity(
    capacity: number,
    branchId: string,
    organizationId: string
  ): Promise<RestaurantTableDocument[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'branchId', operator: '==', value: branchId },
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'capacity', operator: '>=', value: capacity },
          { field: 'status', operator: '==', value: 'available' },
        ],
        orders: [{ field: 'capacity', direction: 'asc' }],
      })
    } catch (error) {
      console.error('Error getting available tables by capacity:', error)
      return []
    }
  }

  /**
   * Get all table sections
   * Returns unique list of sections in a branch
   * 
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of unique section names
   * 
   * @example
   *   const sections = await tableRepo.getAllSections(branchId, orgId)
   */
  async getAllSections(branchId: string, organizationId: string): Promise<string[]> {
    try {
      const tables = await this.findByBranch(branchId, organizationId)
      const sections = new Set<string>()

      tables.forEach((table) => {
        if (table.section) {
          sections.add(table.section)
        }
      })

      return Array.from(sections).sort()
    } catch (error) {
      console.error('Error getting all sections:', error)
      return []
    }
  }

  /**
   * Get occupancy analytics
   * OPTIMIZED: Uses single findByBranch() query + in-memory grouping instead of 5 sequential COUNT queries
   * 
   * Returns comprehensive occupancy metrics for a branch
   * 
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Occupancy analytics data
   * 
   * @example
   *   const analytics = await tableRepo.getOccupancyAnalytics(branchId, orgId)
   */
  async getOccupancyAnalytics(
    branchId: string,
    organizationId: string
  ): Promise<TableOccupancyAnalytics> {
    try {
      // OPTIMIZATION: Single Firestore query instead of 5 sequential COUNT calls
      const tables = await this.findByBranch(branchId, organizationId)
      
      const totalTables = tables.length
      
      // In-memory grouping by status is faster than 5 separate Firestore count queries
      const statusCounts = tables.reduce(
        (acc, table) => {
          acc[table.status] = (acc[table.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      const occupiedTables = statusCounts['occupied'] || 0
      const availableTables = statusCounts['available'] || 0
      const reservedTables = statusCounts['reserved'] || 0
      const maintenanceTables = statusCounts['maintenance'] || 0

      const occupancyPercentage = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0

      return {
        totalTables,
        occupiedTables,
        availableTables,
        reservedTables,
        maintenanceTables,
        occupancyPercentage,
      }
    } catch (error) {
      console.error('Error getting occupancy analytics:', error)
      return {
        totalTables: 0,
        occupiedTables: 0,
        availableTables: 0,
        reservedTables: 0,
        maintenanceTables: 0,
        occupancyPercentage: 0,
      }
    }
  }

  /**
   * Update table status
   * Convenience method for status changes
   * 
   * @param tableId - Table ID
   * @param status - New status
   * @param userId - User performing update
   * @returns Updated table or error
   * 
   * @example
   *   const result = await tableRepo.updateStatus(tableId, 'occupied', userId)
   */
  async updateStatus(
    tableId: string,
    status: RestaurantTableDocument['status'],
    userId: string
  ): Promise<UpdateResult<RestaurantTableDocument>> {
    try {
      return await this.update(tableId, { status } as Partial<RestaurantTableDocument>, userId)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Mark table as needing cleaning
   * Convenience method for marking table as dirty
   * 
   * @param tableId - Table ID
   * @param userId - User performing action
   * @returns Updated table or error
   * 
   * @example
   *   const result = await tableRepo.markDirty(tableId, userId)
   */
  async markDirty(tableId: string, userId: string): Promise<UpdateResult<RestaurantTableDocument>> {
    try {
      return await this.updateStatus(tableId, 'dirty', userId)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Mark table as cleaned and available
   * Convenience method for returning table to available status
   * 
   * @param tableId - Table ID
   * @param userId - User performing action
   * @returns Updated table or error
   * 
   * @example
   *   const result = await tableRepo.markClean(tableId, userId)
   */
  async markClean(
    tableId: string,
    userId: string
  ): Promise<UpdateResult<RestaurantTableDocument>> {
    try {
      return await this.updateStatus(tableId, 'available', userId)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }
}

