'use client'

import {
  IndianRupee, ShoppingBag, Users, Star, TrendingUp,
  AlertTriangle, Clock, Flame, ArrowRight, ChefHat,
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
import {
  todayStats, topDishes, inventoryAlerts, tables,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function DashboardOverview() {
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length
  const totalTables = tables.length
  const occupancyPct = Math.round((occupiedTables / totalTables) * 100)

  return (
    <>
      {/* ── KPI Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Today's Revenue"
          value={todayStats.revenue.value}
          prefix="₹"
          change={todayStats.revenue.change}
          positive={todayStats.revenue.positive}
          icon={IndianRupee}
          iconColor="text-primary"
          className="col-span-2 md:col-span-1 lg:col-span-2"
        />
        <StatCard
          title="Total Orders"
          value={todayStats.orders.value}
          change={todayStats.orders.change}
          positive={todayStats.orders.positive}
          icon={ShoppingBag}
          iconColor="text-chart-1"
        />
        <StatCard
          title="Avg Ticket"
          value={todayStats.avgTicket.value}
          prefix="₹"
          change={todayStats.avgTicket.change}
          positive={todayStats.avgTicket.positive}
          icon={TrendingUp}
          iconColor="text-chart-3"
        />
        <StatCard
          title="Table Occupancy"
          value={todayStats.tableOccupancy.value}
          suffix="%"
          change={todayStats.tableOccupancy.change}
          positive={todayStats.tableOccupancy.positive}
          icon={Users}
          iconColor="text-chart-2"
        />
        <StatCard
          title="New Guests"
          value={todayStats.newCustomers.value}
          change={todayStats.newCustomers.change}
          positive={todayStats.newCustomers.positive}
          icon={Users}
          iconColor="text-chart-4"
        />
        <StatCard
          title="Satisfaction"
          value={todayStats.satisfaction.value}
          suffix="/5"
          change={todayStats.satisfaction.change}
          positive={todayStats.satisfaction.positive}
          icon={Star}
          iconColor="text-warning"
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
    </>
  )
}
