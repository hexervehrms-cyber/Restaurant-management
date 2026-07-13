/**
 * Firestore Converters
 * Handle data conversion between Firestore and application layer
 * Specifically handles Timestamps and Numeric types
 */

import * as admin from 'firebase-admin'
import { timestampToDate, toMillis } from './timestamps'

/**
 * Generic Firestore converter
 * Automatically handles Timestamp and Numeric conversions
 */
export class FirestoreConverter<T> {
  /**
   * Convert from Firestore format to application format
   * Handles Timestamp and Numeric type conversions
   */
  static fromFirestore(snapshot: any, options?: any): T {
    const data = snapshot.data(options)
    if (!data) return data

    return FirestoreConverter.convertFromFirestore(data) as T
  }

  /**
   * Convert from application format to Firestore format
   */
  static toFirestore(data: T): any {
    return FirestoreConverter.convertToFirestore(data as any)
  }
}

/**
 * Deep conversion from Firestore types to JS types
 */
function convertFromFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Handle Firestore Timestamp
  if (obj instanceof admin.firestore.Timestamp) {
    return timestampToDate(obj)
  }

  // Handle Firestore Numeric
  if (obj?.type === 'double' && obj?.value !== undefined) {
    return parseFloat(obj.value as string)
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => convertFromFirestore(item))
  }

  // Handle objects
  if (typeof obj === 'object') {
    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertFromFirestore(value)
    }
    return converted
  }

  return obj
}

/**
 * Deep conversion from JS types to Firestore types
 */
function convertToFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Handle Date - convert to Firestore Timestamp
  if (obj instanceof Date) {
    return admin.firestore.Timestamp.fromDate(obj)
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => convertToFirestore(item))
  }

  // Handle objects
  if (typeof obj === 'object') {
    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertToFirestore(value)
    }
    return converted
  }

  return obj
}

/**
 * Convert numeric value to Firestore.Numeric format
 * 
 * Usage:
 *   const price = toFirestoreNumeric(99.99)
 *   // Returns: admin.firestore.Numeric("99.99")
 */
export function toFirestoreNumeric(value: number | string): admin.firestore.Numeric {
  return admin.firestore.Numeric(value.toString())
}

/**
 * Convert Firestore.Numeric to number
 * 
 * Usage:
 *   const price = fromFirestoreNumeric(doc.price)
 */
export function fromFirestoreNumeric(value: any): number {
  if (!value) return 0
  if (typeof value === 'number') return value
  if (value?.type === 'double' && value?.value) {
    return parseFloat(value.value as string)
  }
  return 0
}

/**
 * Firestore document converter with type safety
 * 
 * Usage:
 *   const converter: FirestoreDocumentConverter<Order> = {
 *     toFirestore: (order) => ({ ...order, updatedAt: serverTimestamp() }),
 *     fromFirestore: (snap) => ({ id: snap.id, ...snap.data() })
 *   }
 */
export interface FirestoreDocumentConverter<T> {
  toFirestore(modelObject: T): any
  fromFirestore(snapshot: any, options?: any): T
}

/**
 * Create a generic document converter
 * Automatically handles timestamp and numeric conversions
 */
export function createDocumentConverter<T>(): FirestoreDocumentConverter<T> {
  return {
    toFirestore(data: T): any {
      return convertToFirestore(data)
    },
    fromFirestore(snapshot: any, options?: any): T {
      const data = snapshot.data(options)
      if (!data) return data
      return convertFromFirestore(data) as T
    },
  }
}

/**
 * Safely parse Firestore document with error handling
 * 
 * Usage:
 *   const order = safeParseDocument(snapshot, Order)
 */
export function safeParseDocument<T>(snapshot: any, constructor?: new() => T): T | null {
  try {
    if (!snapshot || !snapshot.exists) {
      return null
    }

    const data = snapshot.data()
    return convertFromFirestore(data) as T
  } catch (error) {
    console.error('Error parsing Firestore document:', error)
    return null
  }
}

/**
 * Batch convert multiple documents
 * 
 * Usage:
 *   const orders = batchConvert(snapshots)
 */
export function batchConvert<T>(snapshots: any[]): T[] {
  return snapshots
    .filter((snap) => snap.exists)
    .map((snap) => {
      const data = snap.data()
      return {
        id: snap.id,
        ...convertFromFirestore(data),
      } as T
    })
}

/**
 * Convert query snapshot to array of documents
 * 
 * Usage:
 *   const orders = querySnapshotToArray<Order>(snapshot)
 */
export function querySnapshotToArray<T>(querySnapshot: any): T[] {
  const docs: T[] = []
  querySnapshot.forEach((doc: any) => {
    docs.push({
      id: doc.id,
      ...convertFromFirestore(doc.data()),
    } as T)
  })
  return docs
}

/**
 * Prepare document for creation
 * Adds required fields like createdAt, updatedAt
 * 
 * Usage:
 *   const prepared = prepareDocumentForCreate(data, userId)
 */
export function prepareDocumentForCreate(data: any, userId: string, organizationId?: string): any {
  return {
    ...convertToFirestore(data),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: userId,
    updatedBy: userId,
    isDeleted: false,
    ...(organizationId && { organizationId }),
  }
}

/**
 * Prepare document for update
 * Adds updatedAt timestamp
 * 
 * Usage:
 *   const prepared = prepareDocumentForUpdate(data, userId)
 */
export function prepareDocumentForUpdate(data: any, userId: string): any {
  const cleaned = { ...data }
  delete cleaned.id
  delete cleaned.createdAt
  delete cleaned.createdBy
  delete cleaned.organizationId

  return {
    ...convertToFirestore(cleaned),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: userId,
  }
}

/**
 * Prepare document for soft delete
 * 
 * Usage:
 *   const prepared = prepareDocumentForDelete(userId)
 */
export function prepareDocumentForDelete(userId: string): any {
  return {
    isDeleted: true,
    deletedAt: admin.firestore.FieldValue.serverTimestamp(),
    deletedBy: userId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: userId,
  }
}

/**
 * Prepare document for restore (undo soft delete)
 * 
 * Usage:
 *   const prepared = prepareDocumentForRestore(userId)
 */
export function prepareDocumentForRestore(userId: string): any {
  return {
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: userId,
  }
}
