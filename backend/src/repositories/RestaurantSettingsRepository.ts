/**
 * Restaurant Settings Repository
 * Handles all Firestore operations for RestaurantSettings
 * Replaces Prisma restaurantSettings operations
 *
 * Pattern: Extends BaseRepository for generic CRUD + custom business methods
 * Data Source: Firestore collection "restaurantSettings"
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import {
  RestaurantScopedDocument,
  UpdateResult,
} from '../types/firestore'

/**
 * Restaurant Settings Document Schema (Firestore)
 * Stores configuration for a specific restaurant
 * Inherits: id, organizationId, restaurantId from RestaurantScopedDocument
 */
export interface RestaurantSettingsDocument extends RestaurantScopedDocument {
  // Operating Hours
  operatingHours?: Record<string, any> | null
  timezone: string
  holidayList?: string[] | null

  // Tax & Charges
  defaultGstRate: number
  defaultServiceChargePercent: number
  serviceChargeType: 'percentage' | 'fixed'

  // Order Settings
  minOrderValue: number
  maxOrderValue?: number | null
  advanceOrderMinHours: number
  qrOrdersEnabled: boolean
  directOrdersEnabled: boolean

  // POS Settings
  autoGenerateOrderNumber: boolean
  defaultPaymentMethod: string
  enableKitchenDisplay: boolean

  // AI Setup Configuration
  aiSetupCompleted: boolean
  aiGeneratedMenuCategory?: string | null
  aiSetupVersion: number

  // Restaurant Metadata
  costOfGoods?: Record<string, number> | null
  customTaxes?: Record<string, any> | null
  metadata?: Record<string, any> | null
}

/**
 * Restaurant Settings Repository
 * Extends BaseRepository to provide Firestore CRUD + custom queries
 */
export class RestaurantSettingsRepository extends BaseRepository<RestaurantSettingsDocument> {
  constructor() {
    super(COLLECTIONS.restaurantSettings)
  }

  /**
   * Find settings by restaurant ID
   * Main lookup method - returns single settings document per restaurant
   *
   * @param restaurantId - Restaurant ID
   * @returns Settings document or null
   */
  async findByRestaurant(restaurantId: string): Promise<RestaurantSettingsDocument | null> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'restaurantId', operator: '==' as const, value: restaurantId },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
        limit: 1,
      })

      return docs.length > 0 ? docs[0] : null
    } catch (error) {
      console.error(`Error finding settings for restaurant ${restaurantId}:`, error)
      return null
    }
  }

  /**
   * Find settings with organization & restaurant validation
   * Secure lookup to prevent cross-organization access
   *
   * @param restaurantId - Restaurant ID
   * @param organizationId - Organization ID (for security)
   * @returns Settings document or null
   */
  async findByRestaurantAndOrganization(
    restaurantId: string,
    organizationId: string
  ): Promise<RestaurantSettingsDocument | null> {
    try {
      const docs = await this.findMany({
        filters: [
          { field: 'restaurantId', operator: '==' as const, value: restaurantId },
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
        limit: 1,
      })

      return docs.length > 0 ? docs[0] : null
    } catch (error) {
      console.error(
        `Error finding settings for restaurant ${restaurantId}:`,
        error
      )
      return null
    }
  }

  /**
   * Update tax settings
   * Used for GST, service charge, and other tax configurations
   *
   * @param restaurantId - Restaurant ID
   * @param gstRate - New GST rate (%)
   * @param serviceChargePercent - New service charge (%)
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateTaxSettings(
    restaurantId: string,
    gstRate: number,
    serviceChargePercent: number,
    userId: string
  ): Promise<UpdateResult<RestaurantSettingsDocument>> {
    return await this.update(
      restaurantId,
      {
        defaultGstRate: gstRate,
        defaultServiceChargePercent: serviceChargePercent,
      } as any,
      userId
    )
  }

  /**
   * Update operating hours
   * Used for business hours configuration
   *
   * @param restaurantId - Restaurant ID
   * @param operatingHours - Operating hours configuration
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateOperatingHours(
    restaurantId: string,
    operatingHours: Record<string, any>,
    userId: string
  ): Promise<UpdateResult<RestaurantSettingsDocument>> {
    return await this.update(
      restaurantId,
      { operatingHours },
      userId
    )
  }

  /**
   * Update POS settings
   * Used for POS terminal configuration
   *
   * @param restaurantId - Restaurant ID
   * @param posSettings - Partial POS settings to update
   * @param userId - User performing the update
   * @returns Update result
   */
  async updatePOSSettings(
    restaurantId: string,
    posSettings: Partial<RestaurantSettingsDocument>,
    userId: string
  ): Promise<UpdateResult<RestaurantSettingsDocument>> {
    return await this.update(restaurantId, posSettings, userId)
  }

  /**
   * Update AI setup configuration
   * Used for AI-generated menu setup
   *
   * @param restaurantId - Restaurant ID
   * @param aiCompleted - Whether AI setup is completed
   * @param aiMenuCategory - AI-generated menu category ID
   * @param userId - User performing the update
   * @returns Update result
   */
  async updateAISetup(
    restaurantId: string,
    aiCompleted: boolean,
    aiMenuCategory: string | null,
    userId: string
  ): Promise<UpdateResult<RestaurantSettingsDocument>> {
    return await this.update(
      restaurantId,
      {
        aiSetupCompleted: aiCompleted,
        aiGeneratedMenuCategory: aiMenuCategory,
        aiSetupVersion: aiCompleted ? 1 : 0,
      } as any,
      userId
    )
  }

  /**
   * Get all settings for an organization
   * Used for bulk operations and reporting
   *
   * @param organizationId - Organization ID
   * @returns Array of settings documents
   */
  async findByOrganization(organizationId: string): Promise<RestaurantSettingsDocument[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'organizationId', operator: '==' as const, value: organizationId },
          { field: 'isDeleted', operator: '==' as const, value: false },
        ],
      })
    } catch (error) {
      console.error(
        `Error finding settings for organization ${organizationId}:`,
        error
      )
      return []
    }
  }
}
