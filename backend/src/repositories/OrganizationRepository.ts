/**
 * Organization Repository
 * Handles all organization-related database operations
 * Replaces Prisma with Firestore for organization management
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import { UpdateResult, BaseDocument } from '../types/firestore'

/**
 * Organization Document Model
 */
export interface Organization extends BaseDocument {
  name: string
  displayName: string
  description?: string
  
  // Contact information
  email?: string
  phone?: string
  website?: string
  
  // Address
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  
  // Branding
  logo?: string
  favicon?: string
  color?: string
  
  // Organization settings
  timezone?: string
  currency?: string
  language?: string
  
  // Billing
  tier: 'free' | 'pro' | 'enterprise'
  maxRestaurants: number
  maxUsers: number
  maxBranches: number
  
  // Status
  status: 'active' | 'suspended' | 'inactive'
  
  // Metadata
  metadata?: Record<string, any>
}

/**
 * Organization creation payload
 */
export interface CreateOrganizationPayload {
  name: string
  displayName: string
  description?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  logo?: string
  favicon?: string
  color?: string
  timezone?: string
  currency?: string
  language?: string
  tier?: Organization['tier']
  maxRestaurants?: number
  maxUsers?: number
  maxBranches?: number
  metadata?: Record<string, any>
}

/**
 * Organization update payload
 */
export interface UpdateOrganizationPayload {
  displayName?: string
  description?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  logo?: string
  favicon?: string
  color?: string
  timezone?: string
  currency?: string
  language?: string
  tier?: Organization['tier']
  maxRestaurants?: number
  maxUsers?: number
  maxBranches?: number
  status?: Organization['status']
  metadata?: Record<string, any>
}

/**
 * Organization Repository
 * Extends BaseRepository with Organization-specific operations
 */
export class OrganizationRepository extends BaseRepository<Organization> {
  constructor() {
    super(COLLECTIONS.organizations)
  }

  /**
   * Find organization by name
   * 
   * @param name - Organization name
   * @returns Organization document or null
   * 
   * @example
   *   const org = await orgRepo.findByName('Acme Corp')
   */
  async findByName(name: string): Promise<Organization | null> {
    try {
      const query = this.getCollection().where('name', '==', name).limit(1)
      const snap = await query.get()
      
      if (snap.empty) return null
      
      const doc = snap.docs[0]
      const data = doc.data()
      return { id: doc.id, ...data } as Organization
    } catch (error) {
      console.error(`Error finding organization by name ${name}:`, error)
      return null
    }
  }

  /**
   * Find organization by email
   * 
   * @param email - Organization email
   * @returns Organization document or null
   * 
   * @example
   *   const org = await orgRepo.findByEmail('contact@acme.com')
   */
  async findByEmail(email: string): Promise<Organization | null> {
    try {
      const query = this.getCollection().where('email', '==', email).limit(1)
      const snap = await query.get()
      
      if (snap.empty) return null
      
      const doc = snap.docs[0]
      const data = doc.data()
      return { id: doc.id, ...data } as Organization
    } catch (error) {
      console.error(`Error finding organization by email ${email}:`, error)
      return null
    }
  }

  /**
   * Find all active organizations
   * 
   * @param options - Query options
   * @returns Array of active organizations
   * 
   * @example
   *   const activeOrgs = await orgRepo.findActive()
   */
  async findActive(options?: any): Promise<Organization[]> {
    try {
      const defaultFilters = [{ field: 'status', operator: '==', value: 'active' }]
      const filters = options?.filters ? [...defaultFilters, ...options.filters] : defaultFilters
      
      return this.findMany({
        ...options,
        filters,
      })
    } catch (error) {
      console.error('Error finding active organizations:', error)
      return []
    }
  }

