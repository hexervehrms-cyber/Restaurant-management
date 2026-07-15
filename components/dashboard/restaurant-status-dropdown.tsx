'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Zap, Clock, Loader2, Lock } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useRestaurantStatus } from '@/hooks/useRestaurantStatus'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { canUserEditStatus } from '@/lib/utils/restaurant-status'

export interface RestaurantStatusDropdownProps {
  branchId: string
  restaurantId: string
  userRole?: string
}

// Roles that can modify restaurant status
const EDITABLE_ROLES = ['restaurant_owner', 'branch_manager', 'admin']

export function RestaurantStatusDropdown({
  branchId,
  restaurantId,
  userRole,
}: RestaurantStatusDropdownProps) {
  const { userProfile } = useAuth()
  const { status, isSaving, error, updateStatus } = useRestaurantStatus({
    branchId,
    restaurantId,
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  })

  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [showPermissionError, setShowPermissionError] = useState(false)

  // Determine user's actual role
  const actualUserRole = userRole || userProfile?.role || 'viewer'
  const canEditStatus = canUserEditStatus(actualUserRole)

  // Status options - simplified
  const statusOptions = [
    {
      value: 'OPEN' as const,
      label: 'Open',
      icon: CheckCircle,
      dotColor: 'bg-green-500',
    },
    {
      value: 'RUSH_HOUR' as const,
      label: 'Rush Hour',
      icon: Zap,
      dotColor: 'bg-amber-500',
    },
    {
      value: 'CLOSED' as const,
      label: 'Closed',
      icon: Clock,
      dotColor: 'bg-red-500',
    },
  ]

  const currentStatus = status
    ? statusOptions.find((s) => s.value === status.operationalStatus)
    : null

  const handleStatusChange = async (newStatus: 'OPEN' | 'RUSH_HOUR' | 'CLOSED') => {
    if (!canEditStatus) {
      setShowPermissionError(true)
      setTimeout(() => setShowPermissionError(false), 4000)
      return
    }

    try {
      await updateStatus(newStatus)

      setToastType('success')
      setToastMessage(`Status changed to ${statusOptions.find((s) => s.value === newStatus)?.label}`)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (err: any) {
      if (err.status === 403) {
        setShowPermissionError(true)
        setTimeout(() => setShowPermissionError(false), 4000)
      } else {
        setToastType('error')
        setToastMessage('Failed to update status')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 4000)
      }
    }
  }

  // Loading state
  if (!status) {
    return (
      <div className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-sm font-medium">
        <Loader2 className="size-3 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    )
  }

  // Error state
  if (error && !status) {
    return (
      <div className="inline-flex items-center gap-2">
        <div className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-600">
          <AlertCircle className="size-3" />
          <span>Status unavailable</span>
        </div>
      </div>
    )
  }

  const trigger = (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-sm font-medium transition-all',
        canEditStatus
          ? 'hover:bg-muted/70 hover:border-border/80 cursor-pointer'
          : 'opacity-75 cursor-not-allowed',
        isSaving && 'opacity-60'
      )}
      title={
        isSaving
          ? 'Updating status...'
          : canEditStatus
            ? 'Click to change status'
            : 'You do not have permission to change status'
      }
    >
      {currentStatus && (
        <>
          <div className={cn('size-2 rounded-full', currentStatus.dotColor)} />
          <span>{currentStatus.label}</span>
          {isSaving && <Loader2 className="size-3 animate-spin" />}
        </>
      )}
    </div>
  )

  const dropdownContent = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isSaving || !canEditStatus}>
        {trigger}
      </DropdownMenuTrigger>

      {canEditStatus && (
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Restaurant Status</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={isSaving}
              className={cn(
                'flex items-center gap-3 cursor-pointer',
                status.operationalStatus === option.value && 'bg-muted',
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className={cn('size-2 rounded-full', option.dotColor)} />
              <span className="text-sm">{option.label}</span>
              {status.operationalStatus === option.value && (
                <CheckCircle className="size-3 ml-auto text-green-600 flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )

  // If user can't edit, wrap in tooltip
  if (!canEditStatus) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              {trigger}
              <div className="absolute -top-1 -right-1 flex items-center justify-center size-4 rounded-full bg-red-500/20 border border-red-500/50">
                <Lock className="size-2.5 text-red-500" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>You do not have permission to change restaurant status.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <>
      {dropdownContent}

      {/* Permission Error Toast */}
      {showPermissionError && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="px-4 py-3 rounded-lg border bg-red-500/10 border-red-500/30 flex items-center gap-2">
            <AlertCircle className="size-4 text-red-500" />
            <span className="text-sm font-medium">
              You do not have permission to change restaurant status.
            </span>
          </div>
        </div>
      )}

      {/* Status Change Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div
            className={cn(
              'px-4 py-3 rounded-lg border',
              toastType === 'error'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-green-500/10 border-green-500/30'
            )}
          >
            <div className="flex items-center gap-2">
              {toastType === 'error' ? (
                <AlertCircle className="size-4 text-red-500 flex-shrink-0" />
              ) : (
                <CheckCircle className="size-4 text-green-500 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{toastMessage}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
