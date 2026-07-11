import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

/**
 * Create and configure Express application
 * This is the main application instance with all middleware configured
 */
export function createApp(): Express {
  const app = express()

  // Security middleware
  app.use(helmet())

  // CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )

  // Request logging
  app.use(morgan('combined'))

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ limit: '10mb', extended: true }))

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'Restaurant Management Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    })
  })

  // Basic error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err)
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error',
        status: err.status || 500,
      },
    })
  })

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: {
        message: 'Not Found',
        path: req.path,
        status: 404,
      },
    })
  })

  return app
}