  /**
   * Find organizations by tier (pricing plan)
   * 
   * @param tier - Organization tier
   * @param options - Query options
   * @returns Array of organizations with specified tier
   * 
   * @example
   *   const proOrgs = await orgRepo.findByTier('pro')
   */
  async findByTier(tier: Organization['tier'], options?: any): Promise<Organization[]> {
    try {
      const defaultFilters = [{ field: 'tier', operator: '==', value: tier }]
      const filters = options?.filters ? [...defaultFilters, ...options.filters] : defaultFilters
      
      return this.findMany({
        ...options,
        filters,
      })
    } catch (error) {
      console.error(`Error finding organizations with tier ${tier}:`, error)
      return []
    }
  }

  /**
   * Find organizations by status
   * 
   * @param status - Organization status
   * @param options - Query options
   * @returns Array of organizations with specified status
   * 
   * @example
   *   const suspendedOrgs = await orgRepo.findByStatus('suspended')
   */
  async findByStatus(status: Organization['status'], options?: any): Promise<Organization[]> {
    try {
      const defaultFilters = [{ field: 'status', operator: '==', value: status }]
      const filters = options?.filters ? [...defaultFilters, ...options.filters] : defaultFilters
      
      return this.findMany({
        ...options,
        filters,
      })
    } catch (error) {
      console.error(`Error finding organizations with status ${status}:`, error)
      return []
    }
  }

  /**
   * Find organizations by country
   * 
   * @param country - Country name or code
   * @param options - Query options
   * @returns Array of organizations in country
   * 
   * @example
   *   const usOrgs = await orgRepo.findByCountry('US')
   */
  async findByCountry(country: string, options?: any): Promise<Organization[]> {
    try {
      const defaultFilters = [{ field: 'country', operator: '==', value: country }]
      const filters = options?.filters ? [...defaultFilters, ...options.filters] : defaultFilters
      
      return this.findMany({
        ...options,
        filters,
      })
    } catch (error) {
      console.error(`Error finding organizations in country ${country}:`, error)
      return []
    }
  }

  /**
   * Count organizations by tier
   * 
   * @param tier - Organization tier
   * @returns Number of organizations
   * 
   * @example
   *   const proCount = await orgRepo.countByTier('pro')
   */
  async countByTier(tier: Organization['tier']): Promise<number> {
    return this.count({
      filters: [{ field: 'tier', operator: '==', value: tier }],
    })
  }

  /**
   * Count organizations by status
   * 
   * @param status - Organization status
   * @returns Number of organizations
   * 
   * @example
   *   const activeCount = await orgRepo.countByStatus('active')
   */
  async countByStatus(status: Organization['status']): Promise<number> {
    return this.count({
      filters: [{ field: 'status', operator: '==', value: status }],
    })
  }

  /**
   * Update organization settings
   * 
   * @param orgId - Organization ID
   * @param updates - Settings to update
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await orgRepo.updateSettings(orgId, { timezone: 'UTC' }, userId)
   */
  async updateSettings(
    orgId: string,
    updates: Partial<Organization>,
    updatedBy: string
  ): Promise<UpdateResult<Organization>> {
    return this.update(orgId, updates, updatedBy)
  }

  /**
   * Update organization status
   * 
   * @param orgId - Organization ID
   * @param status - New status
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await orgRepo.updateStatus(orgId, 'suspended', adminId)
   */
  async updateStatus(
    orgId: string,
    status: Organization['status'],
    updatedBy: string
  ): Promise<UpdateResult<Organization>> {
    return this.update(orgId, { status } as Partial<Organization>, updatedBy)
  }

  /**
   * Update organization tier (upgrade/downgrade)
   * 
   * @param orgId - Organization ID
   * @param tier - New tier
   * @param maxRestaurants - New max restaurants limit
   * @param maxUsers - New max users limit
   * @param maxBranches - New max branches limit
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await orgRepo.updateTier(orgId, 'pro', 10, 50, 20, adminId)
   */
  async updateTier(
    orgId: string,
    tier: Organization['tier'],
    maxRestaurants: number,
    maxUsers: number,
    maxBranches: number,
    updatedBy: string
  ): Promise<UpdateResult<Organization>> {
    return this.update(
      orgId,
      {
        tier,
        maxRestaurants,
        maxUsers,
        maxBranches,
      } as Partial<Organization>,
      updatedBy
    )
  }

