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
    console.log('⚠ Firebase already initialized, skipping...')
    return
  }

  // If initialization is in progress, wait for it to complete
  if (globalThis.firebaseGlobal.initializationPromise) {
    console.log('⏳ Firebase initialization in progress, waiting...')
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

      console.log(`📍 Credentials path: ${credentialsPath}`)
      console.log(`📍 Credentials exist: ${fs.existsSync(credentialsPath)}`)
      console.log(`📍 admin module type: ${typeof admin}`)
      console.log(`📍 admin.credential type: ${typeof admin.credential}`)
      console.log(`📍 admin.credential value: ${admin.credential}`)

      if (!fs.existsSync(credentialsPath)) {
        console.warn(
          `⚠ Firebase credentials not found at: ${credentialsPath}`
        )
        console.warn('ℹ Firebase features will be disabled. Add firebase-admin.json to enable.')
        return
      }

      const serviceAccount = JSON.parse(
        fs.readFileSync(credentialsPath, 'utf-8')
      )

      console.log(`📍 Service account loaded: ${serviceAccount ? 'yes' : 'no'}`)
      console.log(`📍 About to initialize Firebase...`)

      // Initialize Firebase Admin
      globalThis.firebaseGlobal.adminInstance = initializeApp({
        credential: cert(serviceAccount as admin.ServiceAccount),
      })

      console.log(`📍 Firebase initialized successfully`)

      // Get Firestore and Auth instances
      globalThis.firebaseGlobal.firestoreDb = firebaseGetFirestore(globalThis.firebaseGlobal.adminInstance)
      globalThis.firebaseGlobal.authService = firebaseGetAuth(globalThis.firebaseGlobal.adminInstance)

      console.log('✓ Firebase Admin Initialized')
      console.log('✓ Firestore Connected')
      console.log('✓ Auth Initialized')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn('⚠ Firebase Initialization Failed:')
      console.warn(`  ${errorMessage}`)
      console.warn('ℹ Firebase features will be disabled. Check credentials and try again.')
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
 * Get Firestore instance
 * Ensures Firebase is initialized before returning
 */
export function getFirestore(): any {
  if (!globalThis.firebaseGlobal.firestoreDb) {
    throw new Error(
      'Firestore not initialized. Call initializeFirebase() first.'
    )
  }
  return globalThis.firebaseGlobal.firestoreDb
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
