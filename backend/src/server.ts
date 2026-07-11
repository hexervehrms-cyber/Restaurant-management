import { createApp } from './app'
import dotenv from 'dotenv'

/**
 * Load environment variables
 */
dotenv.config()

/**
 * Get port from environment or use default
 */
const PORT = process.env.PORT || 5000
const HOST = process.env.HOST || 'localhost'

/**
 * Create and start the Express server
 */
async function startServer() {
  try {
    // Create Express application
    const app = createApp()

    // Start listening
    app.listen(PORT, HOST as string, () => {
      console.log(`✓ Server running on http://${HOST}:${PORT}`)
      console.log(`✓ Health check: http://${HOST}:${PORT}/health`)
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()
