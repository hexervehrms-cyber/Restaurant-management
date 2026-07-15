/**
 * Firestore Converters
 * Handle data conversion between Firestore and application layer
 * Specifically handles Timestamps and Numeric types
 * 
 * Uses modular Firebase Admin SDK (firebase-admin/firestore)
 */

import { timestampToDate, toMillis } from './timestamps'

/**
 * Check if a value is a Firestore Timestamp
 * Works with modular API timestamps
 */
function isFirestoreTimestamp(obj: any): boolean {
  if (!obj) return false
  
  // Check for Timestamp constructor name (works with modular API)
  if (obj?.constructor?.name === 'Timestamp') {
    return true
  }
  
  // Check for timestamp methods
  if (typeof obj?.toDate === 'function' && typeof obj?.toMillis === 'function') {
    return true
  }
  
  return false
}

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

  // Handle Firestore Timestamp (modular API)
  if (isFirestoreTimestamp(obj)) {
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

  // Handle Date - keep as Date object for Firestore to handle
  // Firestore SDK automatically converts Date to Timestamp on write
  if (obj instanceof Date) {
    return obj
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
 * Note: In modular API, Numeric is handled differently
 * For now, we return the number as-is
 */
export function toFirestoreNumeric(value: number | string): number | string {
  return typeof value === 'string' ? parseFloat(value) : value
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
  try {
    querySnapshot.forEach((doc: any) => {
      try {
        const rawData = doc.data()
        const convertedData = convertFromFirestore(rawData)
        docs.push({
          id: doc.id,
          ...convertedData,
        } as T)
      } catch (docError) {
        console.error(`Error converting document ${doc.id}:`, docError)
        // Skip problematic documents rather than crashing
      }
    })
  } catch (error) {
    console.error('Error iterating query snapshot:', error)
  }
  return docs
}

/**
 * Get server timestamp using modular API
 * Safe wrapper that works with both old and new code
 */
function getServerTimestamp(): any {
  try {
    // Try modular API first (current codebase uses this)
    const { serverTimestamp } = require('firebase-admin/firestore')
    return serverTimestamp()
  } catch (e) {
    // Fallback for compat API (shouldn't happen in this project)
    try {
      const admin = require('firebase-admin')
      return admin.firestore.FieldValue.serverTimestamp()
    } catch (e2) {
      // Last resort: return a marker object that Firestore will recognize
      return new Date()
    }
  }
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
    createdAt: getServerTimestamp(),
    updatedAt: getServerTimestamp(),
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
    updatedAt: getServerTimestamp(),
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
    deletedAt: getServerTimestamp(),
    deletedBy: userId,
    updatedAt: getServerTimestamp(),
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
    updatedAt: getServerTimestamp(),
    updatedBy: userId,
  }
}
