/**
 * Dashboard Status Service
 * Handles restaurant operational status logic
 * 
 * ARCHITECTURE:
 * - Determines effective restaurant status based on:
 *   1. Manual override (if active)
 *   2. Operating hours calculation (if no override)
 *   3. Rush hour detection (if applicable)
 * 
 * Pattern: Service → Repository → Firestore
 */

import { TenantContext } from '@/api/middleware/tenant'
import { RestaurantSettingsRepository, OperationalStatus, RestaurantSettingsDocument } from '@/backend/src/repositories/RestaurantSettingsRepository'

export interface RestaurantStatusResponse {
  operationalStatus: OperationalStatus
  isOpen: boolean
  openingTime: string | null
  closingTime: string | null
  currentTime: string
  timezone: string
  hasManualOverride: boolean
  overrideExpiresAt?: string | null
}

/**
 * Parse operating hours from settings
 * Returns { openingTime, closingTime } for the current day
 */
function parseOperatingHours(
  operatingHours: Record<string, any> | undefined | null,
  timezone: string
): { openingTime: string | null; closingTime: string | null } {
  if (!operatingHours) {
    return { openingTime: null, closingTime: null }
  }

  try {
    // Get current day name (0=Sunday, 1=Monday, etc.)
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', { 
      weekday: 'long',
      timeZone: timezone 
    })
    const dayName = formatter.format(now).toLowerCase()

    const dayHours = operatingHours[dayName]
    
    if (!dayHours || dayHours.closed) {
      return { openingTime: null, closingTime: null }
    }

    return {
      openingTime: dayHours.openingTime || null,
      closingTime: dayHours.closingTime || null,
    }
  } catch (error) {
    console.error('Error parsing operating hours:', error)
    return { openingTime: null, closingTime: null }
  }
}

/**
 * Check if current time falls within business hours
 */
function isWithinBusinessHours(
  openingTime: string | null,
  closingTime: string | null,
  timezone: string
): boolean {
  if (!openingTime || !closingTime) {
    return false
  }

  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    })
    const currentTimeStr = formatter.format(now).replace(':', '').trim()
    
    // Parse time strings (HH:MM format)
    const openParts = openingTime.split(':')
    const closeParts = closingTime.split(':')
    
    const openMinutes = parseInt(openParts[0]) * 60 + parseInt(openParts[1])
    const closeMinutes = parseInt(closeParts[0]) * 60 + parseInt(closeParts[1])
    const currentMinutes = parseInt(currentTimeStr.substring(0, 2)) * 60 + parseInt(currentTimeStr.substring(2, 4))

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes
  } catch (error) {
    console.error('Error checking business hours:', error)
    return false
  }
}

/**
 * Get current time as formatted string in restaurant's timezone
 */
function getCurrentTime(timezone: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: timezone,
    })
    return formatter.format(now)
  } catch (error) {
    console.error('Error formatting current time:', error)
    return new Date().toLocaleTimeString()
  }
}

/**
 * Determine if rush hour is active
 * (Placeholder for future rush hour scheduling)
 */
function isRushHourActive(
  settings: RestaurantSettingsDocument | null,
  timezone: string
): boolean {
  if (!settings || !settings.metadata?.rushHourConfig) {
    return false
  }

  try {
    const rushConfig = settings.metadata.rushHourConfig
    if (!rushConfig.enabled) {
      return false
    }

    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    })
    const currentTimeStr = formatter.format(now)

    // Parse time strings
    const [currentHour, currentMin] = currentTimeStr.split(':').map(Number)
    const currentMinutes = currentHour * 60 + currentMin

    const rushHourSlots = rushConfig.slots || []
    for (const slot of rushHourSlots) {
      const [startHour, startMin] = slot.start.split(':').map(Number)
      const [endHour, endMin] = slot.end.split(':').map(Number)
      
      const slotStart = startHour * 60 + startMin
      const slotEnd = endHour * 60 + endMin

      if (currentMinutes >= slotStart && currentMinutes < slotEnd) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error checking rush hour:', error)
    return false
  }
}

/**
 * Get restaurant operational status
 * Determines if restaurant is OPEN, CLOSED, or in RUSH_HOUR
 */
