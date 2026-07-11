import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Firebase Admin SDK Singleton
 * Initializes Firebase Admin SDK once and exports the instances
 * Credentials are loaded from: backend/credentials/firebase-admin.json
 */

let adminInstance: any = null
let firestoreDb: any = null
let authService: any = null

/**
 * Initialize Firebase Admin SDK
 * This function is called once during server startup
 * Throws error if initialization fails
 */
export async function initializeFirebase(): Promise<void> {
  if (adminInstance) {
    console.log('⚠ Firebase already initialized, skipping...')
    return
  }

  try {
    // Load service account credentials
    const credentialsPath = path.join(
      process.cwd(),
      'credentials',
      'firebase-admin.json'
    )

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

    // Initialize Firebase Admin
    adminInstance = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    })

    // Get Firestore and Auth instances
    firestoreDb = admin.firestore()
    authService = admin.auth()

    console.log('✓ Firebase Admin Initialized')
    console.log('✓ Firestore Connected')
    console.log('✓ Auth Initialized')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn('⚠ Firebase Initialization Failed:')
    console.warn(`  ${errorMessage}`)
    console.warn('ℹ Firebase features will be disabled. Check credentials and try again.')
  }
}

/**
 * Get Firebase Admin instance
 * Ensures Firebase is initialized before returning
 */
export function getAdmin(): any {
  if (!adminInstance) {
    throw new Error(
      'Firebase Admin SDK not initialized. Call initializeFirebase() first.'
    )
  }
  return adminInstance
}

/**
 * Get Firestore instance
 * Ensures Firebase is initialized before returning
 */
export function getFirestore(): any {
  if (!firestoreDb) {
    throw new Error(
      'Firestore not initialized. Call initializeFirebase() first.'
    )
  }
  return firestoreDb
}

/**
 * Get Firebase Auth instance
 * Ensures Firebase is initialized before returning
 */
export function getAuth(): any {
  if (!authService) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebase() first.')
  }
  return authService
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized(): boolean {
  return adminInstance !== null && firestoreDb !== null && authService !== null
}

/**
 * Get Firebase initialization status for health checks
 */
export async function getFirebaseStatus(): Promise<{
  firebase: string
  firestore: string
}> {
  try {
    if (!firestoreDb) {
      return {
        firebase: 'disconnected',
        firestore: 'disconnected',
      }
    }

    // Test Firestore connection with a simple read
    await firestoreDb.collection('_health_check').limit(1).get()

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
