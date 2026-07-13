/**
 * Repositories Barrel Export
 * Makes repositories accessible from app routes via @/repositories alias
 * 
 * Re-exports from backend/src/repositories
 */

export { BaseRepository } from '../backend/src/repositories/BaseRepository'
export { OrganizationRepository, type Organization, type CreateOrganizationPayload, type UpdateOrganizationPayload } from '../backend/src/repositories/OrganizationRepository'
export { UserRepository, type User, type CreateUserPayload, type UpdateUserPayload } from '../backend/src/repositories/UserRepository'
export { RoleRepository, type Role, type Permission, type CreateRolePayload, type UpdateRolePayload } from '../backend/src/repositories/RoleRepository'
export { IRepository } from '../backend/src/repositories/IRepository'
export { RepositoryFactory } from '../backend/src/repositories/RepositoryFactory'

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
} from '../backend/src/types/firestore'