export async function getRestaurantStatus(
  branchId: string,
  restaurantId: string,
  tenantContext: TenantContext
): Promise<RestaurantStatusResponse> {
  try {
    const settingsRepo = new RestaurantSettingsRepository()
    const settings = await settingsRepo.findByRestaurant(restaurantId)

    if (!settings) {
      return {
        operationalStatus: 'CLOSED',
        isOpen: false,
        openingTime: null,
        closingTime: null,
        currentTime: getCurrentTime('UTC'),
        timezone: 'UTC',
        hasManualOverride: false,
      }
    }

    const timezone = settings.timezone || 'UTC'
    const currentTime = getCurrentTime(timezone)

    // Check for active manual override
    if (settings.operationalStatusOverride && settings.operationalStatusOverrideUntil) {
      const now = new Date()
      if (now < settings.operationalStatusOverrideUntil) {
        const { openingTime, closingTime } = parseOperatingHours(
          settings.operatingHours,
          timezone
        )

        return {
          operationalStatus: settings.operationalStatusOverride,
          isOpen: settings.operationalStatusOverride === 'OPEN' || settings.operationalStatusOverride === 'RUSH_HOUR',
          openingTime,
          closingTime,
          currentTime,
          timezone,
          hasManualOverride: true,
          overrideExpiresAt: settings.operationalStatusOverrideUntil.toISOString(),
        }
      }
    }

    // Parse operating hours for current day
    const { openingTime, closingTime } = parseOperatingHours(
      settings.operatingHours,
      timezone
    )

    // Determine status based on business hours
    let operationalStatus: OperationalStatus = 'CLOSED'
    let isOpen = false

    if (openingTime && closingTime) {
      if (isWithinBusinessHours(openingTime, closingTime, timezone)) {
        // Check if rush hour is active
        if (isRushHourActive(settings, timezone)) {
          operationalStatus = 'RUSH_HOUR'
        } else {
          operationalStatus = 'OPEN'
        }
        isOpen = true
      }
    }

    // Override with stored status if no hours defined
    if (!openingTime && !closingTime && settings.operationalStatus) {
      operationalStatus = settings.operationalStatus
      isOpen = operationalStatus === 'OPEN' || operationalStatus === 'RUSH_HOUR'
    }

    return {
      operationalStatus,
      isOpen,
      openingTime,
      closingTime,
      currentTime,
      timezone,
      hasManualOverride: false,
    }
  } catch (error) {
    console.error('Error getting restaurant status:', error)
    return {
      operationalStatus: 'CLOSED',
      isOpen: false,
      openingTime: null,
      closingTime: null,
      currentTime: getCurrentTime('UTC'),
      timezone: 'UTC',
      hasManualOverride: false,
    }
  }
}

/**
 * Update restaurant operational status
 * Optionally set a temporary override with duration
 * 
 * @param restaurantId - Restaurant ID
 * @param status - New operational status
 * @param userId - User making the change
 * @param tenantContext - Tenant context
 * @param overrideDurationMinutes - Optional: how long to override (in minutes). Must be 5-1440.
 * @returns Updated status response
 * 
 * VALIDATION:
 * - Duration must be between 5 and 1440 minutes (5 minutes to 24 hours)
 * - Override expiration time is calculated and stored
 * - Override is automatically cleared when expiration time is reached
 */
export async function updateRestaurantStatus(
  restaurantId: string,
  status: OperationalStatus,
  userId: string,
  tenantContext: TenantContext,
  overrideDurationMinutes?: number
): Promise<RestaurantStatusResponse> {
  try {
    // Validate status
    if (!['OPEN', 'CLOSED', 'RUSH_HOUR'].includes(status)) {
      throw new Error(`Invalid operational status: ${status}`)
    }

    // Validate and constrain duration if provided
    if (overrideDurationMinutes !== undefined && overrideDurationMinutes !== null) {
      // Type check
      if (typeof overrideDurationMinutes !== 'number') {
        throw new Error('overrideDurationMinutes must be a number')
      }

      // Range validation
      if (overrideDurationMinutes < 5) {
        throw new Error('overrideDurationMinutes must be at least 5 minutes')
      }

      if (overrideDurationMinutes > 1440) {
        throw new Error('overrideDurationMinutes cannot exceed 1440 minutes (24 hours)')
      }

      // Integer validation
      if (!Number.isInteger(overrideDurationMinutes)) {
        throw new Error('overrideDurationMinutes must be an integer')
      }
    }

    const settingsRepo = new RestaurantSettingsRepository()
    
    // If duration provided, set override instead of permanent status
    if (overrideDurationMinutes && overrideDurationMinutes > 0) {
      // Calculate expiration timestamp
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + overrideDurationMinutes)

      // Verify expiration is in the future
      const now = new Date()
      if (expiresAt <= now) {
        throw new Error('Calculated expiration time is invalid')
      }

      await settingsRepo.setOperationalStatusOverride(
        restaurantId,
        status,
        overrideDurationMinutes,
        userId
      )
    } else {
      // Update status permanently (clear any existing override)
      await settingsRepo.updateOperationalStatus(restaurantId, status, userId)
    }

    // Get updated status
    const settings = await settingsRepo.findByRestaurant(restaurantId)
    if (!settings) {
      throw new Error('Settings not found after update')
    }

    const timezone = settings.timezone || 'UTC'
    const { openingTime, closingTime } = parseOperatingHours(
      settings.operatingHours,
      timezone
    )
    const currentTime = getCurrentTime(timezone)

    // Determine if override is active and not expired
    let hasManualOverride = false
    let overrideExpiresAt: string | undefined

    if (settings.operationalStatusOverride && settings.operationalStatusOverrideUntil) {
      const now = new Date()
      const expirationTime = new Date(settings.operationalStatusOverrideUntil)

      // Check if override has expired
      if (now < expirationTime) {
        hasManualOverride = true
        overrideExpiresAt = expirationTime.toISOString()
      } else {
        // Override has expired, clear it
        await settingsRepo.clearOperationalStatusOverride(restaurantId, userId)
      }
    }

    return {
      operationalStatus: status,
      isOpen: status === 'OPEN' || status === 'RUSH_HOUR',
      openingTime,
      closingTime,
      currentTime,
      timezone,
      hasManualOverride,
      overrideExpiresAt,
    }
  } catch (error) {
    console.error('Error updating restaurant status:', error)
    throw error
  }
}
