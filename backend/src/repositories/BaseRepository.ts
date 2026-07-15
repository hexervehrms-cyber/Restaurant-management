/**
 * Base Repository
 * Generic repository with common CRUD operations
 * All business repositories should extend this class
 *
 * NO business logic - only generic Firestore operations
 */

import { getFirestore } from '../config/firebase'
import { COLLECTIONS } from '../config/collections'
import { BATCH_OPERATIONS } from '../config/constants'
import { SOFT_DELETE_FIELDS, AUDIT_FIELDS } from '../config/constants'
import {
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
} from '../types/firestore'
import {
  prepareDocumentForCreate,
  prepareDocumentForUpdate,
  prepareDocumentForDelete,
  prepareDocumentForRestore,
  querySnapshotToArray,
} from '../config/converters'

/**
 * Base Repository Class
 * Provides common CRUD operations for all collections
 */
export class BaseRepository<T extends BaseDocument> {
  protected db: any
  protected collectionName: string

  constructor(collectionName: string) {
    this.db = getFirestore()
    this.collectionName = collectionName
  }

  /**
   * Get collection reference
   */
  protected getCollection() {
    return this.db.collection(this.collectionName)
  }

  /**
   * Get document reference
   */
  protected getDocRef(id: string) {
    return this.getCollection().doc(id)
  }

