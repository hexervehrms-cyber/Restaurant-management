/**
 * Authentication Middleware
 * TODO: Implement proper JWT authentication when auth service is ready
 */

import { AuthenticationError, AuthorizationError } from '@/api/utils/errors'

export interface AuthContext {
  userId: string
  organizationId: string
  restaurantId: string
  branchId: string
  role: string
}

/**
 * Mock auth context for development
 * TODO: Replace with real JWT token validation
 * Currently uses seeded data for testing
 */
export const getMockAuthContext = (): AuthContext => {
  // In development, return a mock user context with real UUIDs from seeded data
  // This should be replaced with JWT token validation in production
  return {
    userId: '2862fbcf-b0c3-403d-8e86-5fd1c205d658', // Seeded user ID
    organizationId: 'b8f51aa9-32c3-482d-9e26-989ba5816bc4', // Seeded org ID
    restaurantId: 'fb8e6830-45a9-4586-9370-1e2a7936952a', // Seeded restaurant ID
    branchId: '829b1e49-87b3-4cc9-a4a9-4e719bf4440c', // Seeded branch ID
    role: 'restaurant_owner',
  }
}

/**
 * Extract auth context from request
 * TODO: Implement proper JWT extraction from Authorization header
 */
export const extractAuthContext = (req: any): AuthContext => {
  // TODO: Extract JWT token from req.headers.authorization
  // Validate token
  // Return actual user context from database
  
  // For now, return mock context
  return getMockAuthContext()
}

/**
 * Validate that user has access to branch
 */
export const validateBranchAccess = (
  authContext: AuthContext,
  branchId: string
): void => {
  // TODO: Check if user is assigned to this branch
  // For now, allow all
  if (!authContext.userId) {
    throw new AuthenticationError('User not authenticated')
  }
}

/**
 * Validate that user has required role
 */
export const validateRole = (
  authContext: AuthContext,
  requiredRoles: string[]
): void => {
  if (!requiredRoles.includes(authContext.role)) {
    throw new AuthenticationError(
      `User role ${authContext.role} does not have permission`
    )
  }
}

/**
 * Validate that user can modify restaurant status
 * Only Restaurant Owner, Branch Manager, and Administrator can change status
 * 
 * Allowed Roles:
 * - restaurant_owner
 * - branch_manager
 * - admin
 */
export const validateStatusUpdatePermission = (authContext: AuthContext): void => {
  const allowedRoles = ['restaurant_owner', 'branch_manager', 'admin']
  
  if (!allowedRoles.includes(authContext.role)) {
    throw new AuthorizationError(
      `User role '${authContext.role}' does not have permission to change restaurant status. Only restaurant owners, branch managers, and administrators can modify operational status.`
    )
  }
}

/**
 * Allowed roles that can VIEW restaurant status (read-only)
 * All authenticated users can view
 */
export const canViewRestaurantStatus = (authContext: AuthContext): boolean => {
  return !!authContext.userId
}

