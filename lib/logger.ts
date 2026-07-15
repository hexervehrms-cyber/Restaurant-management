/**
 * Centralized Logger Utility
 * 
 * Provides configurable logging based on LOG_LEVEL environment variable.
 * 
 * LOG_LEVEL Values (in order of verbosity):
 * - error: Only errors (default in production)
 * - warn: Errors and warnings (default in development)
 * - info: Errors, warnings, and info messages
 * - debug: All messages including debug info
 * 
 * Usage:
 *   logger.error('Error message', { context: data })
 *   logger.warn('Warning message')
 *   logger.info('Info message')
 *   logger.debug('Debug message')
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: any
}

class Logger {
  private logLevel: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production'
    
    // Default to WARN in development, ERROR in production
    const envLogLevel = (process.env.LOG_LEVEL || (this.isDevelopment ? 'warn' : 'error')).toLowerCase()
    
    if (!['error', 'warn', 'info', 'debug'].includes(envLogLevel)) {
      this.logLevel = this.isDevelopment ? 'warn' : 'error'
    } else {
      this.logLevel = envLogLevel as LogLevel
    }
  }

  /**
   * Get numeric severity level for comparison
   */
  private getSeverity(level: LogLevel): number {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    }
    return levels[level]
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return this.getSeverity(level) <= this.getSeverity(this.logLevel)
  }

  /**
   * Format log message
   */
  private format(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString()
    
    if (context) {
      return `[${timestamp}] ${level.toUpperCase()}: ${message} ${JSON.stringify(context)}`
    }
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`
  }

  /**
   * Log error (always shown)
   */
  error(message: string, context?: any): void {
    if (this.shouldLog('error')) {
      const formatted = this.format('error', message, context)
      console.error(formatted)
    }
  }

  /**
   * Log warning (shown in warn+ levels)
   */
  warn(message: string, context?: any): void {
    if (this.shouldLog('warn')) {
      const formatted = this.format('warn', message, context)
      console.warn(formatted)
    }
  }

  /**
   * Log info (shown in info+ levels)
   */
  info(message: string, context?: any): void {
    if (this.shouldLog('info')) {
      const formatted = this.format('info', message, context)
      console.log(formatted)
    }
  }

  /**
   * Log debug (only shown in debug level)
   */
  debug(message: string, context?: any): void {
    if (this.shouldLog('debug')) {
      const formatted = this.format('debug', message, context)
      console.log(formatted)
    }
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel
  }

  /**
   * Set log level (useful for testing or dynamic changes)
   */
  setLogLevel(level: LogLevel): void {
    if (['error', 'warn', 'info', 'debug'].includes(level)) {
      this.logLevel = level
    }
  }
}

// Export singleton instance
export const logger = new Logger()

export default logger
