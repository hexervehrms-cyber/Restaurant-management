/**
 * Restaurant Repository
 * Handles all Firestore operations for Restaurant entities
 * Replaces all Prisma restaurant operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "restaurants"
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import {
  RestaurantScopedDocument,
  QueryOptions,
  QueryOrder,
  CreateResult,
  UpdateResult,
} from '../types/firestore'

/**
 * Restaurant Document Schema (Firestore)
 */
export interface RestaurantDocument extends RestaurantScopedDocument {
  name: string
  slug: string
  email?: string | null
  phone?: string | null
  cuisineType?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  gstNumber?: string | null
  fssaiNumber?: string | null
  establishmentDate?: string | null
  status: string
  logoUrl?: string | null
  bannerUrl?: string | null
  description?: string | null
  maxTables: number
  avgTableCapacity: number
  operatingHours?: Record<string, any> | null
  metadata?: Record<string, any>
  isActive?: boolean
}

/**
 * Restaurant Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class RestaurantRepository extends BaseRepository<RestaurantDocument> {
  constructor() {
    super(COLLECTIONS.restaurants)
  }

  /**
   * Find restaurant by slug and organization ID
   * Used during restaurant lookup
   *
   * @param slug - Restaurant slug (e.g., 'spice-garden-main')
   * @param organizationId - Organization ID
   * @returns Restaurant document or null
   */
  async findBySlug(slug: string, organizationId: string): Promise<RestaurantDocument | null> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'slug', operator: '==' as const, value: slug },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
        limit: 1,
      })

      return docs.length > 0 ? docs[0] : null
    } catch (error) {
      console.error(`Error finding restaurant by slug ${slug}:`, error)
      return null
    }
  }

  /**
   * Find all restaurants for an organization
   * Used in restaurant list endpoints
   *
   * @param organizationId - Organization ID
   * @param options - Optional query options (ordering, pagination)
   * @returns Array of restaurant documents
   */
  async findByOrganization(
    organizationId: string,
    options?: Omit<QueryOptions, 'filters'>
  ): Promise<RestaurantDocument[]> {
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
      console.error(`Error finding restaurants for organization ${organizationId}:`, error)
      return []
    }
  }

  /**
   * Find restaurant by ID with organization validation
   * Used in secure lookups to prevent cross-organization access
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID (for security)
   * @returns Restaurant document or null
   */
  async findByIdAndOrganization(
    restaurantId: string,
    organizationId: string
  ): Promise<RestaurantDocument | null> {
    try {
      const doc = await this.findById(restaurantId)

      if (!doc) return null

      // Validate organization access
      if (doc.organizationId !== organizationId) {
        console.warn(
          `Access denied: Restaurant ${restaurantId} does not belong to organization ${organizationId}`
        )
        return null
      }

      // Check if not soft-deleted
      if (doc.isDeleted) {
        return null
      }

      return doc
    } catch (error) {
      console.error(`Error finding restaurant ${restaurantId}:`, error)
      return null
    }
  }

  /**
   * Count restaurants by status for an organization
   * Used in analytics and dashboard metrics
   *
   * @param organizationId - Organization ID
   * @param status - Restaurant status filter (optional)
   * @returns Count of restaurants
   */
  async countByOrganization(
    organizationId: string,
    status?: string
  ): Promise<number> {
    try {
      const filters = [
        { field: 'organizationId', operator: '==' as const, value: organizationId },
        { field: 'isDeleted', operator: '==' as const, value: false },
      ]

      if (status) {
        filters.push({ field: 'status', operator: '==' as const, value: status })
      }

      return await this.count({ filters })
    } catch (error) {
      console.error(
        `Error counting restaurants for organization ${organizationId}:`,
        error
      )
      return 0
    }
  }

  /**
   * Update restaurant status (active/inactive)
   * Used to enable/disable restaurant operations
   *
   * @param restaurantId - Restaurant ID
   * @param status - New status
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateStatus(
    restaurantId: string,
    status: string,
    userId: string
  ): Promise<UpdateResult<RestaurantDocument>> {
    return await this.update(restaurantId, { status: status as any }, userId)
  }

  /**
   * Update restaurant settings (metadata, operating hours, etc.)
   * Used for bulk configuration updates
   *
   * @param restaurantId - Restaurant ID
   * @param updates - Partial restaurant data to update
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateSettings(
    restaurantId: string,
    updates: Partial<RestaurantDocument>,
    userId: string
  ): Promise<UpdateResult<RestaurantDocument>> {
    return await this.update(restaurantId, updates, userId)
  }

  /**
   * Soft delete restaurant (sets isDeleted = true)
   * Preserves data for audit trail
   *
   * @param restaurantId - Restaurant ID
   * @param userId - User performing the delete
   * @returns Delete result
   */
  async softDelete(restaurantId: string, userId: string) {
    return await this.delete(restaurantId, userId)
  }

  /**
   * Restore soft-deleted restaurant
   * Only works on soft-deleted documents
   *
   * @param restaurantId - Restaurant ID
   * @param userId - User performing the restore
   * @returns Update result
   */
  async restore(restaurantId: string, userId: string) {
    return await super.restore(restaurantId, userId)
  }
}