  /**
   * CREATE - Add new document
   *
   * Usage:
   *   const result = await repo.create(data, userId)
   */
  async create(data: Omit<T, keyof BaseDocument>, userId: string, organizationId?: string): Promise<CreateResult<T>> {
    try {
      const docRef = this.getCollection().doc()
      const prepared = prepareDocumentForCreate(
        { ...data, id: docRef.id },
        userId,
        organizationId
      )

      await docRef.set(prepared)

      return {
        success: true,
        data: { id: docRef.id, ...prepared } as T,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * CREATE with custom ID
   *
   * Usage:
   *   const result = await repo.createWithId(id, data, userId)
   */
  async createWithId(
    id: string,
    data: Omit<T, keyof BaseDocument>,
    userId: string,
    organizationId?: string
  ): Promise<CreateResult<T>> {
    try {
      const prepared = prepareDocumentForCreate(
        { ...data, id },
        userId,
        organizationId
      )

      await this.getDocRef(id).set(prepared)

      return {
        success: true,
        data: { id, ...prepared } as T,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * READ - Get document by ID
   *
   * Usage:
   *   const doc = await repo.findById(id)
   */
  async findById(id: string): Promise<T | null> {
    try {
      const snap = await this.getDocRef(id).get()
      if (!snap.exists) return null

      const data = snap.data()
      return { id: snap.id, ...data } as T
    } catch (error) {
      console.error(`Error finding document ${id}:`, error)
      return null
    }
  }

  /**
   * READ - Get all documents
   * WARNING: For large collections, use findMany() with filters instead
   *
   * Usage:
   *   const docs = await repo.getAll()
   */
  async getAll(): Promise<T[]> {
    try {
      const snap = await this.getCollection().get()
      return querySnapshotToArray<T>(snap)
    } catch (error) {
      console.error('Error getting all documents:', error)
      return []
    }
  }

  /**
   * READ - Query documents with filters
   *
   * Usage:
   *   const docs = await repo.findMany({
   *     filters: [
   *       { field: 'status', operator: '==', value: 'active' },
   *       { field: 'organizationId', operator: '==', value: orgId }
   *     ],
   *     orders: [{ field: 'createdAt', direction: 'desc' }],
   *     limit: 20
   *   })
   */
  async findMany(options?: QueryOptions): Promise<T[]> {
    try {
      let query: any = this.getCollection()

      // Apply filters
      if (options?.filters) {
        for (const filter of options.filters) {
          query = query.where(filter.field, filter.operator, filter.value)
        }
      }

      // Apply ordering
      if (options?.orders) {
        for (const order of options.orders) {
          query = query.orderBy(order.field, order.direction)
        }
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit)
      }

      // Apply offset
      if (options?.offset) {
        query = query.offset(options.offset)
      }

      const snap = await query.get()
      return querySnapshotToArray<T>(snap)
    } catch (error) {
      console.error('Error querying documents:', error)
      return []
    }
  }

  /**
   * READ - Query with cursor-based pagination
   * BEST PRACTICE: Use cursor pagination instead of offset for better performance
   *
   * Usage:
   *   // First page
   *   const result = await repo.findWithCursorPagination(options, { pageSize: 20 })
   *   
   *   // Next page
   *   const nextResult = await repo.findWithCursorPagination(options, { 
   *     pageSize: 20,
   *     startAfter: result.lastSnapshot
   *   })
   */
  async findWithCursorPagination(
    options?: QueryOptions,
    pagination?: {
      pageSize?: number
      startAfter?: any
    }
  ): Promise<{
    data: T[]
    lastSnapshot?: any
    hasMore: boolean
  }> {
    try {
      const pageSize = pagination?.pageSize || 20

      let query: any = this.getCollection()

      // Apply filters
      if (options?.filters) {
        for (const filter of options.filters) {
          query = query.where(filter.field, filter.operator, filter.value)
        }
      }

      // Apply ordering
      if (options?.orders) {
        for (const order of options.orders) {
          query = query.orderBy(order.field, order.direction)
        }
      }

      // Apply cursor (startAfter for pagination)
      if (pagination?.startAfter) {
        query = query.startAfter(pagination.startAfter)
      }

      // Fetch one extra to determine hasMore
      query = query.limit(pageSize + 1)

      const snap = await query.get()
      const docs = snap.docs

      let hasMore = false
      let results = docs

      if (docs.length > pageSize) {
        hasMore = true
        results = docs.slice(0, pageSize)
      }

      const data = results.map((doc) => {
        const docData = doc.data()
        return { id: doc.id, ...docData } as T
      })

      const lastSnapshot = results.length > 0 ? results[results.length - 1] : undefined

      return {
        data,
        lastSnapshot,
        hasMore,
      }
    } catch (error) {
      console.error('Error querying with cursor pagination:', error)
      return {
        data: [],
        hasMore: false,
      }
    }
  }

  /**
   * READ - Query with offset pagination (deprecated, use cursor pagination)
   * WARNING: Offset pagination is less efficient. Prefer cursor-based pagination.
   *
   * Usage:
   *   const result = await repo.findWithPagination(
   *     { filters: [...], orders: [...] },
   *     { pageSize: 20, pageNumber: 1 }
   *   )
   */
  async findWithPagination(
    options?: QueryOptions,
    pagination?: PaginationOptions
  ): Promise<PaginationResult<T>> {
    try {
      const pageSize = pagination?.pageSize || 20
      const pageNumber = pagination?.pageNumber || 1
      const offset = (pageNumber - 1) * pageSize

      // Get total count
      let countQuery: any = this.getCollection()
      if (options?.filters) {
        for (const filter of options.filters) {
          countQuery = countQuery.where(filter.field, filter.operator, filter.value)
        }
      }
      const countSnap = await countQuery.count().get()
      const total = countSnap.data().count

      // Get paginated results
      const data = await this.findMany({
        ...options,
        limit: pageSize,
        offset,
      })

      return {
        data,
        total,
        pageSize,
        pageNumber,
        hasMore: offset + pageSize < total,
      }
    } catch (error) {
      console.error('Error querying with pagination:', error)
      return {
        data: [],
        total: 0,
        pageSize: 20,
        pageNumber: 1,
        hasMore: false,
      }
    }
  }

  /**
   * UPDATE - Update document
   *
   * Usage:
   *   const result = await repo.update(id, updates, userId)
   */
  async update(id: string, updates: Partial<T>, userId: string): Promise<UpdateResult<T>> {
    try {
      const prepared = prepareDocumentForUpdate(updates, userId)
      await this.getDocRef(id).update(prepared)

      // Fetch updated document
      const updated = await this.findById(id)
      return {
        success: true,
        data: updated || undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * DELETE - Soft delete (set isDeleted = true)
   *
   * Usage:
   *   const result = await repo.delete(id, userId)
   */
  async delete(id: string, userId: string): Promise<DeleteResult> {
    try {
      const prepared = prepareDocumentForDelete(userId)
      await this.getDocRef(id).update(prepared)

      return {
        success: true,
        deletedId: id,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * RESTORE - Undo soft delete
   *
   * Usage:
   *   const result = await repo.restore(id, userId)
   */
  async restore(id: string, userId: string): Promise<UpdateResult<T>> {
    try {
      const prepared = prepareDocumentForRestore(userId)
      await this.getDocRef(id).update(prepared)

      // Fetch restored document
      const restored = await this.findById(id)
      return {
        success: true,
        data: restored || undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * CHECK - Document exists
   *
   * Usage:
   *   const exists = await repo.exists(id)
   */
  async exists(id: string): Promise<boolean> {
    try {
      const snap = await this.getDocRef(id).get()
      return snap.exists
    } catch (error) {
      console.error('Error checking document existence:', error)
      return false
    }
  }

  /**
   * COUNT - Count documents matching filter
   *
   * Usage:
   *   const count = await repo.count({ filters: [...] })
   */
  async count(options?: QueryOptions): Promise<number> {
    try {
      let query: any = this.getCollection()

      // Apply filters
      if (options?.filters) {
        for (const filter of options.filters) {
          query = query.where(filter.field, filter.operator, filter.value)
        }
      }

      const snap = await query.count().get()
      return snap.data().count
    } catch (error) {
      console.error('Error counting documents:', error)
      return 0
    }
  }

  /**
   * BATCH - Batch write operation
   *
   * Usage:
   *   const result = await repo.batchWrite((batch) => {
   *     batch.set(docRef1, data1)
   *     batch.update(docRef2, data2)
   *   })
   */
  async batchWrite(operation: (batch: any) => void): Promise<BatchResult> {
    try {
      const batch = this.db.batch()
      operation(batch)
      await batch.commit()

      return {
        success: true,
        successCount: 1,
        failureCount: 0,
        errors: [],
      }
    } catch (error) {
      return {
        success: false,
        successCount: 0,
        failureCount: 1,
        errors: [
          {
            docId: 'batch',
            error: this.getErrorMessage(error),
          },
        ],
      }
    }
  }

  /**
   * TRANSACTION - Run transactional operation
   *
   * Usage:
   *   const result = await repo.transaction(async (transaction) => {
   *     const snap = await transaction.get(docRef)
   *     transaction.update(docRef, updates)
   *   })
   */
  async transaction<R>(operation: (transaction: any) => Promise<R>): Promise<R> {
    return this.db.runTransaction(operation)
  }

  /**
   * HELPER - Get error message from error object
   */
  protected getErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    return 'Unknown error occurred'
  }
}
