/**
 * Restaurant Status Utility Tests
 * 
 * Tests validation, formatting, and calculation functions
 */

import {
  formatDuration,
  isValidStatus,
  validateDuration,
  calculateMinutesUntilClosing,
  getNextOpeningTime,
  formatNextOpeningTime,
  canUserEditStatus,
  getStatusConfig,
  DURATION_CONSTRAINTS,
  OPERATIONAL_STATUSES,
} from '@/lib/utils/restaurant-status'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Restaurant Status Utilities', () => {
  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(formatDuration(30)).toBe('30m')
      expect(formatDuration(45)).toBe('45m')
    })

    it('should format hours only', () => {
      expect(formatDuration(60)).toBe('1h')
      expect(formatDuration(120)).toBe('2h')
    })

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m')
      expect(formatDuration(150)).toBe('2h 30m')
    })

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0m')
    })

    it('should handle negative', () => {
      expect(formatDuration(-30)).toBe('0m')
    })
  })

  describe('isValidStatus', () => {
    it('should validate OPEN', () => {
      expect(isValidStatus('OPEN')).toBe(true)
    })

    it('should validate CLOSED', () => {
      expect(isValidStatus('CLOSED')).toBe(true)
    })

    it('should validate RUSH_HOUR', () => {
      expect(isValidStatus('RUSH_HOUR')).toBe(true)
    })

    it('should reject invalid status', () => {
      expect(isValidStatus('INVALID')).toBe(false)
    })

    it('should reject non-string', () => {
      expect(isValidStatus(123)).toBe(false)
      expect(isValidStatus(null)).toBe(false)
      expect(isValidStatus(undefined)).toBe(false)
    })
  })

  describe('validateDuration', () => {
    it('should validate valid durations', () => {
      expect(validateDuration(5).valid).toBe(true)
      expect(validateDuration(60).valid).toBe(true)
      expect(validateDuration(1440).valid).toBe(true)
    })

    it('should reject non-number', () => {
      const result = validateDuration('60')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be a number')
    })

    it('should reject non-integer', () => {
      const result = validateDuration(30.5)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be an integer')
    })

    it('should reject duration below minimum', () => {
      const result = validateDuration(4)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('at least')
    })

    it('should reject duration above maximum', () => {
      const result = validateDuration(1441)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('cannot exceed')
    })

    it('should reject zero', () => {
      const result = validateDuration(0)
      expect(result.valid).toBe(false)
    })

    it('should reject negative', () => {
      const result = validateDuration(-60)
      expect(result.valid).toBe(false)
    })
  })

  describe('calculateMinutesUntilClosing', () => {
    it('should calculate minutes until closing time', () => {
      // Mock date to control time
      vi.useFakeTimers()
      const now = new Date('2024-01-15T15:30:00')
      vi.setSystemTime(now)

      const minutes = calculateMinutesUntilClosing('23:00')
      
      // 23:00 - 15:30 = 7.5 hours = 450 minutes
      expect(minutes).toBe(450)

      vi.useRealTimers()
    })

    it('should ensure minimum 15 minutes', () => {
      vi.useFakeTimers()
      const now = new Date('2024-01-15T22:50:00')
      vi.setSystemTime(now)

      const minutes = calculateMinutesUntilClosing('23:00')
      
      // 23:00 - 22:50 = 10 minutes, but minimum is 15
      expect(minutes).toBe(15)

      vi.useRealTimers()
    })

    it('should return null for invalid time format', () => {
      expect(calculateMinutesUntilClosing('invalid')).toBeNull()
      expect(calculateMinutesUntilClosing('')).toBeNull()
    })
  })

  describe('getNextOpeningTime', () => {
    it('should calculate next opening time later today', () => {
      vi.useFakeTimers()
      const now = new Date('2024-01-15T09:00:00')
      vi.setSystemTime(now)

      const result = getNextOpeningTime('10:00')
      
      expect(result).not.toBeNull()
      expect(result?.daysFromNow).toBe(0)
      expect(result?.time).toContain('10:00')

      vi.useRealTimers()
    })

    it('should calculate next opening time tomorrow', () => {
      vi.useFakeTimers()
      const now = new Date('2024-01-15T15:00:00')
      vi.setSystemTime(now)

      const result = getNextOpeningTime('10:00')
      
      expect(result).not.toBeNull()
      expect(result?.daysFromNow).toBe(1)

      vi.useRealTimers()
    })

    it('should return null for invalid time format', () => {
      expect(getNextOpeningTime('invalid')).toBeNull()
      expect(getNextOpeningTime('')).toBeNull()
    })
  })

  describe('formatNextOpeningTime', () => {
    it('should format opening time for today', () => {
      vi.useFakeTimers()
      const now = new Date('2024-01-15T09:00:00')
      vi.setSystemTime(now)

      const formatted = formatNextOpeningTime('10:00')
      
      expect(formatted).toContain('Today')
      expect(formatted).toContain('10:00')

      vi.useRealTimers()
    })

    it('should format opening time for tomorrow', () => {
      vi.useFakeTimers()
      const now = new Date('2024-01-15T15:00:00')
      vi.setSystemTime(now)

      const formatted = formatNextOpeningTime('10:00')
      
      expect(formatted).toContain('Tomorrow')

      vi.useRealTimers()
    })

    it('should format opening time for future days', () => {
      vi.useFakeTimers()
      const now = new Date('2024-01-13T15:00:00')
      vi.setSystemTime(now)

      const formatted = formatNextOpeningTime('10:00')
      
      expect(formatted).toContain('In')
      expect(formatted).toContain('days')

      vi.useRealTimers()
    })

    it('should return null for invalid time format', () => {
      expect(formatNextOpeningTime('invalid')).toBeNull()
      expect(formatNextOpeningTime('')).toBeNull()
    })
  })

  describe('canUserEditStatus', () => {
    it('should allow restaurant_owner', () => {
      expect(canUserEditStatus('restaurant_owner')).toBe(true)
    })

    it('should allow branch_manager', () => {
      expect(canUserEditStatus('branch_manager')).toBe(true)
    })

    it('should allow admin', () => {
      expect(canUserEditStatus('admin')).toBe(true)
    })

    it('should deny cashier', () => {
      expect(canUserEditStatus('cashier')).toBe(false)
    })

    it('should deny waiter', () => {
      expect(canUserEditStatus('waiter')).toBe(false)
    })

    it('should deny kitchen_staff', () => {
      expect(canUserEditStatus('kitchen_staff')).toBe(false)
    })

    it('should deny viewer', () => {
      expect(canUserEditStatus('viewer')).toBe(false)
    })

    it('should deny unknown role', () => {
      expect(canUserEditStatus('unknown')).toBe(false)
    })
  })

  describe('getStatusConfig', () => {
    it('should return config for OPEN', () => {
      const config = getStatusConfig('OPEN')
      
      expect(config).not.toBeNull()
      expect(config?.value).toBe('OPEN')
      expect(config?.label).toBe('Open')
      expect(config?.color).toContain('green')
    })

    it('should return config for RUSH_HOUR', () => {
      const config = getStatusConfig('RUSH_HOUR')
      
      expect(config).not.toBeNull()
      expect(config?.value).toBe('RUSH_HOUR')
      expect(config?.label).toBe('Rush Hour')
      expect(config?.color).toContain('amber')
    })

    it('should return config for CLOSED', () => {
      const config = getStatusConfig('CLOSED')
      
      expect(config).not.toBeNull()
      expect(config?.value).toBe('CLOSED')
      expect(config?.label).toBe('Closed')
      expect(config?.color).toContain('red')
    })

    it('should return null for invalid status', () => {
      expect(getStatusConfig('INVALID')).toBeNull()
    })

    it('should have all required properties', () => {
      const config = getStatusConfig('OPEN')
      
      expect(config).toHaveProperty('value')
      expect(config).toHaveProperty('label')
      expect(config).toHaveProperty('color')
      expect(config).toHaveProperty('bgColor')
      expect(config).toHaveProperty('dotColor')
      expect(config).toHaveProperty('description')
      expect(config).toHaveProperty('contextualInfo')
      expect(config).toHaveProperty('useCase')
      expect(config).toHaveProperty('impact')
    })
  })

  describe('Constants', () => {
    it('should have valid operational statuses', () => {
      expect(OPERATIONAL_STATUSES).toContain('OPEN')
      expect(OPERATIONAL_STATUSES).toContain('CLOSED')
      expect(OPERATIONAL_STATUSES).toContain('RUSH_HOUR')
      expect(OPERATIONAL_STATUSES.length).toBe(3)
    })

    it('should have correct duration constraints', () => {
      expect(DURATION_CONSTRAINTS.MIN_MINUTES).toBe(5)
      expect(DURATION_CONSTRAINTS.MAX_MINUTES).toBe(1440)
    })
  })
})
