/**
 * User Repository
 * Handles all user-related database operations
 * Replaces Prisma with Firestore for user management
 */

import * as admin from 'firebase-admin'
import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import { CreateResult, UpdateResult, BaseDocument } from '../types/firestore'

/**
 * User Document Model
 */
export interface User extends BaseDocument {
  email: string
  password?: string // Hashed password, should be excluded from reads
  firstName: string
  lastName: string
  role: 'super_admin' | 'organization_admin' | 'restaurant_owner' | 'manager' | 'waiter' | 'kitchen_staff' | 'cashier'
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  phone?: string
  avatar?: string
  
  // Organization and restaurant assignments
  organizationId: string
  restaurantId?: string
  branchId?: string
  
  // Email verification
  emailVerified: boolean
  emailVerificationToken?: string
  emailVerificationExpiresAt?: Date
  
  // Password reset
  passwordResetToken?: string
  passwordResetExpiresAt?: Date
  
  // Account status
  lastLoginAt?: Date
  loginAttempts: number
  lockedUntil?: Date
  
  // Tenant-specific
  tenantId?: string
}

/**
 * User creation payload (excludes audit and status fields)
 */
export interface CreateUserPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  role: User['role']
  organizationId: string
  restaurantId?: string
  branchId?: string
  phone?: string
  avatar?: string
}

/**
 * User update payload
 */
export interface UpdateUserPayload {
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  status?: User['status']
  role?: User['role']
  restaurantId?: string
  branchId?: string
}

