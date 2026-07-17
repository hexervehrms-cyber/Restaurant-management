'use client'

import { Loader2, AlertTriangle, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLiveOrders } from '@/hooks/useLiveOrders'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-warning/15 text-warning border-warning/30' },
  accepted: { label: 'Accepted', className: 'bg-primary/15 text-primary border-primary/30' },
  cooking: { label: 'Cooking', className: 'bg-chart-4/15 text-chart-4 border-chart-4/30' },
  ready: { label: 'Ready', className: 'bg-success/15 text-success border-success/30' },
  served: { label: 'Served', className: 'bg-muted text-muted-foreground border-border' },
}

const priorityDot = {
  normal: 'bg-muted-foreground',
  high: 'bg-warning',
  urgent: 'bg-destructive animate-pulse',
}

export function LiveOrdersFeed() {
  const { userProfile } = useAuth()
  const branchId = userProfile?.branchId
  const { data: ordersData, loading, error } = useLiveOrders(branchId)

  // Extract the orders array from the response object, default to empty array
  const orders = ordersData?.orders || []
  const activeOrdersCount = orders.length

  if (!branchId) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="size-4 text-warning" />
            Live Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="size-4" />
            Branch information not available
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading && !orders.length) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="size-4 text-warning" />
            Live Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-6 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error && !orders.length) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="size-4 text-warning" />
            Live Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" />
            {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="size-4 text-warning" />
            Live Orders
          </CardTitle>
          <Badge variant="secondary" className="text-xs gap-1">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            {activeOrdersCount} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0 min-h-0">
        <ScrollArea className="h-[340px]">
          <div className="flex flex-col gap-2.5 pr-3">
            {orders.map((order) => {
              const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
              return (
                <div
                  key={order.id}
                  className="group rounded-xl border border-border bg-card p-3 hover:border-primary/30 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('size-2 shrink-0 rounded-full', priorityDot[order.priority as keyof typeof priorityDot] || priorityDot.normal)} />
                      <span className="text-xs font-semibold">{order.id}</span>
                      <span className="text-xs text-muted-foreground">· T{order.tableNumber}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] h-5 px-1.5 font-medium', config.className)}
                    >
                      {config.label}
                    </Badge>
                  </div>

                  {/* Items */}
                  <div className="flex flex-col gap-0.5 mb-2">
                    {order.items?.slice(0, 2).map((item, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        {item.quantity}× {item.name}
                        {item.notes && <span className="text-warning/80"> · {item.notes}</span>}
                      </p>
                    ))}
                    {order.items && order.items.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{order.items.length - 2} more items
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-muted-foreground flex items-center gap-1">
                      <span>{order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                    <span className="font-semibold">₹{typeof order.total === 'number' ? order.total.toLocaleString('en-IN') : '0'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
