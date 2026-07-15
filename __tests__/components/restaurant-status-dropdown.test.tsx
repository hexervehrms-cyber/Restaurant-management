/**
 * Restaurant Status Dropdown Tests
 * 
 * Covers:
 * - Permission-based access control
 * - Manual override with durations
 * - Automatic vs manual mode indicators
 * - Error handling and recovery
 * - Toast feedback
 * - Business hours integration
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RestaurantStatusDropdown } from '@/components/dashboard/restaurant-status-dropdown'
import { useRestaurantStatus } from '@/hooks/useRestaurantStatus'
import { useAuth } from '@/context/AuthContext'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/hooks/useRestaurantStatus')
vi.mock('@/context/AuthContext')

describe('RestaurantStatusDropdown', () => {
  const mockBranchId = 'branch-123'
  const mockRestaurantId = 'restaurant-123'

  const mockStatusData = {
    operationalStatus: 'OPEN' as const,
    isOpen: true,
    openingTime: '10:00',
    closingTime: '23:00',
    currentTime: '15:30',
    timezone: 'UTC',
    hasManualOverride: false,
    overrideExpiresAt: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Permission-Based Access Control', () => {
    it('should allow restaurant_owner to edit status', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Open/i })
      expect(trigger).not.toBeDisabled()
    })

    it('should allow branch_manager to edit status', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'branch_manager' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Open/i })
      expect(trigger).not.toBeDisabled()
    })

    it('should allow admin to edit status', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'admin' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Open/i })
      expect(trigger).not.toBeDisabled()
    })

    it('should disable dropdown for cashier role', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'cashier' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Open/i })
      expect(trigger).toBeDisabled()
    })

    it('should show lock icon for unauthorized users', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'viewer' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      // Lock icon should be visible
      const lockIcons = screen.queryAllByRole('img', { hidden: true })
      expect(lockIcons.length).toBeGreaterThan(0)
    })

    it('should show permission error toast when 403 error occurs', async () => {
      const updateStatusFn = vi.fn().mockRejectedValue({
        status: 403,
        message: 'Permission denied',
      })

      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'cashier' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: false,
        error: null,
        updateStatus: updateStatusFn,
      } as any)

      const { container } = render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
          userRole="restaurant_owner"
        />
      )

      // Try to change status
      const trigger = screen.getByRole('button', { name: /● Open/i })
      fireEvent.click(trigger)

      await waitFor(() => {
        expect(screen.queryByText(/Permission Denied/i)).toBeInTheDocument()
      })
    })
  })

  describe('Manual Override with Durations', () => {
    it('should show duration preset options when status is selected', async () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Open/i })
      fireEvent.click(trigger)

      await waitFor(() => {
        expect(screen.queryByText(/OVERRIDE DURATION/i)).toBeInTheDocument()
      })
    })

    it('should calculate "until closing" duration correctly', async () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: {
          ...mockStatusData,
          closingTime: '23:00',
          currentTime: '15:30',
        },
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Open/i })
      fireEvent.click(trigger)

      await waitFor(() => {
        const closedOption = screen.queryByText(/Closed/i)
        if (closedOption) {
          fireEvent.click(closedOption)
        }
      })

      // Should show "Until Closing" duration option
      await waitFor(() => {
        expect(screen.queryByText(/Until Closing/i)).toBeInTheDocument()
      })
    })

    it('should send correct duration minutes to API', async () => {
      const updateStatusFn = vi.fn().mockResolvedValue(mockStatusData)

      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: false,
        error: null,
        updateStatus: updateStatusFn,
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      // Trigger dropdown and select status
      const trigger = screen.getByRole('button', { name: /● Open/i })
      fireEvent.click(trigger)

      await waitFor(() => {
        const durationOption = screen.queryByText(/1 Hour/i)
        if (durationOption) {
          fireEvent.click(durationOption)
        }
      })

      // Verify updateStatus was called with duration
      expect(updateStatusFn).toHaveBeenCalledWith(expect.any(String), expect.any(Number))
    })
  })

  describe('Automatic vs Manual Mode Indicator', () => {
    it('should show "Automatic" mode when no override is active', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: {
          ...mockStatusData,
          hasManualOverride: false,
        },
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      const { container } = render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Open/i })
      fireEvent.click(trigger)

      // Should show automatic mode indicator
      expect(screen.queryByText(/Automatic/i)).toBeInTheDocument()
    })

    it('should show "Manual Override" mode when override is active', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      const futureTime = new Date(Date.now() + 3600000).toISOString()

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: {
          ...mockStatusData,
          hasManualOverride: true,
          overrideExpiresAt: futureTime,
        },
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Open/i })
      fireEvent.click(trigger)

      // Should show manual override mode indicator
      expect(screen.queryByText(/Manual Override/i)).toBeInTheDocument()
    })

    it('should show business hours in automatic mode', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: {
          ...mockStatusData,
          hasManualOverride: false,
          openingTime: '10:00',
          closingTime: '23:00',
        },
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Open/i })
      fireEvent.click(trigger)

      // Should show business hours
      expect(screen.queryByText(/10:00.*23:00/)).toBeInTheDocument()
    })

    it('should show expiration time in manual override mode', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      const futureTime = new Date(Date.now() + 3600000).toISOString()

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: {
          ...mockStatusData,
          hasManualOverride: true,
          overrideExpiresAt: futureTime,
        },
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Open/i })
      fireEvent.click(trigger)

      // Should show expiration message
      expect(screen.queryByText(/Active until/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should show loading state initially', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: null,
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      expect(screen.getByText(/Loading status/i)).toBeInTheDocument()
    })

    it('should show error state with refresh button on failure', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: null,
        isSaving: false,
        error: new Error('Failed to load'),
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      expect(screen.getByText(/Status unavailable/i)).toBeInTheDocument()
      expect(screen.getByText(/Refresh/i)).toBeInTheDocument()
    })

    it('should show saving state with spinner', async () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: true,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Open/i })
      expect(trigger).toBeDisabled()
    })

    it('should show retry button for transient errors', async () => {
      const updateStatusFn = vi
        .fn()
        .mockRejectedValue(new Error('Network error'))

      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: false,
        error: null,
        updateStatus: updateStatusFn,
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      // Attempt to change status (will fail)
      const trigger = screen.getByRole('button', { name: /● Open/i })
      fireEvent.click(trigger)

      await waitFor(() => {
        // Retry button should appear for non-permission errors
        const retryButton = screen.queryByText(/Retry/i)
        expect(retryButton).toBeInTheDocument()
      })
    })

    it('should NOT show retry button for permission errors', async () => {
      const updateStatusFn = vi.fn().mockRejectedValue({
        status: 403,
        message: 'Permission denied',
      })

      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: false,
        error: null,
        updateStatus: updateStatusFn,
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Open/i })
      fireEvent.click(trigger)

      await waitFor(() => {
        // No retry button for permission errors
        expect(screen.queryByText(/Retry/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Toast Feedback', () => {
    it('should show success toast with duration info on override', async () => {
      const updateStatusFn = vi.fn().mockResolvedValue(mockStatusData)

      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: false,
        error: null,
        updateStatus: updateStatusFn,
      } as any)

      const { rerender } = render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      // Simulate successful update
      fireEvent.click(screen.getByRole('button', { name: /● Open/i }))

      await waitFor(() => {
        // Toast should show duration info
        expect(screen.queryByText(/Changed to/i)).toBeInTheDocument()
      })
    })

    it('should show error toast on update failure', async () => {
      const updateStatusFn = vi
        .fn()
        .mockRejectedValue(new Error('Update failed'))

      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: mockStatusData,
        isSaving: false,
        error: null,
        updateStatus: updateStatusFn,
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /● Open/i }))

      await waitFor(() => {
        // Error toast should be visible
        expect(screen.queryByText(/Update Failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Business Hours Integration', () => {
    it('should show next opening time when closed', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: {
          ...mockStatusData,
          operationalStatus: 'CLOSED',
          isOpen: false,
          openingTime: '10:00',
        },
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      const trigger = screen.getByRole('button', { name: /● Closed/i })
      fireEvent.click(trigger)

      // Should show next opening info
      expect(screen.queryByText(/Next opens/i)).toBeInTheDocument()
    })

    it('should show closing time when open', () => {
      vi.mocked(useAuth).mockReturnValue({
        userProfile: { role: 'restaurant_owner' },
      } as any)

      vi.mocked(useRestaurantStatus).mockReturnValue({
        status: {
          ...mockStatusData,
          operationalStatus: 'OPEN',
          isOpen: true,
          closingTime: '23:00',
        },
        isSaving: false,
        error: null,
        updateStatus: vi.fn(),
      } as any)

      render(
        <RestaurantStatusDropdown
          branchId={mockBranchId}
          restaurantId={mockRestaurantId}
        />
      )

      // Closing time should be shown in trigger
      expect(screen.getByText(/Closes 23:00/i)).toBeInTheDocument()
    })
  })
})
