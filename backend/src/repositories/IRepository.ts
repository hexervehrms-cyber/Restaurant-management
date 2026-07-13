/**
 * Repository Interface
 * Defines the contract for all repositories
 * Generic interface that any repository can implement
 * 
 * Usage:
 *   class UserRepository extends BaseRepository<User> implements IRepository<User> { }
 */

import * as admin from 'firebase-admin'
import {
  BaseDocument,
  CreateResult,
  UpdateResult,
  DeleteResult,
  BatchResult,
  QueryOptions,
  PaginationResult,
  PaginationOptions,
  CursorPaginationResult,
} from '../types/firestore'

/**
 * Generic Repository Interface
 * All repositories must implement these methods
 * 
 * Type Parameter:
 *   T = Document type (must extend BaseDocument)
 */
export interface IRepository<T extends BaseDocument> {
  // ============= CREATE OPERATIONS =============

  /**
   * Create a new document with auto-generated ID
   * 
   * @param data - Document data (without id and audit fields)
   * @param userId - User creating the document
   * @param organizationId - Optional organization ID
   * @returns Promise with created document or error
   * 
   * @example
   *   const result = await userRepo.create(userData, userId, orgId)
   *   if (result.success) {
   *     console.log('Created:', result.data)
   *   }
   */
  create(
    data: Omit<T, keyof BaseDocument>,
    userId: string,
    organizationId?: string
  ): Promise<CreateResult<T>>

  /**
   * Create a document with specific ID
   * 
   * @param id - Document ID
   * @param data - Document data
   * @param userId - User creating the document
   * @param organizationId - Optional organization ID
   * @returns Promise with created document or error
   * 
   * @example
   *   const result = await userRepo.createWithId('user-123', userData, userId)
   */
  createWithId(
    id: string,
    data: Omit<T, keyof BaseDocument>,
    userId: string,
    organizationId?: string
  ): Promise<CreateResult<T>>

  // ============= READ OPERATIONS =============

  /**
   * Find document by ID
   * 
   * @param id - Document ID
   * @returns Document or null if not found
   * 
   * @example
   *   const user = await userRepo.findById('user-123')
   */
  findById(id: string): Promise<T | null>

  /**
   * Find all documents (WARNING: Use with caution for large collections)
   * 
   * @returns Array of all documents
   * 
   * @example
   *   const allUsers = await userRepo.getAll()
   */
  getAll(): Promise<T[]>

  /**
   * Find documents with filters, ordering, and pagination
   * 
   * @param options - Query options (filters, ordering, limit, offset)
   * @returns Array of matching documents
   * 
   * @example
   *   const active = await userRepo.findMany({
   *     filters: [{ field: 'status', operator: '==', value: 'active' }],
   *     orders: [{ field: 'createdAt', direction: 'desc' }],
   *     limit: 20
   *   })
   */
  findMany(options?: QueryOptions): Promise<T[]>

  /**
   * Find documents with cursor-based pagination (recommended)
   * Better performance than offset pagination
   * 
   * @param options - Query options
   * @param pagination - Cursor pagination options
   * @returns Documents with cursor and hasMore flag
   * 
   * @example
   *   // First page
   *   const result = await userRepo.findWithCursorPagination(options, { pageSize: 20 })
   *   
   *   // Next page
   *   const nextResult = await userRepo.findWithCursorPagination(options, {
   *     pageSize: 20,
   *     startAfter: result.lastSnapshot
   *   })
   */
  findWithCursorPagination(
    options?: QueryOptions,
    pagination?: {
      pageSize?: number
      startAfter?: admin.firestore.DocumentSnapshot
    }
  ): Promise<CursorPaginationResult<T>>

  /**
   * Find documents with offset pagination (deprecated, use cursor pagination)
   * WARNING: Less efficient than cursor pagination, especially for large datasets
   * 
   * @param options - Query options
   * @param pagination - Offset pagination options
   * @returns Documents with total count and pagination metadata
   * 
   * @example
   *   const result = await userRepo.findWithPagination(options, {
   *     pageSize: 20,
   *     pageNumber: 1
   *   })
   */
  findWithPagination(
    options?: QueryOptions,
    pagination?: PaginationOptions
  ): Promise<PaginationResult<T>>

  // ============= UPDATE OPERATIONS =============

  /**
   * Update document by ID
   * Automatically updates updatedAt and updatedBy
   * 
   * @param id - Document ID
   * @param updates - Partial document with updates
   * @param userId - User performing the update
   * @returns Updated document or error
   * 
   * @example
   *   const result = await userRepo.update('user-123', { status: 'inactive' }, userId)
   */
  update(id: string, updates: Partial<T>, userId: string): Promise<UpdateResult<T>>

  // ============= DELETE OPERATIONS =============

  /**
   * Soft delete document (marks as deleted, does not remove)
   * Sets isDeleted=true, deletedAt=now, deletedBy=userId
   * 
   * @param id - Document ID
   * @param userId - User performing the delete
   * @returns Deletion result or error
   * 
   * @example
   *   const result = await userRepo.delete('user-123', userId)
   */
  delete(id: string, userId: string): Promise<DeleteResult>

  /**
   * Restore previously deleted document
   * Clears isDeleted, deletedAt, deletedBy fields
   * 
   * @param id - Document ID
   * @param userId - User restoring the document
   * @returns Restored document or error
   * 
   * @example
   *   const result = await userRepo.restore('user-123', userId)
   */
  restore(id: string, userId: string): Promise<UpdateResult<T>>

  // ============= QUERY OPERATIONS =============

  /**
   * Check if document exists
   * 
   * @param id - Document ID
   * @returns Boolean indicating existence
   * 
   * @example
   *   if (await userRepo.exists('user-123')) {
   *     console.log('User exists')
   *   }
   */
  exists(id: string): Promise<boolean>

  /**
   * Count documents matching filter
   * 
   * @param options - Query options for filtering
   * @returns Number of matching documents
   * 
   * @example
   *   const activeCount = await userRepo.count({
   *     filters: [{ field: 'status', operator: '==', value: 'active' }]
   *   })
   */
  count(options?: QueryOptions): Promise<number>

  // ============= BATCH OPERATIONS =============

  /**
   * Execute batch write operation
   * Multiple writes executed atomically
   * 
   * @param operation - Function receiving batch object
   * @returns Batch result with success count and errors
   * 
   * @example
   *   const result = await userRepo.batchWrite((batch) => {
   *     batch.set(docRef1, data1)
   *     batch.update(docRef2, data2)
   *   })
   */
  batchWrite(operation: (batch: admin.firestore.WriteBatch) => void): Promise<BatchResult>

  // ============= TRANSACTION OPERATIONS =============

  /**
   * Execute transactional operation
   * Automatic retry on conflict
   * Ensures atomicity across multiple documents
   * 
   * @param operation - Async function receiving transaction object
   * @returns Result from operation
   * 
   * @example
   *   const result = await userRepo.transaction(async (transaction) => {
   *     const snap = await transaction.get(docRef)
   *     transaction.update(docRef, updates)
   *     return snap.data()
   *   })
   */
  transaction<R>(operation: (transaction: admin.firestore.Transaction) => Promise<R>): Promise<R>
}
