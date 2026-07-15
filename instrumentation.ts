/**
 * Next.js Instrumentation Hook
 * 
 * Runs on server startup before any routes are loaded.
 * This ensures Firebase is initialized globally before any API route tries to use Firestore.
 * 
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import Firebase initialization from backend config
    const { initializeFirebase, isFirebaseInitialized } = await import(
      './backend/src/config/firebase'
    )

    // Initialize Firebase if not already initialized
    if (!isFirebaseInitialized()) {
      console.log('🔄 Initializing Firebase from instrumentation hook...')
      await initializeFirebase()
      console.log('✓ Firebase initialized from instrumentation hook')
    }
  }
}
