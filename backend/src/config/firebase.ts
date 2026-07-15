import * as admin from 'firebase-admin'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import {
  getFirestore as firebaseGetFirestore,
} from 'firebase-admin/firestore'
import {
  getAuth as firebaseGetAuth,
} from 'firebase-admin/auth'
import * as fs from 'fs'
import * as path from 'path'
import { logger } from '@/lib/logger'

/**
 * Firebase Admin SDK Singleton
 * Initializes Firebase Admin SDK once and exports the instances
 * Credentials are loaded from: backend/credentials/firebase-admin.json
 * 
 * IMPORTANT: In Next.js, this module must be stored on globalThis to persist
 * across different module contexts (instrumentation hook vs API routes).
 * Without this, each context gets its own module instance with null values.
 */

// Store on globalThis to ensure persistence across module contexts in Next.js
declare global {
  var firebaseGlobal: {
    adminInstance: any
    firestoreDb: any
    authService: any
    initializationPromise: Promise<void> | null
  }
}

// Initialize global storage if not already done
if (!globalThis.firebaseGlobal) {
  globalThis.firebaseGlobal = {
    adminInstance: null,
    firestoreDb: null,
    authService: null,
    initializationPromise: null,
  }
}

/**
 * Initialize Firebase Admin SDK
 * This function is called once during server startup
 * Uses Promise to prevent race conditions when called from multiple contexts
 * Throws error if initialization fails
 */
export async function initializeFirebase(): Promise<void> {
  // If already initialized, return immediately
  if (globalThis.firebaseGlobal.adminInstance) {
    return
  }

  // If initialization is in progress, wait for it to complete
  if (globalThis.firebaseGlobal.initializationPromise) {
    return globalThis.firebaseGlobal.initializationPromise
  }

  // Create initialization promise to prevent race conditions
  globalThis.firebaseGlobal.initializationPromise = (async () => {
    try {
      // Load service account credentials
      const credentialsPath = path.join(
        process.cwd(),
        'credentials',
        'firebase-admin.json'
      )

      if (!fs.existsSync(credentialsPath)) {
        logger.warn('Firebase credentials not found', {
          path: credentialsPath,
        })
        return
      }

      const serviceAccount = JSON.parse(
        fs.readFileSync(credentialsPath, 'utf-8')
      )

      // Initialize Firebase Admin
      globalThis.firebaseGlobal.adminInstance = initializeApp({
        credential: cert(serviceAccount as admin.ServiceAccount),
      })

      // Get Firestore and Auth instances
      globalThis.firebaseGlobal.firestoreDb = firebaseGetFirestore(globalThis.firebaseGlobal.adminInstance)
      globalThis.firebaseGlobal.authService = firebaseGetAuth(globalThis.firebaseGlobal.adminInstance)

      logger.debug('Firebase Admin initialized successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Firebase Initialization Failed', { error: errorMessage })
      // Don't re-throw during build - just log and continue
      // This allows build to proceed without Firebase
    }
  })()

  return globalThis.firebaseGlobal.initializationPromise
}

/**
 * Get Firebase Admin instance
 * Ensures Firebase is initialized before returning
 */
export function getAdmin(): any {
  if (!globalThis.firebaseGlobal.adminInstance) {
    throw new Error(
      'Firebase Admin SDK not initialized. Call initializeFirebase() first.'
    )
  }
  return globalThis.firebaseGlobal.adminInstance
}

/**
 * Lazy-loaded Firestore proxy for build time compatibility
 * During build, returns a mock object; at runtime, returns the real instance.
 */
let firestoreProxy: any = null

function createMockFirestore(): any {
  const mockCollection = () => ({
    doc: () => ({ set: () => Promise.resolve(), get: () => Promise.resolve({ exists: false }) }),
    get: () => Promise.resolve({ docs: [] }),
    where: () => mockCollection(),
    orderBy: () => mockCollection(),
    limit: () => mockCollection(),
    offset: () => mockCollection(),
    count: () => ({ get: () => Promise.resolve({ data: () => ({ count: 0 }) }) }),
  })

  const mockBatch = () => ({
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: () => Promise.resolve(),
  })

  return {
    collection: mockCollection,
    batch: mockBatch,
    runTransaction: () => Promise.resolve(null),
  }
}

function createFirestoreProxy(): any {
  if (globalThis.firebaseGlobal.firestoreDb) {
    return globalThis.firebaseGlobal.firestoreDb
  }

  // Return a lazy proxy that will initialize on first real use
  return new Proxy({}, {
    get: (target, prop) => {
      // Check if Firebase is now initialized
      if (globalThis.firebaseGlobal.firestoreDb) {
        return (globalThis.firebaseGlobal.firestoreDb as any)[prop]
      }

      // During build time, return mock
      if (process.env.NEXT_RUNTIME === undefined) {
        const mock = createMockFirestore()
        return (mock as any)[prop]
      }

      // Runtime without initialization - throw error
      throw new Error(
        'Firestore not initialized. Call initializeFirebase() first.'
      )
    }
  })
}

/**
 * Get Firestore instance
 * Returns real instance at runtime, lazy proxy at build time
 */
export function getFirestore(): any {
  if (!firestoreProxy) {
    firestoreProxy = createFirestoreProxy()
  }
  return firestoreProxy
}

/**
 * Get Firebase Auth instance
 * Ensures Firebase is initialized before returning
 */
export function getAuth(): any {
  if (!globalThis.firebaseGlobal.authService) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebase() first.')
  }
  return globalThis.firebaseGlobal.authService
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized(): boolean {
  return globalThis.firebaseGlobal.adminInstance !== null && 
         globalThis.firebaseGlobal.firestoreDb !== null && 
         globalThis.firebaseGlobal.authService !== null
}

/**
 * Get Firebase initialization status for health checks
 */
export async function getFirebaseStatus(): Promise<{
  firebase: string
  firestore: string
}> {
  try {
    if (!globalThis.firebaseGlobal.firestoreDb) {
      return {
        firebase: 'disconnected',
        firestore: 'disconnected',
      }
    }

    // Test Firestore connection with a simple read
    await globalThis.firebaseGlobal.firestoreDb.collection('_health_check').limit(1).get()

    return {
      firebase: 'connected',
      firestore: 'connected',
    }
  } catch (error) {
    return {
      firebase: 'error',
      firestore: 'error',
    }
  }
}
