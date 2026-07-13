/**
 * Firestore Infrastructure Index
 * Central re-export point for all Firestore utilities
 * 
 * Usage:
 *   import { COLLECTIONS, serverTimestamp, BaseRepository } from './firestore'
 */

// ============= CONFIGURATION =============
export * from './collections'
export * from './constants'

// ============= UTILITIES =============
export * from './timestamps'
export * from './references'
export * from './converters'

// ============= ERROR HANDLING & VALIDATION =============
export * from './errors'
export * from './validators'

// ============= BASE TYPES =============
export * from '../types/firestore'

// ============= REPOSITORIES =============
export { BaseRepository } from '../repositories/BaseRepository'
