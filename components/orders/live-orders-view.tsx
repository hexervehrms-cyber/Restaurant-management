'use client'

import { useState } from 'react'
import {
  Clock, Zap, Users, ChefHat, CheckCircle2, AlertTriangle,
  Flame, Filter, ArrowUpDown, MoreHorizontal, Eye, Printer,
  Receipt, ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { liveOrders, type Order, type OrderStatus } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const statusConfig: Record<OrderStatus, {
  label: string
  icon: React.ElementType
  badge: string
  row: string
}> = {
  pending: {
    label: 'Pending',
    icon: AlertTriangle,
    badge: 'border-warning/40 bg-warning/10 text-warning',
    row: 'border-l-warning',
  },
  accepted: {
    label: 'Accepted',
    icon: ChefHat,
    badge: 'border-primary/40 bg-primary/10 text-primary',
    row: 'border-l-primary',
  },
  cooking: {
    label: 'Cooking',
    icon: Flame,
    badge: 'border-chart-4/40 bg-chart-4/10 text-chart-4',
    row: 'border-l-chart-4',
  },
  ready: {
    label: 'Ready',
    icon: CheckCircle2,
    badge: 'border-success/40 bg-success/10 text-success',
    row: 'border-l-success',
  },
  served: {
    label: 'Served',
    icon: CheckCircle2,
    badge: 'bg-muted text-muted-foreground border-border',
    row: 'border-l-border',
  },
}

const priorityConfig = {
  normal: { dot: 'bg-muted-foreground/40', label: 'Normal' },
  high: { dot: 'bg-warning', label: 'High' },
  urgent: { dot: 'bg-destructive animate-pulse', label: 'Urgent' },
}

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = statusConfig[order.status]
  const pri = priorityConfig[order.priority]
  const StatusIcon = cfg.icon

  return (
    <div className={cn(
      'border-b border-border last:border-0 border-l-2 transition-colors',
      cfg.row,
      expanded ? 'bg-accent/30' : 'hover:bg-muted/30'
    )}>
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Priority dot */}
        <span className={cn('size-2 shrink-0 rounded-full', pri.dot)} />

        {/* Order ID */}
        <div className="w-24 shrink-0">
          <span className="text-sm font-semibold font-mono">{order.id}</span>
        </div>

        {/* Table & waiter */}
        <div className="flex flex-col gap-0.5 w-32 shrink-0">
          <span className="text-xs font-medium">Table {order.tableNumber}</span>
          <span className="text-xs text-muted-foreground">{order.waiter}</span>
        </div>

        {/* Items summary */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">
            {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
          </p>
        </div>

        {/* Status badge */}
        <Badge variant="outline" className={cn('text-xs h-6 px-2 gap-1.5 shrink-0', cfg.badge)}>
          <StatusIcon className="size-3" />
          {cfg.label}
        </Badge>

        {/* Time */}
        <div className="flex items-center gap-1.5 w-20 shrink-0">
          <Clock className="size-3.5 text-muted-foreground" />
          <span className={cn(
            'text-xs font-mono font-medium',
            order.ticketTime > 20 ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {order.ticketTime}m ago
          </span>
        </div>

        {/* Total */}
        <div className="w-24 shrink-0 text-right">
          <span className="text-sm font-semibold">₹{order.total.toLocaleString('en-IN')}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-7" />
              }
            >
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="gap-2">
                <Eye className="size-3.5" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Printer className="size-3.5" /> Print KOT
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Receipt className="size-3.5" /> Print Bill
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronRight className={cn(
            'size-4 text-muted-foreground transition-transform duration-150',
            expanded && 'rotate-90'
          )} />
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Items list */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Items
                </p>
                <div className="flex flex-col gap-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="text-xs font-medium">{item.name}</p>
                          {item.notes && (
                            <p className="text-xs text-warning mt-0.5">⚠ {item.notes}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill breakdown */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Bill
                </p>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount</span>
                      <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST (5%)</span>
                    <span>₹{order.tax.toLocaleString('en-IN')}</span>
                  </div>
                  <Separator className="my-0.5" />
                  <div className="flex justify-between font-bold text-sm">
                    <span>Total</span>
                    <span>₹{order.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <Separator className="mt-4 mb-3" />
            <div className="flex items-center gap-2">
              {order.status !== 'served' && (
                <Badge
                  variant="outline"
                  className={cn('gap-1', priorityConfig[order.priority].dot && 'text-xs')}
                >
                  <span className={cn('size-1.5 rounded-full', priorityConfig[order.priority].dot)} />
                  {priorityConfig[order.priority].label} priority
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                  <Printer className="size-3" />
                  KOT
                </Button>
                <Button size="sm" className="h-7 text-xs gap-1.5">
                  <Receipt className="size-3" />
                  Bill
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type TabFilter = 'all' | OrderStatus

export function LiveOrdersView() {
  const [tab, setTab] = useState<TabFilter>('all')

  const counts = {
    all: liveOrders.length,
    pending: liveOrders.filter((o) => o.status === 'pending').length,
    accepted: liveOrders.filter((o) => o.status === 'accepted').length,
    cooking: liveOrders.filter((o) => o.status === 'cooking').length,
    ready: liveOrders.filter((o) => o.status === 'ready').length,
    served: liveOrders.filter((o) => o.status === 'served').length,
  }

  const filtered = tab === 'all' ? liveOrders : liveOrders.filter((o) => o.status === tab)

  const urgentCount = liveOrders.filter((o) => o.priority === 'urgent').length
  const overdueCount = liveOrders.filter((o) => o.ticketTime > 20).length

  return (
    <main className="flex flex-col gap-6 p-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Active Orders', value: liveOrders.length, icon: Zap, color: 'text-primary' },
          { label: 'Ready to Serve', value: counts.ready, icon: CheckCircle2, color: 'text-success' },
          { label: 'Urgent', value: urgentCount, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Overdue (>20m)', value: overdueCount, icon: Clock, color: 'text-warning' },
        ].map((stat) => (
          <Card key={stat.label} className={cn(
            stat.label === 'Urgent' && urgentCount > 0 && 'border-destructive/30 bg-destructive/5',
            stat.label === 'Ready to Serve' && counts.ready > 0 && 'border-success/30 bg-success/5',
          )}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted', stat.color)}>
                <stat.icon className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="size-4 text-warning" />
              All Orders
              <div className="flex items-center gap-1 ml-1">
                <span className="size-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-normal text-muted-foreground">Live</span>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <Filter className="size-3" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <ArrowUpDown className="size-3" />
                Sort
              </Button>
            </div>
          </div>

          {/* Status tabs */}
          <div className="pt-3 pb-0">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)}>
              <TabsList className="h-8 bg-muted/50 p-0.5">
                {([
                  ['all', 'All'],
                  ['pending', 'Pending'],
                  ['accepted', 'Accepted'],
                  ['cooking', 'Cooking'],
                  ['ready', 'Ready'],
                ] as [TabFilter, string][]).map(([val, label]) => (
                  <TabsTrigger
                    key={val}
                    value={val}
                    className="h-7 px-3 text-xs gap-1.5 data-[state=active]:bg-background"
                  >
                    {label}
                    <span className={cn(
                      'flex size-4 items-center justify-center rounded-full text-[10px] font-bold',
                      'bg-muted text-muted-foreground',
                      tab === val && 'bg-primary/15 text-primary'
                    )}>
                      {counts[val]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        {/* Column headers */}
        <div className="flex items-center gap-4 px-5 py-2 border-y border-border bg-muted/20 mt-3">
          <span className="w-2 shrink-0" />
          <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">Order</span>
          <span className="w-32 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">Table / Waiter</span>
          <span className="flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Items</span>
          <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
          <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">Time</span>
          <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">Total</span>
          <span className="w-16 shrink-0" />
        </div>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                <CheckCircle2 className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No orders in this status</p>
            </div>
          ) : (
            <div>
              {filtered.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
