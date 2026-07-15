'use client'

import { useMemo, useState } from 'react'
import { CheckCircle, AlertCircle, Clock, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useRestaurantStatus } from '@/hooks/useRestaurantStatus'
import { cn } from '@/lib/utils'

export interface RestaurantStatusDropdownProps {
  branchId: string
  restaurantId: string
}

export function RestaurantStatusDropdown({ branchId, restaurantId }: RestaurantStatusDropdownProps) {
  const { status, isSaving, error, updateStatus } = useRestaurantStatus({
    branchId,
    restaurantId,
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  })

  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastError, setToastError] = useState(false)

  const statusOptions = [
    {
      value: 'OPEN' as const,
      label: 'Open',
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10 border-green-500/30',
      dotColor: 'bg-green-500',
      description: 'Restaurant is open for orders',
    },
    {
      value: 'RUSH_HOUR' as const,
      label: 'Rush Hour',
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      dotColor: 'bg-amber-500',
      description: 'High demand, longer wait times',
    },
    {
      value: 'CLOSED' as const,
      label: 'Closed',
      icon: Clock,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10 border-red-500/30',
      dotColor: 'bg-red-500',
      description: 'Restaurant is closed',
    },
  ]

  const currentStatus = status ? statusOptions.find((s) => s.value === status.operationalStatus) : null

  const handleStatusChange = async (newStatus: 'OPEN' | 'RUSH_HOUR' | 'CLOSED') => {
    try {
      await updateStatus(newStatus)
      setToastMessage(`Status changed to ${statusOptions.find(s => s.value === newStatus)?.label}`)
      setToastError(false)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (err) {
      setToastMessage('Failed to update status. Please try again.')
      setToastError(true)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
    }
  }

  // Loading state
  if (!status) {
    return (
      <div className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-sm font-medium">
        <Loader2 className="size-3 animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger 
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-sm font-medium transition-all hover:bg-muted/70 hover:border-border/80 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          {currentStatus && (
            <>
              <div className={cn('size-2 rounded-full', currentStatus.dotColor)} />
              <span>● {currentStatus.label}</span>
              {status.operationalStatus === 'OPEN' && status.closingTime && (
                <span className="text-xs text-muted-foreground ml-1">
                  Closes {status.closingTime}
                </span>
              )}
              {isSaving && <Loader2 className="size-3 ml-1 animate-spin" />}
            </>
          )}
        </DropdownMenuTrigger>

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
                status.operationalStatus === option.value && 'bg-primary/10',
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
            >
              <option.icon className={cn('size-4', option.color)} />
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
              {status.operationalStatus === option.value && (
                <CheckCircle className="size-4 text-green-500 ml-auto" />
              )}
            </DropdownMenuItem>
          ))}

          {status.hasManualOverride && (
            <>
              <DropdownMenuSeparator />
              <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">
                Manual override active until {status.overrideExpiresAt ? new Date(status.overrideExpiresAt).toLocaleTimeString() : 'unknown'}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className={cn(
            'px-4 py-3 rounded-lg border flex items-center gap-2',
            toastError
              ? 'bg-red-500/10 border-red-500/30'
              : currentStatus?.bgColor
          )}>
            {toastError ? (
              <AlertCircle className="size-4 text-red-500" />
            ) : currentStatus ? (
              <currentStatus.icon className={cn('size-4', currentStatus.color)} />
            ) : null}
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  )
}
