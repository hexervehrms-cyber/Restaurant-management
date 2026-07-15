/**
 * Reusable Restaurant Status Utilities
 * 
 * Centralizes restaurant status logic for use across the application.
 * Provides constants, type definitions, and utility functions.
 */

export type OperationalStatus = 'OPEN' | 'CLOSED' | 'RUSH_HOUR'

export const OPERATIONAL_STATUSES = ['OPEN', 'CLOSED', 'RUSH_HOUR'] as const

/**
 * Status configuration with UI properties
 */
export interface StatusConfig {
  value: OperationalStatus
  label: string
  color: string
  bgColor: string
  dotColor: string
  description: string
  contextualInfo: string
  useCase: string
  impact: string
}

export const STATUS_CONFIGS: Record<OperationalStatus, Omit<StatusConfig, 'value'>> = {
  OPEN: {
    label: 'Open',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 border-green-500/30',
    dotColor: 'bg-green-500',
    description: 'Restaurant is open for orders',
    contextualInfo: 'Customers can place orders and dine in. Kitchen is fully operational.',
    useCase: 'Normal operations during business hours',
    impact: 'Orders are accepted, delivery enabled, full menu available',
  },
  RUSH_HOUR: {
    label: 'Rush Hour',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    dotColor: 'bg-amber-500',
    description: 'High demand, longer wait times',
    contextualInfo: 'Kitchen is at capacity. Orders have extended preparation times.',
    useCase: 'Peak hours (lunch, dinner) when kitchen is overwhelmed',
    impact: 'Alerts customers of longer waits, manages expectations',
  },
  CLOSED: {
    label: 'Closed',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 border-red-500/30',
    dotColor: 'bg-red-500',
    description: 'Restaurant is closed',
    contextualInfo: 'No new orders are being accepted. Kitchen is inactive.',
    useCase: 'Off-hours, holidays, emergency closures, maintenance',
    impact: 'Orders blocked, customers notified, existing orders may be paused',
  },
}

/**
 * Duration presets for manual overrides
 */
export interface DurationPreset {
  label: string
  minutes: number
  description?: string
}

export const DURATION_PRESETS: DurationPreset[] = [
  { label: '30 Minutes', minutes: 30, description: 'Brief operational issue' },
  { label: '1 Hour', minutes: 60, description: 'Standard delay' },
  { label: '2 Hours', minutes: 120, description: 'Extended delay' },
]

/**
 * Validation constants
 */
export const DURATION_CONSTRAINTS = {
  MIN_MINUTES: 5,
  MAX_MINUTES: 1440, // 24 hours
  DEFAULT_MIN_DESCRIPTION: 'Must be at least 5 minutes',
  DEFAULT_MAX_DESCRIPTION: 'Cannot exceed 24 hours',
}

/**
 * Convert minutes to human-readable duration
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "1h 30m", "45m")
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${mins}m`
  }
}

/**
 * Get status configuration with all UI properties
 * @param status - Operational status
 * @returns Full status configuration or null if invalid
 */
export function getStatusConfig(status: string): StatusConfig | null {
  if (!OPERATIONAL_STATUSES.includes(status as OperationalStatus)) {
    return null
  }

  const statusKey = status as OperationalStatus
  return {
    value: statusKey,
    ...STATUS_CONFIGS[statusKey],
  }
}

/**
 * Validate operational status
 * @param status - Status to validate
 * @returns true if valid, false otherwise
 */
export function isValidStatus(status: unknown): status is OperationalStatus {
  return typeof status === 'string' && OPERATIONAL_STATUSES.includes(status as OperationalStatus)
}

/**
 * Validate duration in minutes
 * @param minutes - Duration to validate
 * @returns { valid: boolean; error?: string }
 */
export function validateDuration(minutes: unknown): { valid: boolean; error?: string } {
  // Type check
  if (typeof minutes !== 'number') {
    return { valid: false, error: 'Duration must be a number' }
  }

  // Integer check
  if (!Number.isInteger(minutes)) {
    return { valid: false, error: 'Duration must be an integer' }
  }

  // Min check
  if (minutes < DURATION_CONSTRAINTS.MIN_MINUTES) {
    return {
      valid: false,
      error: `Duration must be at least ${DURATION_CONSTRAINTS.MIN_MINUTES} minutes`,
    }
  }

  // Max check
  if (minutes > DURATION_CONSTRAINTS.MAX_MINUTES) {
    return {
      valid: false,
      error: `Duration cannot exceed ${DURATION_CONSTRAINTS.MAX_MINUTES} minutes (24 hours)`,
    }
  }

  return { valid: true }
}

/**
 * Calculate minutes until closing time
 * @param closingTime - Closing time in HH:MM format
 * @returns Minutes until closing, or null if invalid
 */
export function calculateMinutesUntilClosing(closingTime: string): number | null {
  try {
    const [hours, minutes] = closingTime.split(':').map(Number)
    const closingDate = new Date()
    closingDate.setHours(hours, minutes, 0, 0)

    const now = new Date()
    const diff = closingDate.getTime() - now.getTime()

    // Return minutes, ensure at least 15 minutes
    return Math.max(15, Math.floor(diff / 60000))
  } catch {
    return null
  }
}

/**
 * Calculate next opening time from opening time
 * @param openingTime - Opening time in HH:MM format
 * @returns { time: string; daysFromNow: number } or null if invalid
 */
export function getNextOpeningTime(openingTime: string): { time: string; daysFromNow: number } | null {
  try {
    const now = new Date()
    const [openHour, openMin] = openingTime.split(':').map(Number)

    let nextOpening = new Date()
    nextOpening.setHours(openHour, openMin, 0, 0)

    // If opening time has already passed today, schedule for tomorrow
    if (nextOpening <= now) {
      nextOpening.setDate(nextOpening.getDate() + 1)
    }

    const daysFromNow = Math.floor((nextOpening.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      time: nextOpening.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      daysFromNow,
    }
  } catch {
    return null
  }
}

/**
 * Format next opening time as readable text
 * @param openingTime - Opening time in HH:MM format
 * @returns Formatted string (e.g., "Tomorrow at 10:00 AM") or null
 */
export function formatNextOpeningTime(openingTime: string): string | null {
  const result = getNextOpeningTime(openingTime)
  if (!result) return null

  const { time, daysFromNow } = result

  if (daysFromNow === 0) {
    return `Today at ${time}`
  } else if (daysFromNow === 1) {
    return `Tomorrow at ${time}`
  } else {
    return `In ${daysFromNow} days at ${time}`
  }
}

/**
 * Get permission description for error messages
 * @returns Permission requirement description
 */
export function getPermissionRequirementDescription(): string {
  return 'Only restaurant owners, branch managers, and administrators can modify operational status.'
}

/**
 * Get list of allowed roles for status updates
 */
export const STATUS_EDITOR_ROLES = ['restaurant_owner', 'branch_manager', 'admin'] as const

/**
 * Check if user role can edit status
 * @param role - User role
 * @returns true if user can edit status
 */
export function canUserEditStatus(role: string): boolean {
  return STATUS_EDITOR_ROLES.includes(role as any)
}
