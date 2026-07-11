'use client'

import { Clock, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { liveOrders } from '@/lib/mock-data'
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
            {liveOrders.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0 min-h-0">
        <ScrollArea className="h-[340px]">
          <div className="flex flex-col gap-2.5 pr-3">
            {liveOrders.map((order) => {
              const config = statusConfig[order.status]
              return (
                <div
                  key={order.id}
                  className="group rounded-xl border border-border bg-card p-3 hover:border-primary/30 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('size-2 shrink-0 rounded-full', priorityDot[order.priority])} />
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
                    {order.items.slice(0, 2).map((item) => (
                      <p key={item.id} className="text-xs text-muted-foreground">
                        {item.quantity}× {item.name}
                        {item.notes && <span className="text-warning/80"> · {item.notes}</span>}
                      </p>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{order.items.length - 2} more items
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      <span>{order.ticketTime}m ago</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span>{order.waiter}</span>
                    </div>
                    <span className="text-xs font-semibold">₹{order.total.toLocaleString('en-IN')}</span>
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
