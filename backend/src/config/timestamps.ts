/**
 * Firestore Timestamp Helpers
 * Centralized timestamp utilities for consistent date handling
 * 
 * IMPORTANT: Uses modular Firebase Admin SDK
 * firebase-admin/firestore provides Timestamp class and serverTimestamp()
 */

import { serverTimestamp as firestoreServerTimestamp } from 'firebase-admin/firestore'

/**
 * Get current server timestamp
 * Always use this for creation/update times
 * 
 * Usage:
 *   createdAt: serverTimestamp()
 */
export function serverTimestamp(): any {
  return firestoreServerTimestamp()
}

/**
 * Create a new timestamp (current time)
 * Returns a Date object - Firestore converts it to Timestamp on write
 * 
 * Usage:
 *   const now = createTimestamp()
 */
export function createTimestamp(): Date {
  return new Date()
}

/**
 * Update timestamp (server time)
 * Used in update operations
 * 
 * Usage:
 *   update({ updatedAt: updateTimestamp() })
 */
export function updateTimestamp(): any {
  return firestoreServerTimestamp()
}

/**
 * Create timestamp from Date
 * 
 * Usage:
 *   const ts = dateToTimestamp(new Date())
 */
export function dateToTimestamp(date: Date): Date {
  return date
}

/**
 * Convert Firestore Timestamp to Date
 * Works with both modular API Timestamps and Date objects
 * 
 * Usage:
 *   const date = timestampToDate(doc.createdAt)
 */
export function timestampToDate(timestamp: any): Date {
  if (!timestamp) return null as any
  
  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp
  }
  
  // Firestore Timestamp (modular API) - check for methods
  if (typeof timestamp?.toDate === 'function') {
    return timestamp.toDate()
  }
  
  // Fallback
  return null as any
}

/**
 * Get timestamp from seconds since epoch
 * 
 * Usage:
 *   const ts = fromSeconds(1689270645)
 */
export function fromSeconds(seconds: number): Date {
  return new Date(seconds * 1000)
}

/**
 * Convert timestamp to milliseconds
 * 
 * Usage:
 *   const ms = toMillis(timestamp)
 */
export function toMillis(timestamp: any): number {
  if (!timestamp) return 0
  
  if (timestamp instanceof Date) {
    return timestamp.getTime()
  }
  
  // Firestore Timestamp with toMillis method
  if (typeof timestamp?.toMillis === 'function') {
    return timestamp.toMillis()
  }
  
  return 0
}


/**
 * Format timestamp for display
 * 
 * Usage:
 *   const formatted = formatTimestamp(timestamp)
 */
export function formatTimestamp(timestamp: any, locale: string = 'en-US'): string {
  const date = timestampToDate(timestamp)
  if (!date) return 'N/A'
  return date.toLocaleString(locale)
}

/**
 * Format timestamp as ISO string
 * 
 * Usage:
 *   const iso = formatTimestampISO(timestamp)
 */
export function formatTimestampISO(timestamp: any): string {
  const date = timestampToDate(timestamp)
  if (!date) return ''
  return date.toISOString()
}

/**
 * Get time difference in milliseconds
 * 
 * Usage:
 *   const diff = getTimeDiffMs(start, end)
 */
export function getTimeDiffMs(start: any, end: any): number {
  const startMs = toMillis(start)
  const endMs = toMillis(end)
  return endMs - startMs
}

/**
 * Get time difference in seconds
 * 
 * Usage:
 *   const diff = getTimeDiffSeconds(start, end)
 */
export function getTimeDiffSeconds(start: any, end: any): number {
  return Math.floor(getTimeDiffMs(start, end) / 1000)
}

/**
 * Get time difference in days
 * 
 * Usage:
 *   const diff = getTimeDiffDays(start, end)
 */
export function getTimeDiffDays(start: any, end: any): number {
  return Math.floor(getTimeDiffMs(start, end) / (1000 * 60 * 60 * 24))
}

/**
 * Check if timestamp is in the past
 * 
 * Usage:
 *   if (isPast(timestamp)) { ... }
 */
export function isPast(timestamp: any): boolean {
  const now = toMillis(new Date())
  const time = toMillis(timestamp)
  return time < now
}

/**
 * Check if timestamp is in the future
 * 
 * Usage:
 *   if (isFuture(timestamp)) { ... }
 */
export function isFuture(timestamp: any): boolean {
  const now = toMillis(new Date())
  const time = toMillis(timestamp)
  return time > now
}

/**
 * Check if timestamp is today
 * 
 * Usage:
 *   if (isToday(timestamp)) { ... }
 */
export function isToday(timestamp: any): boolean {
  const date = timestampToDate(timestamp)
  if (!date) return false

  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Get start of day as timestamp
 * 
 * Usage:
 *   const start = getStartOfDay()
 */
export function getStartOfDay(date?: Date): Date {
  const d = date || new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

/**
 * Get end of day as timestamp
 * 
 * Usage:
 *   const end = getEndOfDay()
 */
export function getEndOfDay(date?: Date): Date {
  const d = date || new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

/**
 * Get start of month as timestamp
 * 
 * Usage:
 *   const start = getStartOfMonth()
 */
export function getStartOfMonth(date?: Date): Date {
  const d = date || new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

/**
 * Get end of month as timestamp
 * 
 * Usage:
 *   const end = getEndOfMonth()
 */
export function getEndOfMonth(date?: Date): Date {
  const d = date || new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}
