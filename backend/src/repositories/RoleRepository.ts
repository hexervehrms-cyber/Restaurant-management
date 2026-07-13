/**
 * Role Repository
 * Handles all role-related database operations
 * Replaces Prisma with Firestore for role management
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import { UpdateResult, BaseDocument } from '../types/firestore'

/**
 * Permission Model
 */
export interface Permission {
  id: string
  name: string
  description?: string
}

/**
 * Role Document Model
 */
export interface Role extends BaseDocument {
  name: string
  displayName: string
  description?: string
  organizationId: string
  
  // Role hierarchy
  level: number // 0 = super admin, 1 = org admin, 2 = restaurant owner, 3 = manager, 4+ = staff
  isSystem: boolean // true for built-in roles like 'super_admin', 'organization_admin'
  
  // Permissions
  permissions: string[] // Array of permission IDs
  
  // Settings
  canDelegate: boolean // Can assign this role to others
  canDelete: boolean // Can be deleted
  color?: string // UI color for role
}

/**
 * Role creation payload
 */
export interface CreateRolePayload {
  name: string
  displayName: string
  description?: string
  organizationId: string
  level: number
  isSystem?: boolean
  permissions?: string[]
  canDelegate?: boolean
  canDelete?: boolean
  color?: string
}

/**
 * Role update payload
 */
export interface UpdateRolePayload {
  displayName?: string
  description?: string
  permissions?: string[]
  canDelegate?: boolean
  color?: string
}

/**
 * Role Repository
 * Extends BaseRepository with Role-specific operations
 */
export class RoleRepository extends BaseRepository<Role> {
  constructor() {
    super(COLLECTIONS.roles)
  }

  /**
   * Find role by name within organization
   * 
   * @param name - Role name
   * @param organizationId - Organization ID
   * @returns Role document or null
   * 
   * @example
   *   const role = await roleRepo.findByName('manager', orgId)
   */
  async findByName(name: string, organizationId: string): Promise<Role | null> {
    try {
      const query = this.getCollection()
        .where('name', '==', name)
        .where('organizationId', '==', organizationId)
        .limit(1)
      
      const snap = await query.get()
      if (snap.empty) return null
      
      const doc = snap.docs[0]
      const data = doc.data()
      return { id: doc.id, ...data } as Role
    } catch (error) {
      console.error(`Error finding role by name ${name}:`, error)
      return null
    }
  }

  /**
   * Find all roles in organization
   * 
   * @param organizationId - Organization ID
   * @param options - Query options
   * @returns Array of roles
   * 
   * @example
   *   const roles = await roleRepo.findByOrganization(orgId)
   */
  async findByOrganization(organizationId: string, options?: any): Promise<Role[]> {
    try {
      const defaultFilters = [{ field: 'organizationId', operator: '==', value: organizationId }]
      const filters = options?.filters ? [...defaultFilters, ...options.filters] : defaultFilters
      
      // Default ordering by level
      const orders = options?.orders || [{ field: 'level', direction: 'asc' }]
      
      return this.findMany({
        ...options,
        filters,
        orders,
      })
    } catch (error) {
      console.error(`Error finding roles in organization ${organizationId}:`, error)
      return []
    }
  }

  /**
   * Find system roles (super_admin, organization_admin, etc.)
   * 
   * @param options - Query options
   * @returns Array of system roles
   * 
   * @example
   *   const systemRoles = await roleRepo.findSystemRoles()
   */
  async findSystemRoles(options?: any): Promise<Role[]> {
    try {
      const defaultFilters = [{ field: 'isSystem', operator: '==', value: true }]
      const filters = options?.filters ? [...defaultFilters, ...options.filters] : defaultFilters
      
      return this.findMany({
        ...options,
        filters,
      })
    } catch (error) {
      console.error('Error finding system roles:', error)
      return []
    }
  }

  /**
   * Find roles by permission
   * 
   * @param permissionId - Permission ID
   * @param organizationId - Organization ID
   * @param options - Query options
   * @returns Array of roles that have this permission
   * 
   * @example
   *   const roles = await roleRepo.findByPermission(permId, orgId)
   */
  async findByPermission(permissionId: string, organizationId: string, options?: any): Promise<Role[]> {
    try {
      const defaultFilters = [
        { field: 'permissions', operator: 'array-contains', value: permissionId },
        { field: 'organizationId', operator: '==', value: organizationId },
      ]
      const filters = options?.filters ? [...defaultFilters, ...options.filters] : defaultFilters
      
      return this.findMany({
        ...options,
        filters,
      })
    } catch (error) {
      console.error(`Error finding roles with permission ${permissionId}:`, error)
      return []
    }
  }

  /**
   * Find roles by level
   * 
   * @param level - Role level
   * @param organizationId - Organization ID
   * @param options - Query options
   * @returns Array of roles at specified level
   * 
   * @example
   *   const managerRoles = await roleRepo.findByLevel(3, orgId)
   */
  async findByLevel(level: number, organizationId: string, options?: any): Promise<Role[]> {
    try {
      const defaultFilters = [
        { field: 'level', operator: '==', value: level },
        { field: 'organizationId', operator: '==', value: organizationId },
      ]
      const filters = options?.filters ? [...defaultFilters, ...options.filters] : defaultFilters
      
      return this.findMany({
        ...options,
        filters,
      })
    } catch (error) {
      console.error(`Error finding roles at level ${level}:`, error)
      return []
    }
  }

