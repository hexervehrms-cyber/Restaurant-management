/**
 * Restaurant Status API Tests
 * 
 * Tests backend validation, permissions, and business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH } from '@/app/api/dashboard/status/route'
import { validateStatusUpdatePermission } from '@/api/middleware/auth'
import { getRestaurantStatus, updateRestaurantStatus } from '@/api/services/dashboard-status.service'

// Mock dependencies
vi.mock('@/api/middleware/auth')
vi.mock('@/api/services/dashboard-status.service')
vi.mock('@/api/middleware/tenant')

describe('Restaurant Status API', () => {
  describe('GET /api/dashboard/status', () => {
    it('should require branchId and restaurantId parameters', async () => {
      const request = new NextRequest('http://localhost/api/dashboard/status')
      const response = await GET(request)
      
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return restaurant status on success', async () => {
      vi.mocked(getRestaurantStatus).mockResolvedValue({
        operationalStatus: 'OPEN',
        isOpen: true,
        openingTime: '10:00',
        closingTime: '23:00',
        currentTime: '15:30',
        timezone: 'UTC',
        hasManualOverride: false,
      })

      const request = new NextRequest(
        'http://localhost/api/dashboard/status?branchId=b123&restaurantId=r123'
      )
      const response = await GET(request)
      
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.operationalStatus).toBe('OPEN')
    })
  })

  describe('PATCH /api/dashboard/status', () => {
    it('should validate required parameters', async () => {
      const request = new NextRequest('http://localhost/api/dashboard/status', {
        method: 'PATCH',
        body: JSON.stringify({}),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should validate operational status value', async () => {
      const request = new NextRequest('http://localhost/api/dashboard/status', {
        method: 'PATCH',
        body: JSON.stringify({
          branchId: 'b123',
          restaurantId: 'r123',
          operationalStatus: 'INVALID',
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Invalid operationalStatus')
    })

    it('should validate duration type', async () => {
      const request = new NextRequest('http://localhost/api/dashboard/status', {
        method: 'PATCH',
        body: JSON.stringify({
          branchId: 'b123',
          restaurantId: 'r123',
          operationalStatus: 'OPEN',
          overrideDurationMinutes: 'not-a-number',
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('must be a number')
    })

    it('should validate duration is integer', async () => {
      const request = new NextRequest('http://localhost/api/dashboard/status', {
        method: 'PATCH',
        body: JSON.stringify({
          branchId: 'b123',
          restaurantId: 'r123',
          operationalStatus: 'OPEN',
          overrideDurationMinutes: 30.5,
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('must be an integer')
    })

    it('should validate minimum duration (5 minutes)', async () => {
      const request = new NextRequest('http://localhost/api/dashboard/status', {
        method: 'PATCH',
        body: JSON.stringify({
          branchId: 'b123',
          restaurantId: 'r123',
          operationalStatus: 'CLOSED',
          overrideDurationMinutes: 4,
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('at least 5 minutes')
    })

    it('should validate maximum duration (1440 minutes)', async () => {
      const request = new NextRequest('http://localhost/api/dashboard/status', {
        method: 'PATCH',
        body: JSON.stringify({
          branchId: 'b123',
          restaurantId: 'r123',
          operationalStatus: 'CLOSED',
          overrideDurationMinutes: 1441,
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('cannot exceed 1440 minutes')
    })

    it('should return 403 Forbidden for unauthorized users', async () => {
      vi.mocked(validateStatusUpdatePermission).mockImplementation(() => {
        const error = new Error('Permission denied')
        ;(error as any).code = 'PERMISSION_DENIED'
        throw error
      })

      const request = new NextRequest('http://localhost/api/dashboard/status', {
        method: 'PATCH',
        body: JSON.stringify({
          branchId: 'b123',
          restaurantId: 'r123',
          operationalStatus: 'OPEN',
        }),
      })

      const response = await PATCH(request)
      expect(response.status).toBe(403)
    })

    it('should accept valid override duration', async () => {
      vi.mocked(validateStatusUpdatePermission).mockReturnValue(undefined)
      vi.mocked(updateRestaurantStatus).mockResolvedValue({
        operationalStatus: 'CLOSED',
        isOpen: false,
        openingTime: '10:00',
        closingTime: '23:00',
        currentTime: '15:30',
        timezone: 'UTC',
        hasManualOverride: true,
        overrideExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      })

      const request = new NextRequest('http://localhost/api/dashboard/status', {
        method: 'PATCH',
        body: JSON.stringify({
          branchId: 'b123',
          restaurantId: 'r123',
          operationalStatus: 'CLOSED',
          overrideDurationMinutes: 60,
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.hasManualOverride).toBe(true)
    })

    it('should accept status update without duration', async () => {
      vi.mocked(validateStatusUpdatePermission).mockReturnValue(undefined)
      vi.mocked(updateRestaurantStatus).mockResolvedValue({
        operationalStatus: 'OPEN',
        isOpen: true,
        openingTime: '10:00',
        closingTime: '23:00',
        currentTime: '15:30',
        timezone: 'UTC',
        hasManualOverride: false,
      })

      const request = new NextRequest('http://localhost/api/dashboard/status', {
        method: 'PATCH',
        body: JSON.stringify({
          branchId: 'b123',
          restaurantId: 'r123',
          operationalStatus: 'OPEN',
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.hasManualOverride).toBe(false)
    })

    it('should handle all valid statuses', async () => {
      const validStatuses = ['OPEN', 'CLOSED', 'RUSH_HOUR']

      for (const status of validStatuses) {
        vi.mocked(validateStatusUpdatePermission).mockReturnValue(undefined)
        vi.mocked(updateRestaurantStatus).mockResolvedValue({
          operationalStatus: status as any,
          isOpen: status !== 'CLOSED',
          openingTime: '10:00',
          closingTime: '23:00',
          currentTime: '15:30',
          timezone: 'UTC',
          hasManualOverride: false,
        })

        const request = new NextRequest('http://localhost/api/dashboard/status', {
          method: 'PATCH',
          body: JSON.stringify({
            branchId: 'b123',
            restaurantId: 'r123',
            operationalStatus: status,
          }),
        })

        const response = await PATCH(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.operationalStatus).toBe(status)
      }
    })

    it('should validate null duration as optional', async () => {
      vi.mocked(validateStatusUpdatePermission).mockReturnValue(undefined)
      vi.mocked(updateRestaurantStatus).mockResolvedValue({
        operationalStatus: 'OPEN',
        isOpen: true,
        openingTime: '10:00',
        closingTime: '23:00',
        currentTime: '15:30',
        timezone: 'UTC',
        hasManualOverride: false,
      })

      const request = new NextRequest('http://localhost/api/dashboard/status', {
        method: 'PATCH',
        body: JSON.stringify({
          branchId: 'b123',
          restaurantId: 'r123',
          operationalStatus: 'OPEN',
          overrideDurationMinutes: null,
        }),
      })

      const response = await PATCH(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Permissions', () => {
    it('should enforce permission check on PATCH', async () => {
      vi.mocked(validateStatusUpdatePermission).mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const request = new NextRequest('http://localhost/api/dashboard/status', {
        method: 'PATCH',
        body: JSON.stringify({
          branchId: 'b123',
          restaurantId: 'r123',
          operationalStatus: 'OPEN',
        }),
      })

      const response = await PATCH(request)
      expect(response.status).toBeGreaterThanOrEqual(403)
    })
  })
})
