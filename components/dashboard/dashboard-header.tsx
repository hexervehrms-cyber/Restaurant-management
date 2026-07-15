'use client'

import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RestaurantStatusDropdown } from './restaurant-status-dropdown'
import { useDashboardHeader } from '@/hooks/useDashboardHeader'

interface DashboardHeaderProps {
  branchId: string
}

export function DashboardHeader({ branchId }: DashboardHeaderProps) {
  const { data, loading, error } = useDashboardHeader(branchId)

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-destructive">
            Error loading dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {error || 'Unable to fetch dashboard information'}
          </p>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {data.userGreeting}, {data.userName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {data.restaurantName} — {data.branchName}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={`gap-1.5 border-success/30 ${
            data.isOpen
              ? 'text-success bg-success/5'
              : 'text-destructive border-destructive/30 bg-destructive/5'
          }`}
        >
          <span
            className={`size-1.5 rounded-full animate-pulse ${
              data.isOpen ? 'bg-success' : 'bg-destructive'
            }`}
          />
          {data.isOpen ? 'Restaurant Open' : 'Restaurant Closed'}
        </Badge>
        {data.closingTime && data.isOpen && (
          <Button size="sm" variant="outline">
            <Clock className="size-3.5" />
            <span>Close at {data.closingTime}</span>
          </Button>
        )}
        <RestaurantStatusDropdown />
      </div>
    </div>
  )
}
