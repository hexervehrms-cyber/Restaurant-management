/**
 * Firestore Timestamp Helpers
 * Centralized timestamp utilities for consistent date handling
 */

import * as admin from 'firebase-admin'

/**
 * Get current server timestamp
 * Always use this for creation/update times
 * 
 * Usage:
 *   createdAt: serverTimestamp()
 */
export function serverTimestamp(): admin.firestore.FieldValue {
  return admin.firestore.FieldValue.serverTimestamp()
}

/**
 * Create a new timestamp (current time)
 * For server-side operations
 * 
 * Usage:
 *   const now = createTimestamp()
 */
export function createTimestamp(): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.now()
}

/**
 * Update timestamp (server time)
 * Used in update operations
 * 
 * Usage:
 *   update({ updatedAt: updateTimestamp() })
 */
export function updateTimestamp(): admin.firestore.FieldValue {
  return admin.firestore.FieldValue.serverTimestamp()
}

/**
 * Create timestamp from Date
 * 
 * Usage:
 *   const ts = dateToTimestamp(new Date())
 */
export function dateToTimestamp(date: Date): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.fromDate(date)
}

/**
 * Convert Firestore Timestamp to Date
 * 
 * Usage:
 *   const date = timestampToDate(doc.createdAt)
 */
export function timestampToDate(timestamp: any): Date {
  if (!timestamp) return null as any
  if (timestamp instanceof admin.firestore.Timestamp) {
    return timestamp.toDate()
  }
  if (timestamp instanceof Date) {
    return timestamp
  }
  return null as any
}

/**
 * Get timestamp from seconds since epoch
 * 
 * Usage:
 *   const ts = fromSeconds(1689270645)
 */
export function fromSeconds(seconds: number): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.fromMillis(seconds * 1000)
}

/**
 * Convert timestamp to milliseconds
 * 
 * Usage:
 *   const ms = toMillis(timestamp)
 */
export function toMillis(timestamp: any): number {
  if (!timestamp) return 0
  if (timestamp instanceof admin.firestore.Timestamp) {
    return timestamp.toMillis()
  }
  if (timestamp instanceof Date) {
    return timestamp.getTime()
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
export function getStartOfDay(date?: Date): admin.firestore.Timestamp {
  const d = date || new Date()
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  return dateToTimestamp(start)
}

/**
 * Get end of day as timestamp
 * 
 * Usage:
 *   const end = getEndOfDay()
 */
export function getEndOfDay(date?: Date): admin.firestore.Timestamp {
  const d = date || new Date()
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
  return dateToTimestamp(end)
}

/**
 * Get start of month as timestamp
 * 
 * Usage:
 *   const start = getStartOfMonth()
 */
export function getStartOfMonth(date?: Date): admin.firestore.Timestamp {
  const d = date || new Date()
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
  return dateToTimestamp(start)
}

/**
 * Get end of month as timestamp
 * 
 * Usage:
 *   const end = getEndOfMonth()
 */
export function getEndOfMonth(date?: Date): admin.firestore.Timestamp {
  const d = date || new Date()
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
  return dateToTimestamp(end)
}
