'use client'
'use client'

import { useEffect, useState, useRef } from 'react'
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Star,
  TrendingUp,
  AlertTriangle,
  Clock,
  Flame,
  ArrowRight,
  ChefHat,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { StatCard } from '@/components/ui/stat-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { LiveOrdersFeed } from '@/components/dashboard/live-orders-feed'
import { TableOccupancyGrid } from '@/components/dashboard/table-occupancy-grid'
import { useDashboardKPIs } from '@/hooks/useDashboardKPIs'
import type { DashboardKPIResponse } from '@/types/dashboard'
import { topDishes, inventoryAlerts } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface DashboardOverviewProps {
  branchId?: string
  restaurantId?: string
}

/**
 * Dashboard Overview Component
 * 
 * Phase 8.1: Enterprise Dashboard KPI Backend Integration
 * 
 * This component now displays live backend data instead of hardcoded values.
 * 
 * Data Flow:
 * useDashboardKPIs Hook
 *   ↓
 * GET /api/dashboard/kpis
 *   ↓
 * DashboardKPIService.getDashboardKPIs()
 *   ↓
 * Multiple Firestore Queries (optimized)
 *   ↓
 * Real-time KPI Data
 */
export function DashboardOverview({ branchId = '829b1e49-87b3-4cc9-a4a9-4e719bf4440c', restaurantId = '' }: DashboardOverviewProps) {
  const [updatingKPIs, setUpdatingKPIs] = useState<Set<string>>(new Set())
  const prevKPIsRef = useRef<DashboardKPIResponse | null>(null)

  console.log('[DashboardOverview] Rendered with branchId:', branchId)

  // Subscribe to real-time dashboard KPIs via polling
  const { data: kpis, loading, error, refresh, isLive } = useDashboardKPIs({
    branchId: branchId || '829b1e49-87b3-4cc9-a4a9-4e719bf4440c',
    enabled: true,
    pollInterval: 60000, // Poll every 1 minute
  })

  console.log('[DashboardOverview] Hook state:', { loading, hasData: !!kpis, hasError: !!error, isLive })

  // Detect which KPIs changed and show update animation
  useEffect(() => {
    if (!kpis || !prevKPIsRef.current) {
      prevKPIsRef.current = kpis
      return
    }

    const updated = new Set<string>()

    // Check each KPI for changes - with defensive guards against undefined properties
    if (kpis.revenue?.current !== prevKPIsRef.current.revenue?.current) {
      updated.add('revenue')
    }
    if (kpis.orders?.current !== prevKPIsRef.current.orders?.current) {
      updated.add('orders')
    }
    if (kpis.averageTicket?.current !== prevKPIsRef.current.averageTicket?.current) {
      updated.add('averageTicket')
    }
    if (kpis.occupancy?.occupancyPercent !== prevKPIsRef.current.occupancy?.occupancyPercent) {
      updated.add('occupancy')
    }
    if (kpis.guests?.current !== prevKPIsRef.current.guests?.current) {
      updated.add('guests')
    }
    if (kpis.satisfaction?.rating !== prevKPIsRef.current.satisfaction?.rating) {
      updated.add('satisfaction')
    }

    if (updated.size > 0) {
      setUpdatingKPIs(updated)

      // Clear animation after 1 second
      const timer = setTimeout(() => {
        setUpdatingKPIs(new Set())
      }, 1000)

      return () => clearTimeout(timer)
    }

    prevKPIsRef.current = kpis
  }, [kpis])

  // Loading state
  if (loading && !kpis) {
    console.log('[DashboardOverview] Rendering skeleton loader (loading=true, kpis=null)')
    return (
      <div className="space-y-6">
        {/* Debug info - temporary */}
        <div className="text-xs text-muted-foreground text-center py-2">
          Loading KPI data...
        </div>

        {/* KPI Skeleton */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-80 rounded-lg bg-muted animate-pulse" />
          <div className="h-80 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  // Error state
  if (error && !kpis) {
    console.log('[DashboardOverview] Rendering error state:', error.message)
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              <div>
                <p className="text-sm font-medium">Failed to load dashboard data</p>
                <p className="text-xs text-muted-foreground">{error.message}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="text-xs"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!kpis) {
    console.log('[DashboardOverview] Rendering empty state (kpis is null, loading=false, error=null)')
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* ── Live Status Indicator ────────────────────────────── */}
      {isLive && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <Flame className="size-3 mr-1 animate-pulse" />
            Live Updates
          </Badge>
          <span className="text-xs text-muted-foreground">
            Real-time data streaming
          </span>
        </div>
      )}

      {console.log('[DashboardOverview] ✓ Rendering KPI cards with data:', { 
        revenue: kpis.revenue?.current,
        orders: kpis.orders?.count,
        occupancy: kpis.occupancy?.occupancyPercent,
        guests: kpis.guests?.count,
      })}

      {/* Error banner if connection lost but data exists */}
      {error && kpis && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Connection interrupted
                  </p>
                  <p className="text-xs text-amber-700">
                    {error.message}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="text-xs"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── KPI Stats (Now with Live Backend Data) ────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* Today's Revenue */}
        <StatCard
          title="Today's Revenue"
          value={kpis.revenue?.current ?? 0}
          prefix="₹"
          change={kpis.revenue?.changePercent ?? 0}
          positive={kpis.revenue?.trend === 'up'}
          icon={IndianRupee}
          iconColor="text-primary"
          className="col-span-2 md:col-span-1 lg:col-span-2"
          isUpdating={updatingKPIs.has('revenue')}
        />

        {/* Total Orders */}
        <StatCard
          title="Total Orders"
          value={kpis.orders?.count ?? 0}
          change={kpis.orders?.changePercent ?? 0}
          positive={kpis.orders?.trend === 'up'}
          icon={ShoppingBag}
          iconColor="text-chart-1"
          isUpdating={updatingKPIs.has('orders')}
        />

        {/* Average Ticket */}
        <StatCard
          title="Avg Ticket"
          value={kpis.averageTicket?.current ?? 0}
          prefix="₹"
          change={kpis.averageTicket?.changePercent ?? 0}
          positive={kpis.averageTicket?.trend === 'up'}
          icon={TrendingUp}
          iconColor="text-chart-3"
          isUpdating={updatingKPIs.has('averageTicket')}
        />

        {/* Table Occupancy */}
        <StatCard
          title="Table Occupancy"
          value={kpis.occupancy?.occupancyPercent ?? 0}
          suffix="%"
          change={kpis.occupancy?.change ?? 0}
          positive={kpis.occupancy?.trend === 'up'}
          icon={Users}
          iconColor="text-chart-2"
          isUpdating={updatingKPIs.has('occupancy')}
        />

        {/* New Guests */}
        <StatCard
          title="New Guests"
          value={kpis.guests?.count ?? 0}
          change={kpis.guests?.changePercent ?? 0}
          positive={kpis.guests?.trend === 'up'}
          icon={Users}
          iconColor="text-chart-4"
          isUpdating={updatingKPIs.has('guests')}
        />

        {/* Customer Satisfaction */}
        <StatCard
          title="Satisfaction"
          value={kpis.satisfaction?.rating ?? 0}
          suffix="/5"
          change={kpis.satisfaction?.change ?? 0}
          positive={kpis.satisfaction?.trend === 'up'}
          icon={Star}
          iconColor="text-warning"
          isUpdating={updatingKPIs.has('satisfaction')}
        />
      </div>

      {/* ── Main content grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue chart — spans 2 cols */}
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>

        {/* Live orders feed */}
        <div>
          <LiveOrdersFeed />
        </div>
      </div>

      {/* ── Bottom row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Table occupancy mini map */}
        <div className="lg:col-span-2">
          <TableOccupancyGrid />
        </div>

        {/* Right column: top dishes + inventory alerts */}
        <div className="flex flex-col gap-6">
          {/* Top Dishes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Top Dishes Today</CardTitle>
                  <CardDescription className="text-xs">By order count</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                  View all <ArrowRight className="size-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {topDishes.map((dish, i) => (
                <div key={dish.id} className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium truncate">{dish.name}</span>
                      <span className="text-xs font-semibold text-success shrink-0">{dish.trend}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(dish.orders / 60) * 100} className="h-1 flex-1" />
                      <span className="text-xs text-muted-foreground shrink-0">{dish.orders} orders</span>
                    </div>
                  </div>
                  <div className={cn(
                    'size-2 shrink-0 rounded-full',
                    dish.isVeg ? 'bg-success' : 'bg-destructive'
                  )} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Inventory Alerts */}
          <Card className="border-warning/20 bg-warning/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-warning" />
                <CardTitle className="text-sm font-semibold">Inventory Alerts</CardTitle>
                <Badge variant="secondary" className="ml-auto text-xs">{inventoryAlerts.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 pt-0">
              {inventoryAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-medium truncate">{alert.item}</span>
                    <span className="text-xs text-muted-foreground">
                      {alert.current} {alert.unit} remaining
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs shrink-0',
                      alert.status === 'critical'
                        ? 'border-destructive/50 text-destructive bg-destructive/5'
                        : 'border-warning/50 text-warning bg-warning/5'
                    )}
                  >
                    {alert.status === 'critical' ? 'Critical' : 'Low'}
                  </Badge>
                </div>
              ))}
              <Separator />
              <Button variant="outline" size="sm" className="w-full text-xs h-7">
                View Inventory
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Last Updated Indicator */}
      <div className="mt-4 flex justify-end text-xs text-muted-foreground">
        Last updated: {kpis?.lastUpdated ? new Date(kpis.lastUpdated).toLocaleTimeString() : 'N/A'}
      </div>
    </>
  )
}
