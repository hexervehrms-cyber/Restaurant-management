/**
 * Authentication Service
 * Handles user authentication and context retrieval
 * Uses Firestore repositories (UserRepository, RoleRepository, OrganizationRepository)
 */

import { UserRepository, OrganizationRepository } from '@/repositories'
import { AuthenticationError } from '@/api/utils/errors'

export interface UserContext {
  id: string
  name: string
  role: string
  organizationId: string
  restaurantId: string
  branchId: string
  restaurantName: string
  branchName: string
}

/**
 * Get current user context (me endpoint)
 * Uses Firestore via UserRepository and OrganizationRepository
 */
export const getCurrentUserContext = async (
  userId: string
): Promise<UserContext> => {
  const userRepo = new UserRepository()
  const orgRepo = new OrganizationRepository()

  // Fetch user from Firestore
  const user = await userRepo.findById(userId)
  if (!user) {
    throw new AuthenticationError('User not found')
  }

  // Fetch organization from Firestore
  const org = await orgRepo.findById(user.organizationId)
  if (!org) {
    throw new AuthenticationError('Organization not found')
  }

  return {
    id: user.id,
    name: `${user.firstName || 'User'} ${user.lastName || ''}`.trim(),
    role: user.role,
    organizationId: user.organizationId,
    restaurantId: user.restaurantId || 'demo-restaurant',
    branchId: user.branchId || 'demo-branch',
    restaurantName: org.displayName,
    branchName: org.name, // TODO: Fetch from branches collection if needed
  }
}

/**
 * Validate JWT token and return user ID
 * TODO: Implement actual JWT verification
 */
export const validateToken = async (token: string): Promise<string> => {
  // TODO: Verify JWT token and return userId
  return 'dev-user-001'
}

/**
 * Register new user
 * TODO: Implement with password hashing
 */
export const registerUser = async (data: {
  email: string
  password: string
  firstName: string
  lastName: string
}) => {
  const userRepo = new UserRepository()

  // Check if email already exists
  const existing = await userRepo.findByEmail(data.email)
  if (existing) {
    throw new AuthenticationError('Email already registered')
  }

  // TODO: Hash password and create user
  // For now, return placeholder
  return { success: true, message: 'Registration not yet implemented' }
}

/**
 * Authenticate user login
 * TODO: Implement with password verification
 */
export const loginUser = async (email: string, password: string) => {
  const userRepo = new UserRepository()

  // Find user by email from Firestore
  const user = await userRepo.findByEmail(email)
  if (!user) {
    throw new AuthenticationError('Invalid credentials')
  }

  // Check if account is locked
  const isLocked = await userRepo.isAccountLocked(user.id)
  if (isLocked) {
    throw new AuthenticationError('Account temporarily locked')
  }

  // TODO: Verify password hash
  // For now, return placeholder
  return { success: true, message: 'Login not yet implemented' }
