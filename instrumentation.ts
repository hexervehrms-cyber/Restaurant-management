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
    try {
      // Import Firebase initialization from backend config
      const { initializeFirebase, isFirebaseInitialized } = await import(
        './backend/src/config/firebase'
      )

      // Initialize Firebase if not already initialized
      if (!isFirebaseInitialized()) {
        await initializeFirebase()
      }
    } catch (error) {
      // Log errors but don't crash during build
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to initialize Firebase in instrumentation hook:', error)
      }
    }
  }
}
