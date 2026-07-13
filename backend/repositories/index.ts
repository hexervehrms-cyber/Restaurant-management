/**
 * Repositories Barrel Export
 * Re-exports all repositories from src/repositories for convenient importing
 * 
 * This file allows imports like: import { UserRepository } from '@/repositories'
 * Without needing: import { UserRepository } from '@/src/repositories'
 */

export {
  IRepository,
  BaseRepository,
  RepositoryFactory,
  UserRepository,
  type User,
  type CreateUserPayload,
  type UpdateUserPayload,
  RoleRepository,
  type Role,
  type Permission,
  type CreateRolePayload,
  type UpdateRolePayload,
  OrganizationRepository,
  type Organization,
  type CreateOrganizationPayload,
  type UpdateOrganizationPayload,
  // Types
  type DocumentId,
  type BaseDocument,
  type CreateResult,
  type UpdateResult,
  type DeleteResult,
  type BatchResult,
  type QueryOptions,
  type QueryFilter,
  type QueryOrder,
  type PaginationResult,
  type PaginationOptions,
  type CursorPaginationResult,
  type FirestoreError,
  type FirestoreTimestamp,
  // Converters
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
  // Error handling
  FirestoreErrorCode,
  mapFirebaseError,
  safeFirestoreOperation,
  isFirestoreError,
  isNotFound,
  isPermissionDenied,
  isAlreadyExists,
  isRetryable,
  retryFirestoreOperation,
  // Collections
  COLLECTIONS,
  SUBCOLLECTION_PATHS,
  ALL_COLLECTIONS,
} from '../src/repositories'
