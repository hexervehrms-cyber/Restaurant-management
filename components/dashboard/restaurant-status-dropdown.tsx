'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useUIStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function RestaurantStatusDropdown() {
  const { restaurantStatus, setRestaurantStatus } = useUIStore()
  const [showToast, setShowToast] = useState(false)

  const statusOptions = [
    {
      value: 'open' as const,
      label: 'Open',
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10 border-success/30',
      description: 'Restaurant is open for orders',
    },
    {
      value: 'busy' as const,
      label: 'Busy',
      icon: AlertCircle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      description: 'Restaurant is at full capacity',
    },
    {
      value: 'closed' as const,
      label: 'Closed',
      icon: Clock,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10 border-destructive/30',
      description: 'Restaurant is closed',
    },
  ]

  const currentStatus = statusOptions.find((s) => s.value === restaurantStatus)

  const handleStatusChange = (status: 'open' | 'busy' | 'closed') => {
    setRestaurantStatus(status)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  return (
    <>
      <DropdownMenu>
        {/* 
          MenuPrimitive.Trigger is a button. 
          Put content directly inside. Do NOT nest Button.
        */}
        <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[0.8rem] font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          {currentStatus && (
            <>
              <currentStatus.icon className={cn('size-4', currentStatus.color)} />
              <span>{currentStatus.label}</span>
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
              className={cn(
                'flex items-center gap-3 cursor-pointer',
                restaurantStatus === option.value && 'bg-primary/10'
              )}
            >
              <option.icon className={cn('size-4', option.color)} />
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
              {restaurantStatus === option.value && (
                <CheckCircle className="size-4 text-success ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className={cn(
            'px-4 py-3 rounded-lg border flex items-center gap-2',
            currentStatus?.bgColor
          )}>
            {currentStatus && (
              <>
                <currentStatus.icon className={cn('size-4', currentStatus.color)} />
                <span className="text-sm font-medium">
                  Status changed to {currentStatus.label}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