  /**
   * Check if organization can create a new restaurant
   * 
   * @param orgId - Organization ID
   * @param currentRestaurantCount - Current number of restaurants
   * @returns Boolean indicating if organization can create more restaurants
   * 
   * @example
   *   const canCreate = await orgRepo.canCreateRestaurant(orgId, currentCount)
   */
  async canCreateRestaurant(orgId: string, currentRestaurantCount: number): Promise<boolean> {
    try {
      const org = await this.findById(orgId)
      if (!org) return false
      
      return currentRestaurantCount < org.maxRestaurants
    } catch (error) {
      console.error('Error checking if organization can create restaurant:', error)
      return false
    }
  }

  /**
   * Check if organization can create a new user
   * 
   * @param orgId - Organization ID
   * @param currentUserCount - Current number of users
   * @returns Boolean indicating if organization can create more users
   * 
   * @example
   *   const canCreate = await orgRepo.canCreateUser(orgId, currentCount)
   */
  async canCreateUser(orgId: string, currentUserCount: number): Promise<boolean> {
    try {
      const org = await this.findById(orgId)
      if (!org) return false
      
      return currentUserCount < org.maxUsers
    } catch (error) {
      console.error('Error checking if organization can create user:', error)
      return false
    }
  }

  /**
   * Check if organization can create a new branch
   * 
   * @param orgId - Organization ID
   * @param currentBranchCount - Current number of branches
   * @returns Boolean indicating if organization can create more branches
   * 
   * @example
   *   const canCreate = await orgRepo.canCreateBranch(orgId, currentCount)
   */
  async canCreateBranch(orgId: string, currentBranchCount: number): Promise<boolean> {
    try {
      const org = await this.findById(orgId)
      if (!org) return false
      
      return currentBranchCount < org.maxBranches
    } catch (error) {
      console.error('Error checking if organization can create branch:', error)
      return false
    }
  }

  /**
   * Suspend organization
   * 
   * @param orgId - Organization ID
   * @param reason - Reason for suspension
   * @param updatedBy - User performing the suspension
   * @returns Update result
   * 
   * @example
   *   const result = await orgRepo.suspend(orgId, 'Payment failed', adminId)
   */
  async suspend(
    orgId: string,
    reason: string,
    updatedBy: string
  ): Promise<UpdateResult<Organization>> {
    return this.update(
      orgId,
      {
        status: 'suspended',
        metadata: { suspensionReason: reason, suspendedAt: new Date() },
      } as Partial<Organization>,
      updatedBy
    )
  }

  /**
   * Reactivate suspended organization
   * 
   * @param orgId - Organization ID
   * @param updatedBy - User performing the reactivation
   * @returns Update result
   * 
   * @example
   *   const result = await orgRepo.reactivate(orgId, adminId)
   */
  async reactivate(
    orgId: string,
    updatedBy: string
  ): Promise<UpdateResult<Organization>> {
    return this.update(
      orgId,
      {
        status: 'active',
        metadata: { reactivatedAt: new Date() },
      } as Partial<Organization>,
      updatedBy
    )
  }

  /**
   * Get organization resources summary
   * 
   * @param orgId - Organization ID
   * @returns Organization with resource usage info
   * 
   * @example
   *   const summary = await orgRepo.getResourcesSummary(orgId)
   */
  async getResourcesSummary(orgId: string): Promise<Organization | null> {
    return this.findById(orgId)
  }

  // Allow subclasses to access protected methods for testing or extensions
  protected getErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    return 'Unknown error occurred'
  }
}