  /**
   * Count roles in organization
   * 
   * @param organizationId - Organization ID
   * @returns Number of roles
   * 
   * @example
   *   const count = await roleRepo.countByOrganization(orgId)
   */
  async countByOrganization(organizationId: string): Promise<number> {
    return this.count({
      filters: [{ field: 'organizationId', operator: '==', value: organizationId }],
    })
  }

  /**
   * Add permission to role
   * 
   * @param roleId - Role ID
   * @param permissionId - Permission ID to add
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await roleRepo.addPermission(roleId, permId, userId)
   */
  async addPermission(roleId: string, permissionId: string, updatedBy: string): Promise<UpdateResult<Role>> {
    try {
      const role = await this.findById(roleId)
      if (!role) throw new Error('Role not found')
      
      // Avoid duplicates
      if (role.permissions?.includes(permissionId)) {
        return { success: true, data: role }
      }
      
      const permissions = [...(role.permissions || []), permissionId]
      return this.update(roleId, { permissions } as Partial<Role>, updatedBy)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Remove permission from role
   * 
   * @param roleId - Role ID
   * @param permissionId - Permission ID to remove
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await roleRepo.removePermission(roleId, permId, userId)
   */
  async removePermission(roleId: string, permissionId: string, updatedBy: string): Promise<UpdateResult<Role>> {
    try {
      const role = await this.findById(roleId)
      if (!role) throw new Error('Role not found')
      
      const permissions = (role.permissions || []).filter(pId => pId !== permissionId)
      return this.update(roleId, { permissions } as Partial<Role>, updatedBy)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Add multiple permissions to role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs to add
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await roleRepo.addPermissions(roleId, [permId1, permId2], userId)
   */
  async addPermissions(roleId: string, permissionIds: string[], updatedBy: string): Promise<UpdateResult<Role>> {
    try {
      const role = await this.findById(roleId)
      if (!role) throw new Error('Role not found')
      
      const currentPerms = role.permissions || []
      const newPerms = Array.from(new Set([...currentPerms, ...permissionIds]))
      
      return this.update(roleId, { permissions: newPerms } as Partial<Role>, updatedBy)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Remove multiple permissions from role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs to remove
   * @param updatedBy - User performing the update
   * @returns Update result
   * 
   * @example
   *   const result = await roleRepo.removePermissions(roleId, [permId1, permId2], userId)
   */
  async removePermissions(roleId: string, permissionIds: string[], updatedBy: string): Promise<UpdateResult<Role>> {
    try {
      const role = await this.findById(roleId)
      if (!role) throw new Error('Role not found')
      
      const permissionsSet = new Set(permissionIds)
      const permissions = (role.permissions || []).filter(pId => !permissionsSet.has(pId))
      
      return this.update(roleId, { permissions } as Partial<Role>, updatedBy)
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Check if role has permission
   * 
   * @param roleId - Role ID
   * @param permissionId - Permission ID
   * @returns Boolean indicating if role has permission
   * 
   * @example
   *   const hasPermission = await roleRepo.hasPermission(roleId, permId)
   */
  async hasPermission(roleId: string, permissionId: string): Promise<boolean> {
    try {
      const role = await this.findById(roleId)
      if (!role) return false
      
      return (role.permissions || []).includes(permissionId)
    } catch (error) {
      console.error(`Error checking if role has permission:`, error)
      return false
    }
  }

  /**
   * Check if role has all permissions
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs
   * @returns Boolean indicating if role has all permissions
   * 
   * @example
   *   const hasAll = await roleRepo.hasAllPermissions(roleId, [permId1, permId2])
   */
  async hasAllPermissions(roleId: string, permissionIds: string[]): Promise<boolean> {
    try {
      const role = await this.findById(roleId)
      if (!role) return false
      
      const rolePerms = new Set(role.permissions || [])
      return permissionIds.every(pId => rolePerms.has(pId))
    } catch (error) {
      console.error('Error checking if role has all permissions:', error)
      return false
    }
  }

  /**
   * Check if role can be deleted
   * 
   * @param roleId - Role ID
   * @returns Boolean indicating if role can be deleted
   * 
   * @example
   *   const canDelete = await roleRepo.canDelete(roleId)
   */
  async canDeleteRole(roleId: string): Promise<boolean> {
    try {
      const role = await this.findById(roleId)
      if (!role) return false
      
      return role.canDelete !== false // Default true if not specified
    } catch (error) {
      console.error('Error checking if role can be deleted:', error)
      return false
    }
  }

  /**
   * Get roles by level range (e.g., all roles equal or above manager level)
   * 
   * @param minLevel - Minimum level (inclusive)
   * @param maxLevel - Maximum level (inclusive)
   * @param organizationId - Organization ID
   * @returns Array of roles in level range
   * 
   * @example
   *   const staffRoles = await roleRepo.findByLevelRange(3, 10, orgId) // Manager and above
   */
  async findByLevelRange(minLevel: number, maxLevel: number, organizationId: string): Promise<Role[]> {
    try {
      return this.findMany({
        filters: [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'level', operator: '>=', value: minLevel },
          { field: 'level', operator: '<=', value: maxLevel },
        ],
        orders: [{ field: 'level', direction: 'asc' }],
      })
    } catch (error) {
      console.error('Error finding roles by level range:', error)
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

