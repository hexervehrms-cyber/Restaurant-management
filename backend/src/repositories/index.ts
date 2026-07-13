/**
 * Repository Layer Exports
 * Core Firestore repository framework
 * 
 * FRAMEWORK COMPONENTS:
 * - IRepository: Generic interface for all repositories
 * - BaseRepository: Generic base class with common CRUD operations
 * - RepositoryFactory: Singleton factory for repository management and DI
 * 
 * USAGE:
 *   // In a module's repository
 *   import { BaseRepository, IRepository } from '@/repositories'
 *   import { COLLECTIONS } from '@/config/collections'
 *   
 *   export class UserRepository extends BaseRepository<User> implements IRepository<User> {
 *     constructor() {
 *       super(COLLECTIONS.users)
 *     }
 *   }
 *   
 *   // Register and use
 *   RepositoryFactory.register('users', UserRepository, COLLECTIONS.users)
 *   const userRepo = RepositoryFactory.resolve<UserRepository>('users')
 * 
 * NO BUSINESS LOGIC IN THIS LAYER
 * All repositories should inherit from BaseRepository
 * All repositories should implement IRepository
 * Only CRUD operations and generic Firestore methods
 */

export { IRepository } from './IRepository'
export { BaseRepository } from './BaseRepository'
export { RepositoryFactory } from './RepositoryFactory'

/**
 * Authentication Repositories
 * Handle user, role, and organization data
 */
export { UserRepository, type User, type CreateUserPayload, type UpdateUserPayload } from './UserRepository'
export { RoleRepository, type Role, type Permission, type CreateRolePayload, type UpdateRolePayload } from './RoleRepository'
export {
  OrganizationRepository,
  type Organization,
  type CreateOrganizationPayload,
  type UpdateOrganizationPayload,
} from './OrganizationRepository'

/**
 * Re-export commonly used types
 */
export type {
  DocumentId,
  BaseDocument,
  CreateResult,
  UpdateResult,
  DeleteResult,
  BatchResult,
  QueryOptions,
  QueryFilter,
  QueryOrder,
  PaginationResult,
  PaginationOptions,
  CursorPaginationResult,
  FirestoreError,
  FirestoreTimestamp,
} from '../types/firestore'

/**
 * Re-export Firestore utilities
 */
export {
  FirestoreConverter,
  toFirestoreNumeric,
  fromFirestoreNumeric,
  createDocumentConverter,
  safeParseDocument,
  batchConvert,
  querySnapshotToArray,
  prepareDocumentForCreate,
  prepareDocumentForUpdate,
  prepareDocumentForDelete,
  prepareDocumentForRestore,
} from '../config/converters'

/**
 * Re-export error handling
 */
export {
  FirestoreError,
  FirestoreErrorCode,
  mapFirebaseError,
  safeFirestoreOperation,
  isFirestoreError,
  isNotFound,
  isPermissionDenied,
  isAlreadyExists,
  isRetryable,
  retryFirestoreOperation,
} from '../firestore/errors'

/**
 * Re-export collection constants
 */
export { COLLECTIONS, SUBCOLLECTION_PATHS, ALL_COLLECTIONS } from '../firestore/collections'
