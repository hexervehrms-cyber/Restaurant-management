/**
 * Branch Repository
 * Handles all Firestore operations for Branch entities
 * Replaces all Prisma branch operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "branches"
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import {
  BranchScopedDocument,
  QueryOptions,
  QueryOrder,
  CreateResult,
  UpdateResult,
} from '../types/firestore'

/**
 * Branch Document Schema (Firestore)
 */
export interface BranchDocument extends BranchScopedDocument {
  name: string
  address: string
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  email?: string | null
  managerId?: string | null
  status: string
  maxTables: number
  isPrimary: boolean
  metadata?: Record<string, any>
}

/**
 * Branch Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class BranchRepository extends BaseRepository<BranchDocument> {
  constructor() {
    super(COLLECTIONS.branches)
  }

  /**
   * Find branch by ID and organization
   * Secure lookup to prevent cross-organization access
   *
   * @param branchId - Branch ID
   * @param organizationId - Organization ID (for security)
   * @returns Branch document or null
   */
  async findByIdAndOrganization(
    branchId: string,
    organizationId: string
  ): Promise<BranchDocument | null> {
    try {
      const doc = await this.findById(branchId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Branch ${branchId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding branch ${branchId}:`, error)
      return null
    }
  }

  /**
   * Find branch by ID and restaurant
   * Used for branch-to-restaurant resolution
   *
   * @param branchId - Branch ID
   * @param restaurantId - Restaurant ID (for security)
   * @returns Branch document or null
   */
  async findByIdAndRestaurant(
    branchId: string,
    restaurantId: string
  ): Promise<BranchDocument | null> {
    try {
      const doc = await this.findById(branchId)

      if (!doc) return null

      // Validate restaurant access
      if (doc.restaurantId !== restaurantId) {
        console.warn(
          `Access denied: Branch ${branchId} does not belong to restaurant ${restaurantId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding branch ${branchId}:`, error)
      return null
    }
  }

  /**
   * Find all branches for a restaurant
   * Used in restaurant management and branch list endpoints
   *
   * @param restaurantId - Restaurant ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of branch documents
   */
  async findByRestaurant(
    restaurantId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<BranchDocument[]> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders,
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(`Error finding branches for restaurant ${restaurantId}:`, error)
      return []
    }
  }

  /**
   * Find all branches for an organization
   * Used in organization management
   *
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of branch documents
   */
  async findByOrganization(
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<BranchDocument[]> {
    try {
      const filters = [
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      return await this.findMany({
        filters,
        orders: options?.orders,
        limit: options?.limit,
        offset: options?.offset,
      })
    } catch (error) {
      console.error(`Error finding branches for organization ${organizationId}:`, error)
      return []
    }
  }

  /**
   * Find primary branch for a restaurant
   * Each restaurant has one primary branch
   *
   * @param restaurantId - Restaurant ID
   * @returns Primary branch document or null
   */
  async findPrimaryBranch(restaurantId: string): Promise<BranchDocument | null> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'restaurantId', operator: '==' as const, value: restaurantId },
          { field: 'isPrimary', operator: '==' as const, value: true },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
        limit: 1,
      })

      return docs.length > 0 ? docs[0] : null
    } catch (error) {
      console.error(`Error finding primary branch for restaurant ${restaurantId}:`, error)
      return null
    }
  }

  /**
   * Find branch by name and restaurant
   * Used for unique lookups
   *
   * @param restaurantId - Restaurant ID
   * @param name - Branch name
   * @returns Branch document or null
   */
  async findByRestaurantAndName(
    restaurantId: string,
    name: string
  ): Promise<BranchDocument | null> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'restaurantId', operator: '==' as const, value: restaurantId },
          { field: 'name', operator: '==' as const, value: name },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
        limit: 1,
      })

      return docs.length > 0 ? docs[0] : null
    } catch (error) {
      console.error(
        `Error finding branch by name ${name} in restaurant ${restaurantId}:`,
        error
      )
      return null
    }
  }

  /**
   * Count branches for a restaurant
   *
   * @param restaurantId - Restaurant ID
   * @param status - Optional status filter
   * @returns Count of branches
   */
  async countByRestaurant(
    restaurantId: string,
    status?: string
  ): Promise<number> {
    try {
      const filters = [
        { field: 'restaurantId', operator: '==' as const, value: restaurantId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      if (status) {
        filters.push({ field: 'status', operator: '==' as const, value: status })
      }

      return await this.count({ filters })
    } catch (error) {
      console.error(
        `Error counting branches for restaurant ${restaurantId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Update branch status
   *
   * @param branchId - Branch ID
   * @param status - New status
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateStatus(
    branchId: string,
    status: string,
    userId: string
  ): Promise<UpdateResult<BranchDocument>> {
    return await this.update(branchId, { status: status as any }, userId)
  }

  /**
   * Update branch manager
   *
   * @param branchId - Branch ID
   * @param managerId - New manager ID
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateManager(
    branchId: string,
    managerId: string,
    userId: string
  ): Promise<UpdateResult<BranchDocument>> {
    return await this.update(branchId, { managerId } as any, userId)
  }

  /**
   * Soft delete branch
   *
   * @param branchId - Branch ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(branchId: string, userId: string) {
    return await this.delete(branchId, userId)
  }

  /**
   * Restore soft-deleted branch
   *
   * @param branchId - Branch ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(branchId: string, userId: string) {
    return await super.restore(branchId, userId)
  }
}
