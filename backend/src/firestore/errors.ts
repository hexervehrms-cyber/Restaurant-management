/**
 * Firestore Error Handling
 * Centralized error mapping and handling for Firestore operations
 * Converts Firebase exceptions to application-level errors
 */

/**
 * Application error codes
 */
export enum FirestoreErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNAVAILABLE = 'UNAVAILABLE',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  FAILED_PRECONDITION = 'FAILED_PRECONDITION',
  ABORTED = 'ABORTED',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  DEADLINE_EXCEEDED = 'DEADLINE_EXCEEDED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Application error
 */
export class FirestoreError extends Error {
  constructor(
    public code: FirestoreErrorCode,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'FirestoreError'
  }

  /**
   * Get HTTP status code for this error
   */
  getHttpStatus(): number {
    switch (this.code) {
      case FirestoreErrorCode.NOT_FOUND:
        return 404
      case FirestoreErrorCode.ALREADY_EXISTS:
        return 409
      case FirestoreErrorCode.PERMISSION_DENIED:
      case FirestoreErrorCode.UNAUTHENTICATED:
        return 403
      case FirestoreErrorCode.INVALID_ARGUMENT:
      case FirestoreErrorCode.OUT_OF_RANGE:
        return 400
      case FirestoreErrorCode.UNAVAILABLE:
      case FirestoreErrorCode.RESOURCE_EXHAUSTED:
        return 503
      case FirestoreErrorCode.DEADLINE_EXCEEDED:
        return 504
      case FirestoreErrorCode.INTERNAL_ERROR:
      default:
        return 500
    }
  }

  /**
   * Convert to JSON for API response
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      status: this.getHttpStatus(),
    }
  }
}

/**
 * Map Firebase error to application error
 */
export function mapFirebaseError(error: any): FirestoreError {
  const message = error?.message || 'Unknown Firestore error'
  const firebaseCode = error?.code

  // Map Firebase error codes to application codes
  switch (firebaseCode) {
    case 'not-found':
      return new FirestoreError(FirestoreErrorCode.NOT_FOUND, 'Document not found', { firebaseCode })

    case 'already-exists':
      return new FirestoreError(FirestoreErrorCode.ALREADY_EXISTS, 'Document already exists', {
        firebaseCode,
      })

    case 'permission-denied':
      return new FirestoreError(FirestoreErrorCode.PERMISSION_DENIED, 'Permission denied', {
        firebaseCode,
      })

    case 'invalid-argument':
      return new FirestoreError(FirestoreErrorCode.INVALID_ARGUMENT, 'Invalid argument: ' + message, {
        firebaseCode,
      })

    case 'internal':
      return new FirestoreError(FirestoreErrorCode.INTERNAL_ERROR, 'Internal server error', {
        firebaseCode,
      })

    case 'unavailable':
      return new FirestoreError(FirestoreErrorCode.UNAVAILABLE, 'Service unavailable', {
        firebaseCode,
      })

    case 'unauthenticated':
      return new FirestoreError(FirestoreErrorCode.UNAUTHENTICATED, 'User not authenticated', {
        firebaseCode,
      })

    case 'resource-exhausted':
      return new FirestoreError(FirestoreErrorCode.RESOURCE_EXHAUSTED, 'Resource exhausted', {
        firebaseCode,
      })

    case 'failed-precondition':
      return new FirestoreError(FirestoreErrorCode.FAILED_PRECONDITION, 'Failed precondition', {
        firebaseCode,
      })

    case 'aborted':
      return new FirestoreError(FirestoreErrorCode.ABORTED, 'Operation aborted', { firebaseCode })

    case 'out-of-range':
      return new FirestoreError(FirestoreErrorCode.OUT_OF_RANGE, 'Value out of range', {
        firebaseCode,
      })

    case 'deadline-exceeded':
      return new FirestoreError(FirestoreErrorCode.DEADLINE_EXCEEDED, 'Operation deadline exceeded', {
        firebaseCode,
      })

    default:
      return new FirestoreError(
        FirestoreErrorCode.UNKNOWN,
        message || 'Unknown Firestore error',
        { firebaseCode, originalError: error }
      )
  }
}

/**
 * Safe operation wrapper with error handling
 * 
 * Usage:
 *   const result = await safeFirestoreOperation(async () => {
 *     return await db.collection('orders').doc(id).get()
 *   })
 */
export async function safeFirestoreOperation<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ success: boolean; data?: T; error?: FirestoreError }> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    const appError = mapFirebaseError(error)
    if (context) {
      appError.message = `${context}: ${appError.message}`
    }
    console.error('[Firestore Error]', appError.toJSON())
    return { success: false, error: appError }
  }
}

/**
 * Check if error is a specific type
 */
export function isFirestoreError(error: any, code: FirestoreErrorCode): boolean {
  return error instanceof FirestoreError && error.code === code
}

/**
 * Check if error is NOT_FOUND
 */
export function isNotFound(error: any): boolean {
  return isFirestoreError(error, FirestoreErrorCode.NOT_FOUND)
}

/**
 * Check if error is PERMISSION_DENIED
 */
export function isPermissionDenied(error: any): boolean {
  return isFirestoreError(error, FirestoreErrorCode.PERMISSION_DENIED)
}

/**
 * Check if error is ALREADY_EXISTS
 */
export function isAlreadyExists(error: any): boolean {
  return isFirestoreError(error, FirestoreErrorCode.ALREADY_EXISTS)
}

/**
 * Check if error is retryable (temporary)
 */
export function isRetryable(error: any): boolean {
  if (!(error instanceof FirestoreError)) return false

  return (
    error.code === FirestoreErrorCode.UNAVAILABLE ||
    error.code === FirestoreErrorCode.RESOURCE_EXHAUSTED ||
    error.code === FirestoreErrorCode.DEADLINE_EXCEEDED ||
    error.code === FirestoreErrorCode.ABORTED
  )
}

/**
 * Retry operation with exponential backoff
 * 
 * Usage:
 *   const result = await retryFirestoreOperation(
 *     async () => await db.collection('orders').get(),
 *     { maxRetries: 3, initialDelayMs: 100 }
 *   )
 */
export async function retryFirestoreOperation<T>(
  operation: () => Promise<T>,
  options?: { maxRetries?: number; initialDelayMs?: number; context?: string }
): Promise<T> {
  const maxRetries = options?.maxRetries || 3
  const initialDelayMs = options?.initialDelayMs || 100
  let lastError: FirestoreError | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = mapFirebaseError(error)

      if (!isRetryable(lastError) || attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff
      const delay = initialDelayMs * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
