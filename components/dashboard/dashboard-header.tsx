'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardHeader } from '@/hooks/useDashboardHeader'

interface DashboardHeaderProps {
  branchId: string
}

export function DashboardHeader({ branchId }: DashboardHeaderProps) {
  const { data, loading, error } = useDashboardHeader(branchId)

  // Loading state
  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-destructive">
          Error loading dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {error || 'Unable to fetch dashboard information'}
        </p>
      </div>
    )
  }

  // Success state - Greeting + Restaurant Name only
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">
        {data.userGreeting}, {data.userName}
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        {data.restaurantName} — {data.branchName}
      </p>
    </div>
  )
}