/**
 * User Repository
 * Extends BaseRepository with User-specific operations
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(COLLECTIONS.users)
  }

  /**
   * Find user by email (commonly used for authentication)
   * 
   * @param email - User email
   * @returns User document or null
   * 
   * @example
   *   const user = await userRepo.findByEmail('user@example.com')
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = this.getCollection().where('email', '==', email).limit(1)
      const snap = await query.get()
      
      if (snap.empty) return null
      
      const doc = snap.docs[0]
      const data = doc.data()
      return { id: doc.id, ...data } as User
    } catch (error) {
      console.error(`Error finding user by email ${email}:`, error)
      return null
    }
  }

  /**
   * Check if email exists
   * 
   * @param email - User email
   * @returns Boolean indicating if email exists
   * 
   * @example
   *   const exists = await userRepo.emailExists('user@example.com')
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const query = this.getCollection().where('email', '==', email).limit(1)
      const snap = await query.count().get()
      return snap.data().count > 0
    } catch (error) {
      console.error(`Error checking if email exists ${email}:`, error)
      return false
    }
  }

  /**
   * Find users by organization
   * 
   * @param organizationId - Organization ID
   * @param options - Query options (filters, ordering, pagination)
   * @returns Array of users in organization
   * 
   * @example
   *   const users = await userRepo.findByOrganization(orgId)
   */
  async findByOrganization(organizationId: string, options?: any): Promise<User[]> {
    try {
      const defaultFilters = [{ field: 'organizationId', operator: '==', value: organizationId }]
      const filters = options?.filters ? [...defaultFilters, ...options.filters] : defaultFilters
      
      return this.findMany({
        ...options,
        filters,
      })
    } catch (error) {
      console.error(`Error finding users in organization ${organizationId}:`, error)
      return []
    }
  }

  /**
   * Find users by role
   * 
   * @param role - User role
   * @param options - Query options
   * @returns Array of users with specified role
   * 
   * @example
   *   const admins = await userRepo.findByRole('organization_admin')
   */
  async findByRole(role: User['role'], options?: any): Promise<User[]> {
    try {
      const defaultFilters = [{ field: 'role', operator: '==', value: role }]
      const filters = options?.filters ? [...defaultFilters, ...options.filters] : defaultFilters
      
      return this.findMany({
        ...options,
        filters,
      })
    } catch (error) {
      console.error(`Error finding users with role ${role}:`, error)
      return []
    }
  }

  /**
   * Find users by restaurant
   * 
   * @param restaurantId - Restaurant ID
   * @param options - Query options
   * @returns Array of users assigned to restaurant
   * 
   * @example
   *   const staff = await userRepo.findByRestaurant(restaurantId)
   */
  async findByRestaurant(restaurantId: string, options?: any): Promise<User[]> {
    try {
      const defaultFilters = [{ field: 'restaurantId', operator: '==', value: restaurantId }]
      const filters = options?.filters ? [...defaultFilters, ...options.filters] : defaultFilters
      
      return this.findMany({
        ...options,
        filters,
      })
    } catch (error) {
      console.error(`Error finding users in restaurant ${restaurantId}:`, error)
      return []
    }
  }

  /**
   * Find users by status
   * 
   * @param status - User status
   * @param options - Query options
   * @returns Array of users with specified status
   * 
   * @example
   *   const activeUsers = await userRepo.findByStatus('active')
   */
  async findByStatus(status: User['status'], options?: any): Promise<User[]> {
    try {
      const defaultFilters = [{ field: 'status', operator: '==', value: status }]
      const filters = options?.filters ? [...defaultFilters, ...options.filters] : defaultFilters
      
      return this.findMany({
        ...options,
        filters,
      })
    } catch (error) {
      console.error(`Error finding users with status ${status}:`, error)
      return []
    }
  }

  /**
   * Count users by organization
   * 
   * @param organizationId - Organization ID
   * @returns Number of users in organization
   * 
   * @example
   *   const count = await userRepo.countByOrganization(orgId)
   */
  async countByOrganization(organizationId: string): Promise<number> {
    return this.count({
      filters: [{ field: 'organizationId', operator: '==', value: organizationId }],
    })
  }

  /**
   * Update user password
   * 
   * @param userId - User ID
   * @param hashedPassword - New hashed password
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await userRepo.updatePassword(userId, hashedPassword, adminId)
   */
  async updatePassword(userId: string, hashedPassword: string, updatedBy: string): Promise<UpdateResult<User>> {
    try {
      return this.update(userId, { password: hashedPassword } as Partial<User>, updatedBy)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Update user status
   * 
   * @param userId - User ID
   * @param status - New status
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await userRepo.updateStatus(userId, 'inactive', adminId)
   */
  async updateStatus(userId: string, status: User['status'], updatedBy: string): Promise<UpdateResult<User>> {
    return this.update(userId, { status } as Partial<User>, updatedBy)
  }

  /**
   * Mark email as verified
   * 
   * @param userId - User ID
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await userRepo.verifyEmail(userId, systemId)
   */
  async verifyEmail(userId: string, updatedBy: string): Promise<UpdateResult<User>> {
    return this.update(
      userId,
      {
        emailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpiresAt: undefined,
      } as Partial<User>,
      updatedBy
    )
  }

  /**
   * Set email verification token
   * 
   * @param userId - User ID
   * @param token - Verification token
   * @param expiresAt - Token expiration time
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await userRepo.setEmailVerificationToken(userId, token, expiresAt, systemId)
   */
  async setEmailVerificationToken(
    userId: string,
    token: string,
    expiresAt: Date,
    updatedBy: string
  ): Promise<UpdateResult<User>> {
    return this.update(
      userId,
      {
        emailVerificationToken: token,
        emailVerificationExpiresAt: expiresAt,
      } as Partial<User>,
      updatedBy
    )
  }

  /**
   * Set password reset token
   * 
   * @param userId - User ID
   * @param token - Reset token
   * @param expiresAt - Token expiration time
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await userRepo.setPasswordResetToken(userId, token, expiresAt, systemId)
   */
  async setPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
    updatedBy: string
  ): Promise<UpdateResult<User>> {
    return this.update(
      userId,
      {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      } as Partial<User>,
      updatedBy
    )
  }

  /**
   * Clear password reset token
   * 
   * @param userId - User ID
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await userRepo.clearPasswordResetToken(userId, systemId)
   */
  async clearPasswordResetToken(userId: string, updatedBy: string): Promise<UpdateResult<User>> {
    return this.update(
      userId,
      {
        passwordResetToken: undefined,
        passwordResetExpiresAt: undefined,
      } as Partial<User>,
      updatedBy
    )
  }

  /**
   * Update last login time
   * 
   * @param userId - User ID
   * @returns Update result
   * 
   * @example
   *   const result = await userRepo.updateLastLogin(userId)
   */
  async updateLastLogin(userId: string): Promise<UpdateResult<User>> {
    return this.update(userId, { lastLoginAt: new Date() } as Partial<User>, userId)
  }

  /**
   * Increment login attempts
   * 
   * @param userId - User ID
   * @returns Update result
   * 
   * @example
   *   const result = await userRepo.incrementLoginAttempts(userId)
   */
  async incrementLoginAttempts(userId: string): Promise<UpdateResult<User>> {
    try {
      const user = await this.findById(userId)
      if (!user) throw new Error('User not found')
      
      const newAttempts = (user.loginAttempts || 0) + 1
      return this.update(userId, { loginAttempts: newAttempts } as Partial<User>, userId)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Reset login attempts
   * 
   * @param userId - User ID
   * @returns Update result
   * 
   * @example
   *   const result = await userRepo.resetLoginAttempts(userId)
   */
  async resetLoginAttempts(userId: string): Promise<UpdateResult<User>> {
    return this.update(userId, { loginAttempts: 0 } as Partial<User>, userId)
  }

  /**
   * Lock account until specified time
   * 
   * @param userId - User ID
   * @param lockedUntil - Lock expiration time
   * @returns Update result
   * 
   * @example
   *   const result = await userRepo.lockAccount(userId, new Date(Date.now() + 30*60*1000))
   */
  async lockAccount(userId: string, lockedUntil: Date): Promise<UpdateResult<User>> {
    return this.update(userId, { lockedUntil } as Partial<User>, userId)
  }

  /**
   * Unlock account
   * 
   * @param userId - User ID
   * @returns Update result
   * 
   * @example
   *   const result = await userRepo.unlockAccount(userId)
   */
  async unlockAccount(userId: string): Promise<UpdateResult<User>> {
    return this.update(userId, { lockedUntil: undefined } as Partial<User>, userId)
  }

  /**
   * Check if account is locked
   * 
   * @param userId - User ID
   * @returns Boolean indicating if account is locked
   * 
   * @example
   *   const isLocked = await userRepo.isAccountLocked(userId)
   */
  async isAccountLocked(userId: string): Promise<boolean> {
    try {
      const user = await this.findById(userId)
      if (!user) return false
      
      if (!user.lockedUntil) return false
      
      // Check if lock has expired
      const now = new Date()
      const lockedUntil = user.lockedUntil instanceof Date ? user.lockedUntil : new Date(user.lockedUntil as any)
      
      return now < lockedUntil
    } catch (error) {
      console.error(`Error checking if account is locked ${userId}:`, error)
      return false
    }
  }

  /**
   * Get protected user (excludes password)
   * 
   * @param userId - User ID
   * @returns User document without password field
   * 
   * @example
   *   const user = await userRepo.getProtected(userId)
   */
  async getProtected(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.findById(userId)
    if (!user) return null
    
    const { password, ...protectedUser } = user
    return protectedUser
  }

  /**
   * Find multiple users by IDs
   * 
   * @param userIds - Array of user IDs
   * @returns Array of user documents
   * 
   * @example
   *   const users = await userRepo.findByIds(['user1', 'user2', 'user3'])
   */
  async findByIds(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return []
    
    try {
      // Firestore has a limit of 10 items for 'in' operator
      // Split into batches if needed
      const results: User[] = []
      const batchSize = 10
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize)
        const snap = await this.getCollection().where('__name__', 'in', batch.map(id => this.getCollection().doc(id))).get()
        
        snap.forEach((doc) => {
          const data = doc.data()
          results.push({ id: doc.id, ...data } as User)
        })
      }
      
      return results
    } catch (error) {
      console.error('Error finding users by IDs:', error)
      return []
    }
  }

  // Allow subclasses to access protected methods for testing or extensions
  protected getErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    return 'Unknown error occurred'
  }
}

